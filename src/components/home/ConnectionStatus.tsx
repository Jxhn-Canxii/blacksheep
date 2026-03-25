"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineWifi, HiOutlineGlobeAlt } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { apiPost } from "@/utils/logger";

/**
 * ConnectionStatus Component
 * 
 * Monitors online/offline status and provides neural-themed notifications.
 * Features:
 * - Real-time network monitoring
 * - Premium animation for status changes
 * - Mobile-optimized positioning
 */
const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const syncOfflineVents = async () => {
      const pendingVents = JSON.parse(localStorage.getItem('pending_vents') || '[]');
      if (pendingVents.length === 0) return;

      toast.loading(`Synchronizing ${pendingVents.length} cached signals...`, { id: 'sync-toast' });

      let successCount = 0;
      for (const vent of pendingVents) {
        const { content, emotion, user_id, location } = vent;
        try {
          await apiPost('/api/vents', { content, emotion, user_id, location });
          successCount++;
        } catch {
          // leave failed vents in pending
        }
      }

      localStorage.setItem('pending_vents', '[]');
      toast.success(`Grid Synchronized: ${successCount} signals released.`, { id: 'sync-toast', icon: '⚡' });
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      toast.success("Neural Link Re-established", {
        icon: '📡',
        style: {
          background: '#064e3b',
          color: '#10b981',
          border: '1px solid rgba(16,185,129,0.2)'
        }
      });
      
      syncOfflineVents();
      
      // Auto-hide after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
      toast.error("Neural Link Severed - Offline Mode", {
        icon: '🔌',
        style: {
          background: '#450a0a',
          color: '#ef4444',
          border: '1px solid rgba(239,68,68,0.2)'
        }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-3xl flex items-center gap-x-4"
        >
          <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {isOnline ? <HiOutlineWifi size={20} /> : <HiOutlineGlobeAlt size={20} className="animate-pulse" />}
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
              {isOnline ? 'Link Synchronized' : 'Signal Lost'}
            </span>
            <span className="text-neutral-400 text-[8px] font-bold uppercase tracking-widest">
              {isOnline ? 'Network Grid Active' : 'Restricted Local Access'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;

