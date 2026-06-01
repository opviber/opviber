"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectStore } from "@/stores/project";
import { useUserStore } from "@/stores/user";
import FileExplorer from "@/components/workspace/FileExplorer";
import CodeEditor from "@/components/workspace/CodeEditor";
import ChatPanel from "@/components/workspace/ChatPanel";
import PreviewPanel from "@/components/workspace/PreviewPanel";
import { Sparkles, LogOut, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const { loadProject, projectName, isLoading } = useProjectStore();
  const { loadUser, profile } = useUserStore();

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
      loadUser();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3">
        <Loader2 size={32} className="animate-spin text-violet-500" />
        <span className="text-sm text-zinc-400">Loading your workspace modules...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Workspace Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-950 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="p-1.5 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-violet-600 rounded flex items-center justify-center font-bold text-xs">O</div>
            <span className="font-bold text-sm">{projectName || "Untitled Project"}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/projects">
            <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition">
              <LogOut size={14} />
              Exit Workspace
            </button>
          </Link>
        </div>
      </header>

      {/* Main Panel Split */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Side - Files */}
        <div className="w-56 shrink-0 h-full">
          <FileExplorer />
        </div>

        {/* Center - Monaco Code Editor */}
        <div className="flex-1 h-full min-w-0">
          <CodeEditor />
        </div>

        {/* Right Side - Split Chat & Preview */}
        <div className="w-[500px] shrink-0 h-full flex flex-col border-l border-zinc-800/80">
          {/* Top - Live Preview */}
          <div className="flex-1 min-h-0 border-b border-zinc-800/80">
            <PreviewPanel />
          </div>

          {/* Bottom - AI Chat Panel */}
          <div className="flex-1 min-h-0">
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
