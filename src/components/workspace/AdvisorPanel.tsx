"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/stores/project";
import { useUserStore } from "@/stores/user";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw, HelpCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdvisorPanel() {
  const { currentProjectId } = useProjectStore();
  const { apiKeysStatus } = useUserStore();
  
  const [provider, setProvider] = useState<string>("openai");
  const [advice, setAdvice] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const keyAdded = apiKeysStatus[provider];

  const handleGetAdvice = async () => {
    if (!currentProjectId) return;

    if (!keyAdded) {
      toast.warning(`Please configure your API key for ${provider} in settings.`);
      return;
    }

    setIsLoading(true);
    setAdvice("");

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProjectId,
          provider,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate recommendations");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      let streamedAdvice = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedAdvice += chunk;
        setAdvice(streamedAdvice);
      }

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to load advice from AI");
      setAdvice(`Error loading recommendations: ${e.message || "Check your credentials or connection settings."}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 border-l border-zinc-800/80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800/80 bg-zinc-950/20">
        <div className="flex items-center gap-1.5">
          <HelpCircle size={14} className="text-violet-400" />
          <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">AI Advisor</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={provider} onValueChange={(val: string | null) => { if (val) setProvider(val); }}>
            <SelectTrigger className="w-[110px] h-7 text-xs bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Gemini</SelectItem>
              <SelectItem value="mistral">Mistral</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="xai">Grok</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleGetAdvice}
            disabled={isLoading || !keyAdded}
            className="h-7 px-2.5 bg-violet-600 hover:bg-violet-750 text-white text-xs gap-1"
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={10} />}
            Analyze
          </Button>
        </div>
      </div>

      {/* Advice Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed text-zinc-300">
        {!advice && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xs mx-auto space-y-3">
            <div className="p-3 bg-violet-600/10 rounded-full text-violet-400">
              <Sparkles size={20} />
            </div>
            <h4 className="font-semibold text-zinc-200">Proactive Product Advisor</h4>
            <p className="text-[11px] text-zinc-550">
              Click **Analyze** to let the AI co-pilot evaluate your layout tree, propose features, growth strategies, and UX designs.
            </p>
          </div>
        ) : (
          <div className="whitespace-pre-wrap font-sans bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-4 leading-relaxed">
            {advice}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-[11px] py-1 justify-center">
            <Loader2 size={12} className="animate-spin text-violet-500" />
            <span>Consulting AI growth strategist...</span>
          </div>
        )}
      </div>
    </div>
  );
}
