"use client";

import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { useProjectStore } from "@/stores/project";
import { X, Save, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CodeEditor() {
  const { 
    files, 
    activeFilePath, 
    openTabs, 
    setActiveFile, 
    closeTab, 
    updateFileContent, 
    saveFileToDb,
    scopedFile,
    setScopedFile
  } = useProjectStore();

  const [savingState, setSavingState] = useState<Record<string, "idle" | "saving" | "saved">>({});

  const activeFile = activeFilePath ? files[activeFilePath] : null;

  // Determine Monaco language
  const getLanguage = (path: string) => {
    const ext = path.split(".").pop();
    switch (ext) {
      case "ts":
      case "tsx":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      case "css":
        return "css";
      case "json":
        return "json";
      case "html":
        return "html";
      default:
        return "plaintext";
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFilePath && value !== undefined) {
      updateFileContent(activeFilePath, value);
      setSavingState((prev) => ({ ...prev, [activeFilePath]: "idle" }));
    }
  };

  const handleSave = async () => {
    if (!activeFilePath) return;

    setSavingState((prev) => ({ ...prev, [activeFilePath]: "saving" }));
    await saveFileToDb(activeFilePath);
    setSavingState((prev) => ({ ...prev, [activeFilePath]: "saved" }));
    
    setTimeout(() => {
      setSavingState((prev) => ({ ...prev, [activeFilePath]: "idle" }));
    }, 2000);
  };

  // Listen to CMD+S / CTRL+S for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFilePath]);

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950/20 text-zinc-500">
        <span className="text-sm">Select a file from the explorer to start editing</span>
      </div>
    );
  }

  const isSaving = savingState[activeFile.path] === "saving";
  const isSaved = savingState[activeFile.path] === "saved";

  return (
    <div className="flex flex-col h-full bg-zinc-950/20">
      {/* File Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/40">
        <div className="flex overflow-x-auto flex-1 scrollbar-none">
          {openTabs.map((path) => {
            const isActive = activeFilePath === path;
            const fileData = files[path];
            const name = path.split("/").pop() || path;
            return (
              <div
                key={path}
                className={`flex items-center gap-1.5 px-3 py-2 border-r border-zinc-900 cursor-pointer text-xs font-medium transition ${
                  isActive 
                    ? "bg-zinc-900/60 border-t-2 border-t-violet-500 text-white" 
                    : "text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-200"
                }`}
                onClick={() => setActiveFile(path)}
              >
                {fileData?.is_locked && <Lock size={10} className="text-amber-500 shrink-0" />}
                <span>{name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(path);
                  }}
                  className="p-0.5 rounded-sm hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center px-3 border-l border-zinc-900 h-full gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScopedFile(scopedFile === activeFile.path ? null : activeFile.path)}
            className={`h-7 gap-1 text-xs transition ${
              scopedFile === activeFile.path ? "text-violet-400 bg-violet-500/10 hover:text-violet-300" : "text-zinc-400 hover:text-white"
            }`}
            title={scopedFile === activeFile.path ? "AI edits are scoped to this file" : "Scope AI edits to this file"}
          >
            <Sparkles size={12} className={scopedFile === activeFile.path ? "animate-pulse" : ""} />
            {scopedFile === activeFile.path ? "Scoped" : "Scope AI"}
          </Button>
          
          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />

          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-7 gap-1 text-xs text-zinc-400 hover:text-white"
          >
            <Save size={12} />
            {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 overflow-hidden relative">
        {activeFile.is_locked && (
          <div className="absolute top-2 right-4 z-10 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded text-[10px] text-amber-500">
            <Lock size={10} />
            Locked from AI updates
          </div>
        )}
        
        <Editor
          height="100%"
          language={getLanguage(activeFile.path)}
          theme="vs-dark"
          value={activeFile.content}
          onChange={handleEditorChange}
          options={{
            readOnly: false,
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            lineHeight: 20,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
