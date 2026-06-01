"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/projects");
        router.refresh();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) setErrorMsg(error.message);
    } catch (e: any) {
      setErrorMsg(e.message || `Failed to log in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: "demo@opviber.com",
        password: "opviberdemo",
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/projects");
        router.refresh();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to log in with Demo account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold text-zinc-100">Welcome Back</h2>
          <p className="text-xs text-zinc-500">Sign in to manage and continue building your software products</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-600/10 border border-rose-500/20 rounded text-rose-400 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-zinc-400">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-white placeholder-zinc-700 h-10"
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-xs text-zinc-400">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-white placeholder-zinc-700 h-10"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-755 text-white font-semibold h-10 shadow-lg shadow-violet-600/20 mt-2">
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* Social Oauth Options */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-550">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={isLoading}
            variant="outline"
            className="border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-center gap-2 h-10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
          
          <Button
            type="button"
            onClick={() => handleOAuth("github")}
            disabled={isLoading}
            variant="outline"
            className="border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center justify-center gap-2 h-10"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.435 22 12.017 22 6.484 17.522 2 12 2z"
              />
            </svg>
            GitHub
          </Button>
        </div>

        {/* Demo Bypass Action */}
        <Button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-white font-semibold h-10 gap-1 text-xs"
        >
          <Sparkles size={12} className="text-violet-400" />
          Test with Demo Guest Account (Instant)
        </Button>
      </div>

      <div className="text-center text-xs text-zinc-550 pt-2">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-semibold transition">
          Create Account
        </Link>
      </div>
    </div>
  );
}
