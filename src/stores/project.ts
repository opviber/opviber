import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface ProjectFile {
  id?: string;
  path: string;
  content: string;
  is_locked: boolean;
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
}

interface ProjectState {
  currentProjectId: string | null;
  projectName: string;
  projectDescription: string;
  files: Record<string, ProjectFile>;
  activeFilePath: string | null;
  openTabs: string[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  isGenerating: boolean;
  previewUrl: string | null;
  devicePreview: "desktop" | "tablet" | "mobile";
  
  // Actions
  setProjectId: (id: string | null) => void;
  loadProject: (projectId: string) => Promise<void>;
  updateFileContent: (path: string, content: string) => void;
  saveFileToDb: (path: string) => Promise<void>;
  createFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  toggleFileLock: (path: string) => Promise<void>;
  setActiveFile: (path: string | null) => void;
  closeTab: (path: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setGenerating: (val: boolean) => void;
  setDevicePreview: (device: "desktop" | "tablet" | "mobile") => void;
}

const supabase = createClient();

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProjectId: null,
  projectName: "",
  projectDescription: "",
  files: {},
  activeFilePath: null,
  openTabs: [],
  chatMessages: [],
  isLoading: false,
  isGenerating: false,
  previewUrl: null,
  devicePreview: "desktop",

  setProjectId: (id) => set({ currentProjectId: id }),

  loadProject: async (projectId) => {
    set({ isLoading: true });
    try {
      // 1. Fetch project meta
      const { data: project, error: pErr } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      
      if (pErr) throw pErr;

      // 2. Fetch project files
      const { data: filesData, error: fErr } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId);
      
      if (fErr) throw fErr;

      // 3. Fetch chat history
      const { data: chatData, error: cErr } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      
      if (cErr) throw cErr;

      // Restructure files
      const filesMap: Record<string, ProjectFile> = {};
      filesData.forEach((f) => {
        filesMap[f.path] = {
          id: f.id,
          path: f.path,
          content: f.content || "",
          is_locked: f.is_locked || false,
        };
      });

      // Default active file
      let activeFile = get().activeFilePath;
      if (!activeFile || !filesMap[activeFile]) {
        activeFile = Object.keys(filesMap).find(p => p.endsWith("page.tsx") || p.endsWith("page.js")) || Object.keys(filesMap)[0] || null;
      }

      set({
        currentProjectId: projectId,
        projectName: project.name,
        projectDescription: project.description || "",
        files: filesMap,
        activeFilePath: activeFile,
        openTabs: activeFile ? [activeFile] : [],
        chatMessages: chatData.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          metadata: m.metadata,
        })),
        isLoading: false,
      });
    } catch (e) {
      console.error("Failed to load project:", e);
      set({ isLoading: false });
    }
  },

  updateFileContent: (path, content) => {
    set((state) => ({
      files: {
        ...state.files,
        [path]: {
          ...state.files[path],
          content,
        },
      },
    }));
  },

  saveFileToDb: async (path) => {
    const { currentProjectId, files } = get();
    if (!currentProjectId || !files[path]) return;

    try {
      const file = files[path];
      const { error } = await supabase
        .from("project_files")
        .upsert({
          project_id: currentProjectId,
          path,
          content: file.content,
          updated_at: new Date().toISOString(),
        }, { onConflict: "project_id,path" });

      if (error) throw error;
    } catch (e) {
      console.error(`Failed to save file ${path} to DB:`, e);
    }
  },

  createFile: async (path, content) => {
    const { currentProjectId } = get();
    if (!currentProjectId) return;

    try {
      const { data, error } = await supabase
        .from("project_files")
        .insert({
          project_id: currentProjectId,
          path,
          content,
          is_locked: false,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => {
        const newFiles = { ...state.files };
        newFiles[path] = {
          id: data.id,
          path,
          content,
          is_locked: false,
        };

        const newTabs = [...state.openTabs];
        if (!newTabs.includes(path)) {
          newTabs.push(path);
        }

        return {
          files: newFiles,
          activeFilePath: path,
          openTabs: newTabs,
        };
      });
    } catch (e) {
      console.error(`Failed to create file ${path}:`, e);
    }
  },

  deleteFile: async (path) => {
    const { currentProjectId, files } = get();
    if (!currentProjectId || !files[path]) return;

    try {
      const { error } = await supabase
        .from("project_files")
        .delete()
        .eq("project_id", currentProjectId)
        .eq("path", path);

      if (error) throw error;

      set((state) => {
        const newFiles = { ...state.files };
        delete newFiles[path];

        const newTabs = state.openTabs.filter((t) => t !== path);
        let active = state.activeFilePath;
        if (active === path) {
          active = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
        }

        return {
          files: newFiles,
          openTabs: newTabs,
          activeFilePath: active,
        };
      });
    } catch (e) {
      console.error(`Failed to delete file ${path}:`, e);
    }
  },

  toggleFileLock: async (path) => {
    const { currentProjectId, files } = get();
    if (!currentProjectId || !files[path]) return;

    try {
      const nextLockedState = !files[path].is_locked;
      const { error } = await supabase
        .from("project_files")
        .update({ is_locked: nextLockedState })
        .eq("project_id", currentProjectId)
        .eq("path", path);

      if (error) throw error;

      set((state) => ({
        files: {
          ...state.files,
          [path]: {
            ...state.files[path],
            is_locked: nextLockedState,
          },
        },
      }));
    } catch (e) {
      console.error(`Failed to toggle lock on ${path}:`, e);
    }
  },

  setActiveFile: (path) => {
    if (!path) {
      set({ activeFilePath: null });
      return;
    }

    set((state) => {
      const newTabs = [...state.openTabs];
      if (!newTabs.includes(path)) {
        newTabs.push(path);
      }
      return {
        activeFilePath: path,
        openTabs: newTabs,
      };
    });
  },

  closeTab: (path) => {
    set((state) => {
      const newTabs = state.openTabs.filter((t) => t !== path);
      let active = state.activeFilePath;
      if (active === path) {
        active = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
      }
      return {
        openTabs: newTabs,
        activeFilePath: active,
      };
    });
  },

  addChatMessage: (msg) => {
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    }));
  },

  setGenerating: (val) => set({ isGenerating: val }),
  setDevicePreview: (device) => set({ devicePreview: device }),
}));
