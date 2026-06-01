import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white relative font-sans">
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-cyan-600/5 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-900 rounded-2xl p-8 backdrop-blur-md relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 bg-violet-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-violet-600/20">O</div>
          <span className="font-extrabold text-2xl tracking-tight mt-2">Opviber</span>
        </div>
        {children}
      </div>
    </div>
  );
}
