"use client";

import { useEffect, useState, useMemo } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion } from "framer-motion";
import { HiOutlineArrowLeft, HiOutlineBookOpen, HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { RiLineChartFill, RiHistoryLine, RiMentalHealthFill } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export default function EmotionalLedgerPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('emotional_ledger')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) setLedger(data);
      setLoading(false);
    };

    fetchLedger();
  }, [user, supabase]);

  const emotionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    ledger.forEach(entry => {
      counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [ledger]);

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 shadow-2xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-[3rem] h-full w-full overflow-hidden overflow-y-auto relative border border-white/5 shadow-2xl scrollbar-hide">
      <div className="p-8 md:p-12 space-y-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-x-6">
            <button
              onClick={() => router.back()}
              className="p-4 bg-white/5 rounded-2xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/5"
            >
              <HiOutlineArrowLeft size={24} />
            </button>
            <div className="space-y-1">
              <h1 className="text-white text-4xl font-black italic uppercase tracking-tighter">
                Emotional <span className="text-emerald-500">Ledger</span>
              </h1>
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.3em]">Neural Resonance Archive</p>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl flex items-center gap-x-4">
            <RiMentalHealthFill className="text-emerald-500" size={24} />
            <div>
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Total Checks</p>
              <p className="text-xl font-black text-white italic">{ledger.length}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-800/40 rounded-[2rem] p-8 border border-white/5 space-y-6">
            <div className="flex items-center gap-x-3 text-neutral-400">
              <HiOutlineAdjustmentsHorizontal size={20} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Dominant Frequency</h3>
            </div>
            <div className="space-y-4">
              {emotionStats.slice(0, 3).map(([emotion, count]) => (
                <div key={emotion} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase italic">
                    <span className="text-white">{emotion}</span>
                    <span className="text-emerald-500">{Math.round((count / ledger.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / ledger.length) * 100}%` }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-neutral-800/40 rounded-[2rem] p-8 border border-white/5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <h3 className="text-white text-lg font-black italic uppercase tracking-tight">Timeline Visualization</h3>
                <p className="text-neutral-500 text-[8px] font-bold uppercase tracking-widest">Neural Resonance Over Time</p>
              </div>
              <RiLineChartFill size={20} className="text-emerald-500" />
            </div>

            <div className="flex-1 min-h-[150px] w-full relative group">
              {ledger.length > 1 ? (
                <div className="w-full h-full pt-4">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    {[0, 10, 20, 30, 40].map((y) => (
                      <line 
                        key={y} x1="0" y1={y} x2="100" y2={y} 
                        stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" 
                      />
                    ))}
                    
                    {/* The Path */}
                    <motion.path
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      d={`M ${ledger.slice(0, 10).reverse().map((entry, i) => {
                        const x = (i / (Math.min(ledger.length, 10) - 1)) * 100;
                        const y = 40 - (entry.intensity / 10) * 40;
                        return `${x} ${y}`;
                      }).join(' L ')}`}
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Points */}
                    {ledger.slice(0, 10).reverse().map((entry, i) => {
                      const x = (i / (Math.min(ledger.length, 10) - 1)) * 100;
                      const y = 40 - (entry.intensity / 10) * 40;
                      return (
                        <motion.circle
                          key={entry.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1 + i * 0.1 }}
                          cx={x} cy={y} r="1.5"
                          fill="#10b981"
                          className="drop-shadow-[0_0_5px_rgba(16,185,129,1)]"
                        />
                      );
                    })}

                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(16,185,129,0)" />
                        <stop offset="50%" stopColor="rgba(16,185,129,1)" />
                        <stop offset="100%" stopColor="rgba(16,185,129,0.2)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center text-center space-y-4 opacity-40">
                  <RiLineChartFill size={48} className="text-emerald-500/20" />
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-xs">
                    Graph rendering will stabilize after more neural check-ins.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between mt-4 text-[7px] font-black text-neutral-600 uppercase tracking-widest">
              <span>PAST SIGNALS</span>
              <span>LATEST</span>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-8">
          <div className="flex items-center gap-x-4">
            <RiHistoryLine className="text-emerald-500" size={20} />
            <h2 className="text-white text-xl font-black italic uppercase tracking-tight text-left">Resonance <span className="text-emerald-500">History</span></h2>
            <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
          </div>

          <div className="space-y-4">
            {ledger.map((entry) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-neutral-800/20 hover:bg-neutral-800/40 border border-white/5 rounded-[2rem] p-6 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-x-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-black italic border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      {entry.intensity}/10
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-x-2">
                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">{entry.emotion}</span>
                        <span className="w-1 h-1 bg-neutral-700 rounded-full" />
                        <span className="text-neutral-500 text-[9px] font-bold uppercase">{format(new Date(entry.created_at), 'MMM dd, yyyy • HH:mm')}</span>
                      </div>
                      <p className="text-white text-sm font-medium italic">
                        {entry.note || "No contextual signal recorded."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-x-1">
                    {[...Array(entry.intensity)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-emerald-500/40 rounded-full" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
            {ledger.length === 0 && (
              <div className="py-20 text-center opacity-20 space-y-4">
                <HiOutlineBookOpen size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Ledger empty. Awaiting first signal...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
