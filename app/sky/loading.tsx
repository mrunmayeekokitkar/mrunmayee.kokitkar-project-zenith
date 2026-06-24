export default function SkyLoading() {
  return (
    <main className="page-with-nav relative min-h-[100dvh] w-full overflow-hidden p-6 md:p-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-10">
        <div className="relative h-16 w-16">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-purple-500/10 border-t-purple-400" />
          <span className="absolute inset-2 rounded-full bg-purple-400/5 blur-md" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-purple-400 animate-pulse">
          BOOTING TEMPORAL ENGINE...
        </p>
      </div>
      
      <div className="mx-auto max-w-[1400px] opacity-20 pointer-events-none flex flex-col lg:flex-row gap-8">
        <div className="glass-panel w-full lg:w-[320px] shrink-0 p-8 flex flex-col gap-6 animate-pulse h-[600px]" />
        <div className="glass-panel flex-1 relative flex flex-col items-center justify-center min-h-[500px] animate-pulse" />
      </div>
    </main>
  );
}
