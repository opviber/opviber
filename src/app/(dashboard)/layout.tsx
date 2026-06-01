"use client";

import React, { useEffect } from "react";
import { useUserStore } from "@/stores/user";
import { LayoutDashboard, Settings, LogOut, Loader2, Sparkles } from "lucide-react";
import Link from "next/navigation";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loadUser, profile, isLoading } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3">
        <Loader2 size={32} className="animate-spin text-violet-500" />
        <span className="text-sm text-zinc-400">Loading profile data...</span>
      </div>
    );
  }

  const isFree = profile?.subscription_tier === "free";

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar Nav */}
      <aside className="w-64 bg-zinc-900/20 border-r border-zinc-900 flex flex-col justify-between shrink-0 p-5">
        <div className="space-y-8">
          <div className="flex items-center gap-2 px-2">
            <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-violet-600/20">O</div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Opviber</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => router.push("/projects")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                pathname === "/projects"
                  ? "bg-violet-600/10 text-violet-400 border border-violet-500/10"
                  : "text-zinc-400 hover:bg-zinc-900/40 hover:text-white"
              }`}
            >
              <LayoutDashboard size={16} />
              Projects
            </button>
            
            <button
              onClick={() => router.push("/settings")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                pathname === "/settings"
                  ? "bg-violet-600/10 text-violet-400 border border-violet-500/10"
                  : "text-zinc-400 hover:bg-zinc-900/40 hover:text-white"
              }`}
            >
              <Settings size={16} />
              Settings & API Keys
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          {isFree && (
            <button
              onClick={() => router.push("/settings")}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-750 hover:to-cyan-750 text-white font-semibold rounded-lg text-xs transition shadow-lg shadow-violet-600/20"
            >
              <Sparkles size={12} />
              Remove Ads
            </button>
          )}

          <div className="border-t border-zinc-900 pt-4 flex items-center justify-between text-xs text-zinc-550">
            <span className="truncate max-w-[120px]">{profile?.display_name || "Account"}</span>
            <button onClick={handleSignOut} className="hover:text-white transition flex items-center gap-1">
              <LogOut size={12} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
