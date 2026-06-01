"use client";

import React, { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/stores/project";
import { useUserStore } from "@/stores/user";
import { parseAiResponse, getCleanExplanation } from "@/lib/ai/parser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, Loader2, KeyRound } from "lucide-react";
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
    saveFileToDb 
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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!keyAdded) {
      toast.warning(`Please add your API key for ${provider} in settings first.`);
      return;
    }

    const userPrompt = input.trim();
    setInput("");
    setIsLoading(true);

    // 1. Add User Message to local store
    addChatMessage({
      role: "user",
      content: userPrompt,
    });

    // 2. Persist User Message to Supabase DB
    try {
      await fetch("/api/projects/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProjectId,
          role: "user",
          content: userPrompt,
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
      content: userPrompt,
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
      // But since we want to stream text dynamically, let's process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantResponse += chunk;
        
        // Let's force update the last message in Zustand or set local state
        // To make it extremely clean, we can just save it fully on finish
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

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 border-l border-zinc-800/80">
      {/* Header controls */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800/80 bg-zinc-950/20">
        <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">AI Developer</span>
        
        <div className="flex items-center gap-2">
          <Select value={provider} onValueChange={(val: string | null) => { if (val) setProvider(val); }}>
            <SelectTrigger className="w-[120px] h-7 text-xs bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Gemini</SelectItem>
              <SelectItem value="mistral">Mistral</SelectItem>
              <SelectItem value="groq">Groq Llama</SelectItem>
              <SelectItem value="xai">Grok</SelectItem>
              <SelectItem value="cohere">Cohere</SelectItem>
            </SelectContent>
          </Select>

          {!keyAdded && (
            <Link href="/settings">
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 text-xs">
                <KeyRound size={12} />
                Add Key
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto space-y-3">
            <div className="p-3 bg-violet-600/10 rounded-full text-violet-400">
              <Sparkles size={24} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200">Start building your App</h3>
            <p className="text-xs text-zinc-550">
              Describe what app you want to build. Our AI will automatically construct the frontend, pages, state, and styles.
            </p>
          </div>
        ) : (
          chatMessages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-violet-600 text-white self-end ml-auto"
                  : m.role === "system"
                  ? "bg-rose-950/20 border border-rose-900/50 text-rose-350 self-center max-w-full text-xs font-mono"
                  : "bg-zinc-900 border border-zinc-800/80 text-zinc-300 self-start"
              }`}
            >
              <span className="text-[10px] text-zinc-500 font-semibold mb-1 block">
                {m.role === "user" ? "You" : m.role === "system" ? "System Log" : "Opviber AI"}
              </span>
              <div className="whitespace-pre-wrap">
                {m.role === "user" || m.role === "system" ? m.content : getCleanExplanation(m.content)}
              </div>
            </div>
          ))
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
            <Loader2 size={12} className="animate-spin text-violet-500" />
            <span>Opviber AI is compiling changes...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Workspace Ad Banner (only if user has free tier) */}
      {hasAds && (
        <div className="px-4 py-2 border-t border-zinc-900 bg-zinc-950/20">
          <AdBanner type="carbon" />
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={onSubmit} className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 flex flex-col gap-2">
        <Textarea
          placeholder={keyAdded ? "Describe changes or features..." : `Configure API key for ${provider} to begin`}
          disabled={!keyAdded || isLoading}
          value={input}
          onChange={handleInputChange}
          className="min-h-[60px] max-h-[140px] resize-none bg-zinc-900/60 border-zinc-800 text-white placeholder-zinc-650 text-sm focus-visible:ring-violet-600"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-zinc-550">
            Press Enter to send
          </div>
          
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim() || !keyAdded}
            className="bg-violet-600 hover:bg-violet-750 text-white gap-1.5 h-8 px-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send size={12} />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
