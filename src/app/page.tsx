"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Key, Layers, Rocket, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-violet-600/30 overflow-hidden relative">
      
      {/* Dynamic Background Glowing Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-900/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-lg shadow-violet-600/20">O</div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Opviber</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition">
            Sign In
          </Link>
          <Link href="/signup">
            <Button className="bg-violet-600 hover:bg-violet-750 text-white font-semibold text-xs px-4 py-1.5 h-8">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 md:pt-36 max-w-4xl mx-auto space-y-8 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-semibold rounded-full tracking-wide uppercase">
          <Sparkles size={12} />
          The BYOK Vibe-Coding Platform
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Build & Clone SaaS Apps <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            With Natural Language
          </span>
        </h1>
        
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
          The ultimate Shipper.now alternative. Connect your own LLM API keys to scaffold interfaces, edit code, and preview React apps instantly with zero platform markups.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link href="/signup">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-750 text-white font-semibold flex items-center gap-2 px-8 py-6 shadow-lg shadow-violet-600/30 text-base">
              Start Building Free 
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 text-zinc-300 px-8 py-6 text-base">
              Explore Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-900/80 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 space-y-4 hover:border-violet-500/10 transition">
          <div className="h-10 w-10 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center">
            <Key size={18} />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Bring Your Own Key (BYOK)</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Avoid overpriced subscriptions. Enter keys for OpenAI, Anthropic, Gemini, Mistral, Groq, and Cohere. You pay only raw API usage costs directly to the providers.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 space-y-4 hover:border-violet-500/10 transition">
          <div className="h-10 w-10 bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 rounded-lg flex items-center justify-center">
            <Layers size={18} />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Interactive Code Previews</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Run, compile, and preview code in real-time. Transpiles React, TypeScript, and Tailwind elements client-side instantly inside our sandboxed preview frame.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-6 space-y-4 hover:border-violet-500/10 transition">
          <div className="h-10 w-10 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center">
            <Rocket size={18} />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Starter Kits & Remixing</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Launch templates with a single click. Remix SaaS pages, admin panels, and e-commerce UI layouts. Extend their logic with simple instructions.
          </p>
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-900/80 text-center space-y-12 relative z-10">
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight">Flexible Monetization</h2>
          <p className="text-sm text-zinc-550 max-w-md mx-auto">No complex tier matrix. Simple ad-supported free tier with a Remove Ads subscription.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free Tier */}
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-8 flex flex-col justify-between text-left space-y-6">
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-zinc-300">Opviber Free</h4>
              <p className="text-xs text-zinc-500">Perfect for indie developers and builders getting started.</p>
              <div className="text-2xl font-black pt-4 text-white">$0 <span className="text-xs font-normal text-zinc-550">/ month</span></div>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">✓ BYOK Multi-provider keys</li>
              <li className="flex items-center gap-2">✓ Unlimited app builds</li>
              <li className="flex items-center gap-2">✓ React / Tailwind sandbox previews</li>
              <li className="flex items-center gap-2">✗ Non-intrusive workspace ads</li>
            </ul>
            <Link href="/signup">
              <Button variant="outline" className="w-full border-zinc-800 bg-transparent text-zinc-300 font-semibold hover:bg-zinc-900 hover:text-white">
                Launch Workspace
              </Button>
            </Link>
          </div>

          {/* Remove Ads Tier */}
          <div className="bg-zinc-900/40 border border-violet-600/30 rounded-2xl p-8 flex flex-col justify-between text-left space-y-6 relative">
            <div className="absolute top-4 right-4 px-2 py-0.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold rounded-full uppercase">
              Popular
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-violet-400">Opviber Pro</h4>
              <p className="text-xs text-zinc-500">Clean distraction-free workspace builder experience.</p>
              <div className="text-2xl font-black pt-4 text-white">$4.99 <span className="text-xs font-normal text-zinc-550">/ month</span></div>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-2">✓ <strong>No advertising</strong> (Ad-free interface)</li>
              <li className="flex items-center gap-2">✓ BYOK Multi-provider keys</li>
              <li className="flex items-center gap-2">✓ Unlimited app builds</li>
              <li className="flex items-center gap-2">✓ Instant template remixing gallery</li>
            </ul>
            <Link href="/signup">
              <Button className="w-full bg-violet-600 hover:bg-violet-750 text-white font-semibold shadow-lg shadow-violet-600/20">
                Get Opviber Pro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900/60 py-8 text-center text-xs text-zinc-650">
        &copy; {new Date().getFullYear()} Opviber. All rights reserved.
      </footer>
    </div>
  );
}
