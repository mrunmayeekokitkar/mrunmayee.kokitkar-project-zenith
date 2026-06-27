"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(0);
    const t1 = setTimeout(() => setProgress(60), 80);
    const t2 = setTimeout(() => setProgress(90), 200);
    const t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setVisible(false), 300);
    }, 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-sky-400 via-violet-400 to-cyan-300 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(56,189,248,0.6)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
