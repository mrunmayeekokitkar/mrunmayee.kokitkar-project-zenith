export default function DashboardLoading() {
  return (
    <main className="page-with-nav relative min-h-[100dvh] w-full overflow-hidden p-6 md:p-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-10">
        <div className="relative h-16 w-16">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-slate-500/10 border-t-slate-300" />
          <span className="absolute inset-2 rounded-full bg-slate-400/5 blur-md" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400 animate-pulse">
          INITIALIZING TELEMETRY...
        </p>
      </div>

      <div className="mx-auto max-w-7xl opacity-30 pointer-events-none">
        <header className="mb-10 text-center md:text-left">
          <div className="h-10 w-64 bg-slate-800 rounded-lg animate-pulse" />
          <div className="mt-3 h-4 w-96 bg-slate-800/50 rounded-lg animate-pulse" />
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="glass-panel h-[200px] animate-pulse" />
          <div className="glass-panel h-[200px] animate-pulse" />
          <div className="glass-panel h-[200px] animate-pulse" />
          <div className="glass-panel lg:col-span-2 h-[300px] animate-pulse" />
          <div className="glass-panel h-[300px] animate-pulse" />
        </div>
      </div>
    </main>
  );
}
