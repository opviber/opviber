"use client";

import React from "react";
import { useUserStore } from "@/stores/user";
import { Sparkles, Megaphone } from "lucide-react";
import Link from "next/link";

interface AdBannerProps {
  type?: "adsense" | "carbon" | "auto";
}

export default function AdBanner({ type = "auto" }: AdBannerProps) {
  const { profile } = useUserStore();

  // If user paid to remove ads, don't render anything
  if (profile?.subscription_tier === "remove_ads") {
    return null;
  }

  // Fallback beautiful developer mock ad for localhost or clean sponsorship banner
  return (
    <div className="relative group overflow-hidden bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 flex gap-3 text-xs leading-relaxed transition hover:border-violet-500/20">
      {/* Decorative gradient glowing effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
      
      <div className="shrink-0 flex items-center justify-center h-8 w-8 bg-violet-600/10 rounded border border-violet-500/20 text-violet-400">
        <Megaphone size={14} />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-850">
            Sponsor
          </span>
          
          <Link href="/settings" className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition">
            <Sparkles size={10} />
            Remove Ads
          </Link>
        </div>
        
        <p className="text-zinc-400 text-[11px]">
          Deploy unlimited fullstack Apps instantly with <strong>Opviber Pro</strong>. Start builder with high-speed Anthropic & OpenAI models.
        </p>
      </div>
    </div>
  );
}
