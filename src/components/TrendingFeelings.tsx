"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiFire } from "react-icons/hi2";
import { RiBubbleChartFill } from "react-icons/ri";

interface TrendingEmotion {
    emotion: string;
    count: number;
}

/**
 * TrendingFeelings Component
 * 
 * Aggregates emotions from vents in the last 24 hours.
 * Displays them with premium progress bars and real-time updates.
 */
const TrendingFeelings = ({ initialData = [] }: { initialData?: TrendingEmotion[] }) => {
    const { supabase } = useSupabase();
    const [trending, setTrending] = useState<TrendingEmotion[]>(initialData);
    const [loading, setLoading] = useState(initialData.length === 0);

    useEffect(() => {
        const fetchTrending = async () => {
            // Only skip if we already have initialData and it's the first run
            // But we actually want to keep it fresh, so maybe just use initialData as a starter
            
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            const { data, error } = await (supabase as any)
                .from('vents')
                .select('emotion')
                .gte('created_at', yesterday);

            if (!error && (data as any[])) {
                const counts: { [key: string]: number } = {};
                (data as any[]).forEach(v => {
                    if (v.emotion) {
                        counts[v.emotion] = (counts[v.emotion] || 0) + 1;
                    }
                });

                const sorted = Object.entries(counts)
                    .map(([emotion, count]) => ({ emotion, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setTrending(sorted);
            }
            setLoading(false);
        };

        if (initialData.length === 0) {
            fetchTrending();
        }

        // Subscribe to vents to refresh trending live — debounced to avoid excessive queries
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
