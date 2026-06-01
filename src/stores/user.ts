import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "remove_ads";
}

interface UserState {
  profile: UserProfile | null;
  apiKeysStatus: Record<string, boolean>; // e.g. { openai: true, anthropic: false }
  isLoading: boolean;
  
  loadUser: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  loadApiKeysStatus: () => Promise<void>;
  saveApiKey: (provider: string, key: string) => Promise<boolean>;
  deleteApiKey: (provider: string) => Promise<boolean>;
}

const supabase = createClient();

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  apiKeysStatus: {},
  isLoading: false,

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ profile: null, isLoading: false });
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      set({ profile, isLoading: false });
      await get().loadApiKeysStatus();
    } catch (e) {
      console.error("Failed to load user profile:", e);
      set({ profile: null, isLoading: false });
    }
  },

  setProfile: (profile) => set({ profile }),

  loadApiKeysStatus: async () => {
    const { profile } = get();
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("provider, is_active")
        .eq("user_id", profile.id);

      if (error) throw error;

      const statusMap: Record<string, boolean> = {};
      data.forEach((k) => {
        statusMap[k.provider] = k.is_active;
      });

      set({ apiKeysStatus: statusMap });
    } catch (e) {
      console.error("Failed to load API keys status:", e);
    }
  },

  saveApiKey: async (provider, key) => {
    const { profile } = get();
    if (!profile) return false;

    try {
      // Send key to API endpoint that encrypts and stores it
      const response = await fetch("/api/settings/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider, key }),
      });

      if (!response.ok) {
        throw new Error("Failed to save key");
      }

      set((state) => ({
        apiKeysStatus: {
          ...state.apiKeysStatus,
          [provider]: true,
        },
      }));
      return true;
    } catch (e) {
      console.error(`Failed to save API key for ${provider}:`, e);
      return false;
    }
  },

  deleteApiKey: async (provider) => {
    const { profile } = get();
    if (!profile) return false;

    try {
      const response = await fetch(`/api/settings/keys?provider=${provider}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete key");
      }

      set((state) => {
        const nextStatus = { ...state.apiKeysStatus };
        delete nextStatus[provider];
        return { apiKeysStatus: nextStatus };
      });
      return true;
    } catch (e) {
      console.error(`Failed to delete API key for ${provider}:`, e);
      return false;
    }
  },
}));
