"use client";

import React, { useState } from "react";
import { useUserStore } from "@/stores/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { KeyRound, Sparkles, ShieldCheck, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { apiKeysStatus, saveApiKey, deleteApiKey, profile, loadUser } = useUserStore();
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [isUpgrading, setIsUpgrading] = useState(false);

  const allowedProviders = [
    { id: "openai", name: "OpenAI", desc: "For GPT-4o, GPT-4, and GPT-3.5 models" },
    { id: "anthropic", name: "Anthropic Claude", desc: "For Claude 3.5 Sonnet and Opus models" },
    { id: "google", name: "Google Gemini", desc: "For Gemini 1.5 Pro and Flash models" },
    { id: "mistral", name: "Mistral AI", desc: "For Mistral Large and Codestral models" },
    { id: "groq", name: "Groq Cloud", desc: "High-speed Llama 3 models hosting" },
    { id: "xai", name: "xAI Grok", desc: "For Grok Beta models" },
    { id: "cohere", name: "Cohere", desc: "For Command R+ models" },
  ];

  const handleSaveKey = async (provider: string) => {
    const key = providerKeys[provider];
    if (!key) return;

    setIsSaving(prev => ({ ...prev, [provider]: true }));
    const success = await saveApiKey(provider, key);
    setIsSaving(prev => ({ ...prev, [provider]: false }));

    if (success) {
      setProviderKeys(prev => ({ ...prev, [provider]: "" }));
    }
  };

  const handleDeleteKey = async (provider: string) => {
    if (confirm(`Are you sure you want to delete the stored key for ${provider}?`)) {
      await deleteApiKey(provider);
    }
  };

  // Mock checkout session upgrade
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // Make API call to create Checkout session or handle mock upgrade
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback mock upgrade in dev mode if Stripe is not fully configured
        alert("Development Mode: Simulating Stripe Subscription flow...");
        const updateRes = await fetch("/api/stripe/mock-upgrade", {
          method: "POST",
        });
        const updateData = await updateRes.json();
        if (updateData.success) {
          await loadUser();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpgrading(false);
    }
  };

  const isPro = profile?.subscription_tier === "remove_ads";

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-zinc-550 text-sm mt-1">Configure your AI API credentials and subscription plans</p>
      </div>

      {/* Subscription Tier Block */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-400">Subscription Status</h2>
        <Card className="bg-zinc-900/30 border-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                {isPro ? (
                  <>
                    <ShieldCheck className="text-emerald-500" size={18} />
                    Opviber Pro
                  </>
                ) : (
                  <>
                    <Sparkles className="text-violet-400" size={18} />
                    Opviber Free
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-1">
                {isPro ? "Your remove-ads active tier" : "Your workspace currently shows non-intrusive developer ads"}
              </CardDescription>
            </div>
            
            <div className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs font-semibold text-zinc-400">
              {isPro ? "Active" : "Ad-supported"}
            </div>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400">
            {isPro ? (
              <p>Thank you for supporting Opviber! All ads have been removed from your editor and dashboard workspaces.</p>
            ) : (
              <p>Remove all ads and unlock custom workspace templates with Opviber Pro.</p>
            )}
          </CardContent>
          {!isPro && (
            <CardFooter className="border-t border-zinc-950/80 pt-4">
              <Button onClick={handleUpgrade} disabled={isUpgrading} className="bg-violet-600 hover:bg-violet-750 text-white font-semibold gap-2">
                Upgrade to Pro — $4.99/mo
              </Button>
            </CardFooter>
          )}
        </Card>
      </section>

      {/* BYOK Keys Management */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-400">LLM Credentials (BYOK)</h2>
        <p className="text-xs text-zinc-550">
          Opviber is a Bring-Your-Own-Key platform. Enter your keys securely. They are encrypted at rest using AES-256-GCM.
        </p>

        <div className="space-y-4">
          {allowedProviders.map((prov) => {
            const hasKey = apiKeysStatus[prov.id];
            const isSavingKey = isSaving[prov.id];
            const typedKey = providerKeys[prov.id] || "";

            return (
              <Card key={prov.id} className="bg-zinc-900/30 border-zinc-900 flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200 text-sm">{prov.name}</span>
                    {hasKey ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                        <AlertTriangle size={10} /> No Key
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-550">{prov.desc}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 md:w-96">
                  {hasKey ? (
                    <div className="flex items-center justify-between w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-400 text-xs">
                      <span className="font-mono">••••••••••••••••••••</span>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteKey(prov.id)} className="h-6 w-6 text-zinc-500 hover:text-rose-400">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        type="password"
                        placeholder="Enter API Key"
                        value={typedKey}
                        onChange={(e) => setProviderKeys(prev => ({ ...prev, [prov.id]: e.target.value }))}
                        className="bg-zinc-950 border-zinc-800 text-white placeholder-zinc-700 h-8 text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        disabled={isSavingKey || !typedKey}
                        onClick={() => handleSaveKey(prov.id)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white h-8 px-3 text-xs"
                      >
                        {isSavingKey ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
