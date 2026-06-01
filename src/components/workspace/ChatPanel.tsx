"use client";

import React, { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/stores/project";
import { useUserStore } from "@/stores/user";
import { parseAiResponse, getCleanExplanation } from "@/lib/ai/parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, Loader2, KeyRound, Bug } from "lucide-react";
import AdBanner from "@/components/layout/AdBanner";
import Link from "next/link";
import { toast } from "sonner";

export default function ChatPanel() {
  const { 
    currentProjectId, 
    chatMessages, 
    addChatMessage, 
    files, 
    createFile, 
    deleteFile, 
    saveFileToDb,
    runtimeError,
    scopedFile,
    setScopedFile
  } = useProjectStore();
  
  const { apiKeysStatus, profile } = useUserStore();
  const [provider, setProvider] = useState<string>("openai");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const keyAdded = apiKeysStatus[provider];
  const hasAds = profile?.subscription_tier === "free";

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    if (!keyAdded) {
      toast.warning(`Please add your API key for ${provider} in settings first.`);
      return;
    }

    setIsLoading(true);

    // 1. Add User Message to local store
    addChatMessage({
      role: "user",
      content: promptText,
    });

    // 2. Persist User Message to Supabase DB
    try {
      await fetch("/api/projects/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProjectId,
          role: "user",
          content: promptText,
        }),
      });
    } catch (err) {
      console.error("Failed to save user message to DB:", err);
    }

    // 3. Prepare messages history for the API call
    const messagesHistory = chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    
    // Append the current prompt
    messagesHistory.push({
      role: "user",
      content: promptText,
    });

    try {
      // 4. Trigger streaming call
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProjectId,
          messages: messagesHistory,
          provider,
          scopedFile,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate response from AI");
      }

      // Initialize assistant stream placeholder
      let assistantResponse = "";
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      // We add a temporary message inside UI that we'll modify as we stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;
      }

      // 5. On Finish: Add final assistant message to local Zustand store
      addChatMessage({
        role: "assistant",
        content: assistantResponse,
      });

      // 6. Persist final assistant message to Supabase DB
      try {
        await fetch("/api/projects/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: currentProjectId,
            role: "assistant",
            content: assistantResponse,
          }),
        });
      } catch (err) {
        console.error("Failed to save assistant response to DB:", err);
      }

      // 7. Parse file operations from XML tags
      const ops = parseAiResponse(assistantResponse);
      let count = 0;

      for (const op of ops) {
        // Skip locked files
        if (files[op.path]?.is_locked) {
          console.warn(`File is locked: ${op.path}. Skipping AI changes.`);
          continue;
        }

        if (op.type === "write") {
          await createFile(op.path, op.content);
          await saveFileToDb(op.path);
          count++;
        } else if (op.type === "delete") {
          await deleteFile(op.path);
        }
      }

      if (count > 0) {
        toast.success(`Successfully updated ${count} project file(s).`);
      }

    } catch (error: any) {
      console.error("AI Stream Error:", error);
      toast.error(error.message || "An error occurred during code generation");
      
      addChatMessage({
        role: "system",
        content: `Error: ${error.message || "Failed to generate response. Check your API key or network connection."}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const promptText = input.trim();
    if (!promptText) return;
    setInput("");
    await sendMessage(promptText);
  };

  const handleAutoFix = async () => {
    if (!runtimeError || isLoading) return;

    let resolvedSourcePath = runtimeError.source;
    if (!files[resolvedSourcePath]) {
      const match = Object.keys(files).find(
        (k) => k.endsWith(resolvedSourcePath) || resolvedSourcePath.endsWith(k)
      );
      if (match) resolvedSourcePath = match;
    }

    const errorFileContent = files[resolvedSourcePath]?.content || "";
    const autoFixPrompt = `Fix the runtime error in my project.
Location: ${runtimeError.source}
Error Message: ${runtimeError.message}

${errorFileContent ? `Current content of file ${resolvedSourcePath}:
\`\`\`tsx
${errorFileContent}
\`\`\`` : "Check the project files and solve this error."}

Identify the bug, explain it briefly, and rewrite the file using the standard file output blocks like:
<file path="${resolvedSourcePath}">
// corrected code
</file>`;

    await sendMessage(autoFixPrompt);
  };

  // Predefined quick prompts for the empty state
  const quickPrompts = [
    {
      title: "coffee shop landing page",
      label: "🚀 Landing Page",
      prompt: "Create a beautiful modern landing page for a cozy artisan coffee shop with a dynamic menu section, client testimonials, and a responsive booking table form."
    },
    {
      title: "crypto tracker dashboard",
      label: "📊 SaaS Dashboard",
      prompt: "Build an analytical crypto portfolio tracker dashboard featuring token balance cards, an interactive transaction history list, and a mockup coin price chart using SVG."
    },
    {
      title: "kanban task board",
      label: "🛠️ Task Manager",
      prompt: "Develop a Kanban-style board showing columns for Todo, In Progress, and Completed. Support adding new tasks, custom tag labels, and status moving."
    },
    {
      title: "personal bio link tree",
      label: "🎨 Link-in-Bio App",
      prompt: "Design a premium link-in-bio app for a designer, with glassmorphism profile card, animated social link buttons, and an integrated email contact form."
    }
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-zinc-950/80">
      {/* Header controls (Sleek Glassmorphic Header) */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950/40 h-11 px-4 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider font-mono">Opviber Copilot</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={provider} onValueChange={(val: string | null) => { if (val) setProvider(val); }}>
            <SelectTrigger className="w-[110px] h-7 text-[11px] bg-zinc-900/80 border-zinc-800 text-zinc-300 focus:ring-violet-600 focus:border-violet-600 rounded-md">
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectItem value="openai">OpenAI GPT-4</SelectItem>
              <SelectItem value="anthropic">Claude 3.5</SelectItem>
              <SelectItem value="google">Gemini 1.5</SelectItem>
              <SelectItem value="mistral">Mistral Large</SelectItem>
              <SelectItem value="groq">Groq Llama</SelectItem>
              <SelectItem value="xai">Grok Beta</SelectItem>
              <SelectItem value="cohere">Command R+</SelectItem>
            </SelectContent>
          </Select>
          
          {!keyAdded && (
            <Link href="/settings">
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-semibold transition">
                <KeyRound size={11} />
                Add Key
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Messages List (Modern Bubble Chat Feed) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800/80 scrollbar-track-transparent">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col justify-center min-h-full py-4 text-center max-w-sm mx-auto space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-2xl text-violet-400 shadow-xl shadow-violet-950/20 animate-bounce-slow">
                <Sparkles size={28} className="animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-zinc-100 tracking-tight">Create Anything Instantly</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Describe the web page or component you want to build. Opviber will generate the logic, layout, styles, and run it in the preview panel.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2 text-left">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(item.prompt)}
                  className="p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/50 hover:border-violet-500/40 rounded-xl transition text-left cursor-pointer flex flex-col justify-between group h-[90px]"
                >
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">{item.label}</span>
                  <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 line-clamp-2 leading-snug">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[88%] space-y-1.5 ${
                m.role === "user" ? "self-end ml-auto" : m.role === "system" ? "self-center max-w-full" : "self-start"
              }`}
            >
              {/* Sender Name Indicator */}
              <span className={`text-[10px] text-zinc-550 font-bold uppercase tracking-wider px-1 ${
                m.role === "user" ? "text-right" : ""
              }`}>
                {m.role === "user" ? "You" : m.role === "system" ? "System Core" : "Opviber AI"}
              </span>

              {/* Chat Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm transition-all ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm border border-violet-500/20"
                    : m.role === "system"
                    ? "bg-rose-950/20 border border-rose-900/50 text-rose-300 font-mono text-[11px] w-full max-w-xl text-center px-6 py-2.5 rounded-xl"
                    : "bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/80 text-zinc-200 rounded-tl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {m.role === "user" || m.role === "system" ? m.content : getCleanExplanation(m.content)}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Compile / Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2.5 text-zinc-450 text-xs py-2 px-1">
            <Loader2 size={13} className="animate-spin text-violet-500" />
            <span className="font-medium animate-pulse">Opviber compiler is assembling the files...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Workspace Ads (Only shown for free plans) */}
      {hasAds && (
        <div className="px-4 py-1.5 border-t border-zinc-900/80 bg-zinc-950/40">
          <AdBanner type="carbon" />
        </div>
      )}

      {/* Auto-Fix Alert Banner */}
      {runtimeError && (
        <div className="mx-4 mt-2 mb-1 p-2 bg-rose-950/20 border border-rose-500/20 rounded-xl flex items-center justify-between gap-3 text-xs shadow-lg shadow-rose-950/10">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-rose-400 truncate flex items-center gap-1.5">
              <Bug size={13} className="text-rose-500 animate-pulse" />
              Runtime Error in {runtimeError.source.split("/").pop()}
            </p>
            <p className="text-[10px] text-zinc-450 truncate font-mono mt-0.5">{runtimeError.message}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleAutoFix}
            disabled={isLoading || !keyAdded}
            className="h-7 px-3 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold gap-1 rounded-lg shrink-0 transition"
          >
            <Sparkles size={11} className="animate-pulse" />
            Auto-Fix
          </Button>
        </div>
      )}

      {/* Scoped Edit Indicator */}
      {scopedFile && (
        <div className="mx-4 mt-2 mb-1 p-2 bg-violet-950/20 border border-violet-500/20 rounded-xl flex items-center justify-between gap-3 text-xs shadow-lg shadow-violet-950/10">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-violet-400 truncate flex items-center gap-1.5">
              <Sparkles size={13} className="text-violet-400 animate-pulse" />
              Scoped Mode Active
            </p>
            <p className="text-[10px] text-zinc-450 truncate mt-0.5">Boundary locked to: <span className="font-mono text-zinc-300">{scopedFile}</span></p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setScopedFile(null)}
            className="h-7 px-2.5 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-bold rounded-lg transition"
          >
            Clear Scope
          </Button>
        </div>
      )}

      {/* Form Input Section */}
      <form onSubmit={onSubmit} className="p-3 border-t border-zinc-900 bg-zinc-950/80 flex flex-col gap-2">
        <div className="relative">
          <Textarea
            placeholder={keyAdded ? "What changes or features would you like to build?" : `Please add an API key for ${provider} in settings first.`}
            disabled={!keyAdded || isLoading}
            value={input}
            onChange={handleInputChange}
            className="min-h-[56px] max-h-[140px] w-full resize-none bg-zinc-900/40 hover:bg-zinc-900/60 border-zinc-800 focus:border-violet-500 text-white placeholder-zinc-500 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl transition py-3 px-3 scrollbar-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </div>
        
        <div className="flex items-center justify-between px-1">
          <div className="text-[10px] text-zinc-550 font-mono tracking-tight">
            Press <span className="font-bold text-zinc-450">Enter</span> to send
          </div>
          
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim() || !keyAdded}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-1.5 h-8 px-3.5 rounded-lg transition shadow-md shadow-violet-950/20 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Compiling...
              </>
            ) : (
              <>
                <Send size={12} />
                Send Prompt
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
