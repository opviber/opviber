"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TEMPLATES } from "@/lib/templates";
import { Plus, ArrowRight, FolderPlus, FolderOpen, Calendar, Sparkles } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDesc,
          template: selectedTemplate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/${data.project.id}`);
      }
    } catch (e) {
      console.error("Failed to create project:", e);
    } finally {
      setIsSubmitting(false);
      setIsCreateOpen(false);
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setProjectName(`My ${TEMPLATES[templateId].name}`);
    setProjectDesc(TEMPLATES[templateId].description);
    setIsCreateOpen(true);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Projects</h1>
          <p className="text-zinc-550 text-sm mt-1">Manage, code, and deploy your AI-generated software products</p>
        </div>
        <Button onClick={() => {
          setSelectedTemplate("blank");
          setProjectName("");
          setProjectDesc("");
          setIsCreateOpen(true);
        }} className="bg-violet-600 hover:bg-violet-750 text-white gap-2 font-semibold">
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Projects List Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-400">Active Workspaces</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-40 bg-zinc-900/40 border border-zinc-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center max-w-md mx-auto space-y-4">
            <div className="p-4 bg-zinc-900/50 rounded-full inline-block text-zinc-500">
              <FolderPlus size={32} />
            </div>
            <h3 className="font-bold text-zinc-300">No workspaces found</h3>
            <p className="text-xs text-zinc-550">Create your first AI-generated software project or choose a starter template below.</p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-zinc-900 hover:bg-zinc-850 text-white font-semibold">
              Create a Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-zinc-900/30 border-zinc-900 hover:border-violet-500/20 hover:bg-zinc-900/50 transition cursor-pointer group flex flex-col justify-between" onClick={() => router.push(`/${project.id}`)}>
                <CardHeader>
                  <CardTitle className="text-base font-bold text-zinc-200 group-hover:text-violet-400 transition truncate">{project.name}</CardTitle>
                  <CardDescription className="text-xs text-zinc-500 line-clamp-2 mt-1">{project.description || "No description provided."}</CardDescription>
                </CardHeader>
                <CardFooter className="border-t border-zinc-950/80 pt-3 flex items-center justify-between text-[10px] text-zinc-550">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-0.5 text-violet-400 font-semibold group-hover:translate-x-0.5 transition">
                    Open Workspace
                    <ArrowRight size={10} />
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Templates Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-violet-400" />
          <h2 className="text-xl font-bold tracking-tight">Templates & Starter Kits</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(TEMPLATES).map((template) => (
            <Card key={template.id} className="bg-zinc-900/30 border-zinc-900 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-bold text-zinc-200">{template.name}</CardTitle>
                <CardDescription className="text-xs text-zinc-550 mt-1">{template.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => handleCreateFromTemplate(template.id)} className="w-full text-xs border-zinc-800 bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white">
                  Remix Template
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-850 text-white">
          <DialogHeader>
            <DialogTitle>Launch New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-zinc-400">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g. SaaS Landing Page"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs text-zinc-400">Description</Label>
              <Input
                id="description"
                placeholder="What does this software product do?"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="bg-transparent border-zinc-800 text-zinc-450 hover:bg-zinc-800 hover:text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !projectName.trim()} className="bg-violet-600 hover:bg-violet-750 text-white">
                {isSubmitting ? "Launching..." : "Launch App"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
