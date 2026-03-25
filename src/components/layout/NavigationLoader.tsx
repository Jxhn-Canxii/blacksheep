"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * NavigationLoader Component
 * 
 * A premium progress bar with a "fast loading" gimmick.
 * It uses a multi-stage animation to trick the brain into thinking the load is faster than it is.
 */
export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Syncing Link");

  const LOADING_MESSAGES = [
    "Syncing Link",
    "Tuning Frequency",
    "Connecting Neural Node",
    "Filtering Noise",
    "Optimizing Resonance"
  ];

  // Stage 1: Initial jump when pathname changes
  useEffect(() => {
    setLoading(true);
    setProgress(0);
    setLoadingText(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    
    // Quick burst to 30%
    const timer1 = setTimeout(() => setProgress(30), 40);
    // Rapid climb to 85% (the "gimmick")
    const timer2 = setTimeout(() => setProgress(85), 180);
    // Final completion
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setLoading(false), 200);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        >
          {/* Progress Bar Container */}
          <div className="h-[2px] w-full bg-white/5 overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ 
                duration: progress === 100 ? 0.2 : 0.8, 
                ease: progress === 85 ? "circOut" : "easeOut" 
              }}
            />
          </div>
          
          {/* Subtle Ambient Glow */}
          <motion.div 
            className="h-[1px] w-full bg-emerald-500/20 blur-sm"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1, repeat: Infinity }}
          />

          {/* Gimmick Loading Text */}
          <div className="absolute top-2 right-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-x-2"
            >
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-500/60 italic">
                {loadingText}
              </span>
              <div className="flex gap-x-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 h-0.5 rounded-full bg-emerald-500/40"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

