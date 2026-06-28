import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#030409]">
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a0a1a] to-[#030409]" />
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <h1 className="text-[120px] sm:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-b from-sky-400 to-purple-600 leading-none">
              404
            </h1>
            <motion.div
              className="absolute -inset-4 bg-sky-500/20 blur-3xl rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            />
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-md"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Lost in the Cosmos
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mb-8">
              The celestial coordinates you're looking for don't exist in this universe. 
              Let's navigate you back to known space.
            </p>

            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-sm uppercase tracking-wider hover:bg-sky-500/20 hover:border-sky-400/50 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Return to Mission Control
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
