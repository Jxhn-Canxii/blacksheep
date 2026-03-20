"use client";

import { RiLoader4Fill } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = "Connecting Neural Link..." 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center gap-y-4 cursor-wait"
        >
          <RiLoader4Fill className="text-emerald-500 animate-spin" size={40} />
          <div className="flex flex-col items-center">
            <h2 className="text-white font-black italic tracking-tighter text-xl uppercase">
              BLACK <span className="text-emerald-500">SHEEP</span>
            </h2>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 animate-pulse">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
