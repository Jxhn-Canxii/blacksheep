"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiFire } from "react-icons/hi2";
import { RiBubbleChartFill } from "react-icons/ri";
import { apiGet } from "@/utils/logger";
import { useSupabase } from "@/hooks/useSupabase";

interface TrendingEmotion {
    emotion: string;
    count: number;
}

/**
 * TrendingFeelings Component
 *
 * Aggregates emotions from vents in the last 24 hours via /api/vents/trending.
 * Realtime subscription (push channel) triggers a refresh on new vents — this is
 * the allowed exception per ARCHITECTURE.md (push channels stay in components).
 */
const TrendingFeelings = ({ initialData = [] }: { initialData?: TrendingEmotion[] }) => {
    const { supabase } = useSupabase();
    const [trending, setTrending] = useState<TrendingEmotion[]>(initialData);
    const [loading, setLoading] = useState(initialData.length === 0);

    const fetchTrending = async () => {
        try {
            const data = await apiGet<TrendingEmotion[]>('/api/vents/trending');
            setTrending(data);
        } catch {
            // error already logged by apiGet
        }
        setLoading(false);
    };

    useEffect(() => {
        if (initialData.length === 0) {
            fetchTrending();
        }

        // Realtime push channel — allowed exception per ARCHITECTURE.md.
        // On new vent insert, debounce a refresh via the API route.
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const channel = supabase
            .channel('trending-refresh')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vents' }, () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => fetchTrending(), 5000);
            })
            .subscribe();

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase, initialData]);

    if (loading) return (
        <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/5 rounded-full w-24"></div>
            <div className="h-2 bg-white/5 rounded-full w-full"></div>
            <div className="h-2 bg-white/5 rounded-full w-3/4"></div>
        </div>
    );

    if (trending.length === 0) return (
        <div className="flex flex-col gap-y-2 opacity-40">
            <div className="flex items-center gap-x-2 text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
               <RiBubbleChartFill size={16} />
               <span>Collective Calm</span>
            </div>
            <p className="text-[10px] text-neutral-600 font-medium italic">No emotional tidal waves today.</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-y-3">
            <div className="flex items-center gap-x-2 text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-2">
               <HiFire size={18} className="animate-pulse" />
               <span className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">Collective Resonance</span>
            </div>

            <AnimatePresence mode="popLayout">
                {trending.map((item, index) => (
                    <motion.div
                        key={item.emotion}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col gap-y-1.5 group cursor-default"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white/80 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">
                                {item.emotion}
                            </span>
                            <span className="text-[10px] font-black font-mono text-emerald-500/40">
                                {item.count}
                             </span>
                        </div>
                        <div className="h-1.5 bg-neutral-900 w-full rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (item.count / trending[0].count) * 100)}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                                />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default TrendingFeelings;
