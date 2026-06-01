export interface TemplateFile {
  path: string;
  content: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  files: TemplateFile[];
}

export const TEMPLATES: Record<string, Template> = {
  blank: {
    id: "blank",
    name: "Blank Starter",
    description: "A clean, basic Next.js app with Tailwind CSS styling.",
    files: [
      {
        path: "src/app/page.tsx",
        content: `"use client";\n\nimport React from "react";\n\nexport default function Home() {\n  return (\n    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6">\n      <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-4">Welcome to your Opviber App</h1>\n      <p className="text-zinc-400 text-sm max-w-md text-center mb-8">This app was scaffolded instantly using Opviber. You can edit this file in the code editor or prompt the AI developer to add features.</p>\n      <button className="px-6 py-2 bg-violet-600 hover:bg-violet-750 text-white rounded-md text-sm font-semibold transition shadow-lg shadow-violet-600/20">\n        Click Me\n      </button>\n    </div>\n  );\n}`
      },
      {
        path: "src/app/globals.css",
        content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`
      }
    ]
  },
  saas: {
    id: "saas",
    name: "SaaS Landing Page",
    description: "A high-conversion marketing landing page with hero, features, and pricing sections.",
    files: [
      {
        path: "src/app/page.tsx",
        content: `"use client";\n\nimport React from "react";\nimport { ArrowRight, Shield, Zap, Cpu, Check } from "lucide-react";\n\nexport default function Landing() {\n  return (\n    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-violet-500/30">\n      {/* Navbar */}\n      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">\n        <div className="flex items-center gap-2">\n          <div className="h-8 w-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold text-lg">V</div>\n          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Veloce</span>\n        </div>\n        <div className="flex items-center gap-4">\n          <button className="text-sm text-zinc-400 hover:text-white transition">Sign In</button>\n          <button className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-semibold transition">Get Started</button>\n        </div>\n      </nav>\n\n      {/* Hero */}\n      <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 max-w-4xl mx-auto space-y-8">\n        <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold rounded-full tracking-wide uppercase">Introducing Veloce</div>\n        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">Automate your dev workflow in seconds.</h1>\n        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl">Veloce optimizes server deployments, tracks logs in real-time, and integrates directly with your team workflows automatically.</p>\n        <div className="flex gap-4">\n          <button className="px-6 py-3 bg-violet-600 hover:bg-violet-750 text-white rounded-md text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-violet-600/20">Get Started Free <ArrowRight size={16} /></button>\n          <button className="px-6 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-md text-sm font-semibold transition">View Docs</button>\n        </div>\n      </section>\n    </div>\n  );\n}`
      },
      {
        path: "src/app/globals.css",
        content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`
      }
    ]
  },
  dashboard: {
    id: "dashboard",
    name: "Analytics Dashboard",
    description: "An administrative panel with sidebar navigation, metric grids, and dynamic charts.",
    files: [
      {
        path: "src/app/page.tsx",
        content: `"use client";\n\nimport React from "react";\nimport { TrendingUp, Users, DollarSign, Activity, AlertCircle } from "lucide-react";\n\nexport default function Dashboard() {\n  return (\n    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">\n      {/* Sidebar */}\n      <aside className="w-64 bg-zinc-900/40 border-r border-zinc-800/80 p-5 space-y-6 shrink-0">\n        <div className="flex items-center gap-2 mb-8">\n          <div className="h-7 w-7 bg-violet-600 rounded flex items-center justify-center font-bold text-sm">O</div>\n          <span className="font-bold text-lg">Optima</span>\n        </div>\n        <nav className="space-y-1.5">\n          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-violet-600/10 text-violet-400 font-semibold rounded text-sm transition">Overview</a>\n          <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-white rounded text-sm transition">Customers</a>\n          <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-white rounded text-sm transition">Sales</a>\n          <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-white rounded text-sm transition">Settings</a>\n        </nav>\n      </aside>\n\n      {/* Main Panel */}\n      <main className="flex-1 p-8 overflow-y-auto">\n        <header className="flex items-center justify-between mb-8">\n          <div>\n            <h1 className="text-2xl font-bold">Analytics Overview</h1>\n            <p className="text-zinc-550 text-xs mt-0.5">Welcome back, Admin</p>\n          </div>\n        </header>\n\n        {/* Stats Grid */}\n        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">\n          <div className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-xl space-y-3">\n            <div className="flex items-center justify-between text-zinc-500">\n              <span className="text-xs font-semibold">Total Revenue</span>\n              <DollarSign size={16} />\n            </div>\n            <h2 className="text-2xl font-extrabold">$48,259.00</h2>\n            <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">+12.5% from last mo</span>\n          </div>\n        </div>\n      </main>\n    </div>\n  );\n}`
      },
      {
        path: "src/app/globals.css",
        content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`
      }
    ]
  }
};
