"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/stores/project";
import { 
  File, 
  Folder, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Trash2, 
  Plus, 
  FilePlus, 
  FolderPlus,
  Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Simple tree helper structure
interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Record<string, TreeNode>;
}

export default function FileExplorer() {
  const { files, activeFilePath, setActiveFile, createFile, deleteFile, toggleFileLock, scopedFile, setScopedFile } = useProjectStore();
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ "src": true, "src/app": true });
  const [newFilePath, setNewFilePath] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Convert flat record to nested tree
  const buildTree = (): TreeNode => {
    const root: TreeNode = { name: "root", path: "", isFolder: true, children: {} };
    
    Object.keys(files).forEach((path) => {
      const parts = path.split("/");
      let current = root;
      
      parts.forEach((part, i) => {
        const isLast = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join("/");
        
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            path: currentPath,
            isFolder: !isLast,
            children: {},
          };
        }
        current = current.children[part];
      });
    });
    
    return root;
  };

  const tree = buildTree();

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath) return;
    
    // Normalize path
    let cleanPath = newFilePath.trim().replace(/^\//, "");
    if (!cleanPath) return;

    await createFile(cleanPath, `// ${cleanPath}\n\nexport default function Page() {\n  return <div>New Page</div>;\n}`);
    setNewFilePath("");
    setIsCreateOpen(false);
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedFolders[node.path];
    const isActive = activeFilePath === node.path;
    const isScoped = scopedFile === node.path;
    const isLocked = files[node.path]?.is_locked;

    if (node.isFolder) {
      return (
        <div key={node.path} className="w-full">
          <button
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-1.5 w-full py-1 px-2 hover:bg-zinc-800/50 rounded-sm text-sm text-zinc-400 font-medium transition"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={14} className="text-violet-400 shrink-0" />
            <span className="truncate">{node.name}</span>
          </button>
          {isExpanded && (
            <div className="w-full">
              {Object.values(node.children)
                .sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0) || a.name.localeCompare(b.name))
                .map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={`flex items-center justify-between group py-1 px-2 rounded-sm text-sm cursor-pointer transition ${
          isActive ? "bg-violet-600/20 text-violet-300 font-semibold" : "hover:bg-zinc-800/50 text-zinc-300"
        }`}
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
        onClick={() => setActiveFile(node.path)}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <File size={14} className={isActive ? "text-violet-400" : "text-zinc-500"} />
          <span className="truncate">{node.name}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setScopedFile(isScoped ? null : node.path);
            }}
            className={`p-1 rounded hover:text-zinc-100 transition ${isScoped ? "text-violet-400" : "text-zinc-500"}`}
            title={isScoped ? "Remove AI scope" : "Scope AI edits to this file"}
          >
            <Sparkles size={12} className={isScoped ? "animate-pulse" : ""} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFileLock(node.path);
            }}
            className="p-1 hover:text-zinc-100 text-zinc-500 rounded"
            title={isLocked ? "Unlock file" : "Lock file from AI updates"}
          >
            {isLocked ? <Lock size={12} className="text-amber-500" /> : <Unlock size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete ${node.name}?`)) {
                deleteFile(node.path);
              }
            }}
            className="p-1 hover:text-rose-400 text-zinc-500 rounded"
            title="Delete file"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/40 border-r border-zinc-800/80">
      <div className="flex items-center justify-between border-b border-zinc-800/55 bg-zinc-950/40 h-11 px-4 shrink-0 backdrop-blur-md">
        <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider font-mono">Workspace Files</span>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger render={
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white">
              <Plus size={14} />
            </Button>
          } />
          <DialogContent className="bg-zinc-900 border-zinc-850 text-white">
            <DialogHeader>
              <DialogTitle>Create New File</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFile} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">File path (relative to root)</label>
                <Input
                  placeholder="e.g. src/components/Header.tsx"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-750 text-white">
                  Create File
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {Object.keys(files).length === 0 ? (
          <div className="text-center text-xs text-zinc-600 mt-8">No files created yet.</div>
        ) : (
          Object.values(tree.children)
            .sort((a, b) => (b.isFolder ? 1 : 0) - (a.isFolder ? 1 : 0) || a.name.localeCompare(b.name))
            .map(node => renderNode(node))
        )}
      </div>
    </div>
  );
}
