"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(8px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1] // Apple-style easing
      }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
