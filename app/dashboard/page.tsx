"use client";

export default function DashboardPlaceholder() {
  return (
    <main className="flex-1 page-with-nav flex flex-col items-center justify-center p-8">
      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-12 text-center backdrop-blur-xl">
        <span className="mb-4 inline-block h-12 w-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
        </span>
        <h1 className="font-mono text-xl uppercase tracking-widest text-slate-200">Cosmic Dashboard</h1>
        <p className="mt-2 font-sans text-slate-400 max-w-sm mx-auto">
          This sector is under active construction. The telemetry uplink will be established shortly.
        </p>
      </div>
    </main>
  );
}
