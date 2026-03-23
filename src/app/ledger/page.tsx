"use client";

import { useEffect, useState, useMemo } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion } from "framer-motion";
import { HiOutlineBookOpen, HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { RiLineChartFill, RiHistoryLine, RiMentalHealthFill, RiSparklingFill, RiVerifiedBadgeFill, RiSecurePaymentLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { twMerge } from "tailwind-merge";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function EmotionalLedgerPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user, userDetails } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  const isVerifiedPlanEnabled = process.env.NEXT_PUBLIC_ENABLE_VERIFIED_PLAN === 'true';

  
  // SWR Fetchers
  const { data: ledger = [], mutate: mutateLedger, isLoading: loadingLedger } = useSWR(
    user ? `ledger-${user.id}` : null,
    async () => {
      const { data, error } = await (supabase
        .from('emotional_ledger') as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error("Unable to access emotional ledger.");
        throw error;
      }
      return (data as any[]) || [];
    }
  );

  const { data: vents = [], mutate: mutateVents, isLoading: loadingVents } = useSWR(
    user ? `vents-${user.id}` : null,
    async () => {
      const { data, error } = await (supabase
        .from('vents') as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    }
  );

  const loading = loadingLedger || loadingVents;

  // Real-time Subscription for instant updates
  useEffect(() => {
    if (!user) return;

    const ledgerChannel = supabase
      .channel('ledger-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'emotional_ledger',
        filter: `user_id=eq.${user.id}`
      }, () => {
        mutateLedger();
      })
      .subscribe();

    const ventsChannel = supabase
      .channel('vents-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'vents',
        filter: `user_id=eq.${user.id}`
      }, () => {
        mutateVents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ledgerChannel);
      supabase.removeChannel(ventsChannel);
    };
  }, [user, supabase, mutateLedger, mutateVents]);

<<<<<<< HEAD
  const handleToggleBadge = async () => {
    if (!user || !userDetails) return;
    const newValue = !userDetails.show_verified_badge;
    
    const { error } = await (supabase
      .from('profiles') as any)
      .update({ show_verified_badge: newValue } as any)
      .eq('id', user.id);
    
    if (!error) {
      // refreshProfile is available in useUser
      window.location.reload(); // Simple way to refresh for now
    }
  };

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: 'price_verified_neural_link' }) // In production, use your real Stripe Price ID
      });
      
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };
=======
>>>>>>> f4e00dceb922962322fc465abc0d2c2f6fb30374

  const combinedHistory = useMemo(() => {
    const combined = [
      ...ledger.map(item => ({ ...(item as any), type: 'ledger' })),
      ...vents.map(item => ({ ...(item as any), type: 'vent' }))
    ];
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [ledger, vents]);

  const stats = useMemo(() => {
    const allEmotions = [...(ledger as any[]), ...(vents as any[])].map(item => item.emotion);
    const counts: Record<string, number> = {};
    allEmotions.forEach(emotion => {
      if (emotion) counts[emotion] = (counts[emotion] || 0) + 1;
    });

    const sortedEmotions = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    
    // Peak Activity Hour
    const hours = combinedHistory.map(item => new Date(item.created_at).getHours());
    const hourCounts: Record<number, number> = {};
    hours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Emotional Range (unique emotions)
    const range = new Set(allEmotions).size;

    return {
      sortedEmotions,
      peakHour: peakHour !== undefined ? `${peakHour}:00` : 'N/A',
      range,
      totalSignals: combinedHistory.length,
      ledgerCount: ledger.length,
      ventCount: vents.length
    };
  }, [ledger, vents, combinedHistory]);

  const chartData = useMemo(() => {
    // Last 7 days
    const days = [...Array(7)].map((_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: startOfDay(date),
        label: format(date, 'MMM dd'),
        intensity: 0,
        count: 0
      };
    }).reverse();

    combinedHistory.forEach(item => {
      const itemDate = new Date(item.created_at);
      const day = days.find(d => startOfDay(itemDate).getTime() === d.date.getTime());
      if (day) {
        // Vents are treated as intensity 5 by default for the chart
        const val = item.type === 'ledger' ? item.intensity : 5;
        day.intensity += val;
        day.count += 1;
      }
    });

    return days.map(d => ({
      ...d,
      value: d.count > 0 ? Number((d.intensity / d.count).toFixed(1)) : 0
    }));
  }, [combinedHistory]);

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
              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Total Signals</p>
              <p className="text-xl font-black text-white italic">{stats.totalSignals}</p>
            </div>
          </div>
        </div>

        {/* Verified Badge / Subscription Section */}
        {isVerifiedPlanEnabled && (
          <div className="bg-neutral-800/20 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-emerald-500/10 transition-all duration-700" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-x-6">
                <div className={twMerge(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all duration-500",
                  userDetails?.is_verified 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                    : "bg-neutral-900 border-white/5 text-neutral-600"
                )}>
                  {userDetails?.is_verified ? <RiVerifiedBadgeFill size={32} /> : <RiSecurePaymentLine size={32} />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-x-2">
                    <h3 className="text-white text-xl font-black italic uppercase tracking-tight">
                      {userDetails?.is_verified ? "Verified Neural Link" : "Upgrade to Verified"}
                    </h3>
                    {userDetails?.is_verified && (
                      <span className="bg-emerald-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <p className="text-neutral-500 text-xs font-medium max-w-md">
                    {userDetails?.is_verified 
                      ? "Your signals are prioritized and authenticated on the global grid. Thank you for supporting the collective."
                      : "Unlock the exclusive verified badge next to your signals and support the development of the neural network."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-neutral-800/40 rounded-[2rem] p-8 border border-white/5 space-y-6">
            <div className="flex items-center gap-x-3 text-neutral-400">
              <HiOutlineAdjustmentsHorizontal size={20} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Dominant Frequencies</h3>
            </div>
            <div className="space-y-4">
              {stats.sortedEmotions.slice(0, 3).map(([emotion, count]) => (
                <div key={emotion} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase italic">
                    <span className="text-white">{emotion}</span>
                    <span className="text-emerald-500">{Math.round((count / stats.totalSignals) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / stats.totalSignals) * 100}%` }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-800/40 rounded-[2rem] p-8 border border-white/5 flex flex-col justify-center items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <RiHistoryLine size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Peak Activity</p>
              <p className="text-2xl font-black text-white italic">{stats.peakHour}</p>
            </div>
          </div>

          <div className="bg-neutral-800/40 rounded-[2rem] p-8 border border-white/5 flex flex-col justify-center items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
              <RiSparklingFill size={24} className="text-purple-500" />
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Emotional Range</p>
              <p className="text-2xl font-black text-white italic">{stats.range} <span className="text-[10px] text-neutral-600">types</span></p>
            </div>
          </div>

          <div className="bg-neutral-800/40 rounded-[2rem] p-8 border border-white/5 flex flex-col justify-center items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-3 bg-emerald-500/40 rounded-full" />
                <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                <div className="w-1.5 h-4 bg-emerald-500/60 rounded-full" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Vibe Ratio</p>
              <div className="flex items-center gap-x-2">
                <p className="text-lg font-black text-white italic">{stats.ledgerCount}<span className="text-[8px] text-neutral-600 ml-1">CHK</span></p>
                <span className="text-neutral-700">/</span>
                <p className="text-lg font-black text-emerald-500 italic">{stats.ventCount}<span className="text-[8px] text-neutral-600 ml-1">VNT</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Neural Resonance Chart */}
        <div className="bg-neutral-800/20 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-4">
              <RiLineChartFill className="text-emerald-500" size={20} />
              <h2 className="text-white text-xl font-black italic uppercase tracking-tight">Resonance <span className="text-emerald-500">Timeline</span></h2>
            </div>
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Last 7 Cycles</span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737373', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#737373', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#171717', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                  itemStyle={{ color: '#10b981' }}
                  cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={2000}
                />
                <ReferenceLine y={5} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
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
            {combinedHistory.map((entry) => (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-neutral-800/20 hover:bg-neutral-800/40 border border-white/5 rounded-[2rem] p-6 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-x-6">
                    <div className={twMerge(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black italic border transition-transform group-hover:scale-110",
                      entry.type === 'ledger' 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {entry.type === 'ledger' ? `${entry.intensity}/10` : 'VNT'}
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-x-2">
                        <span className={twMerge(
                          "text-[10px] font-black uppercase tracking-[0.2em]",
                          entry.type === 'ledger' ? "text-emerald-500" : "text-blue-400"
                        )}>
                          {entry.emotion}
                        </span>
                        <span className="w-1 h-1 bg-neutral-700 rounded-full" />
                        <span className="text-neutral-500 text-[9px] font-bold uppercase">{format(new Date(entry.created_at), 'MMM dd, yyyy • HH:mm')}</span>
                        {entry.type === 'vent' && (
                          <span className="bg-blue-500/5 text-blue-400/50 text-[7px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-500/10">Externalized</span>
                        )}
                      </div>
                      <p className="text-white text-sm font-medium italic">
                        {entry.type === 'ledger' 
                          ? (entry.note || "No contextual signal recorded.")
                          : (entry.content || "Vent content archived.")
                        }
                      </p>
                    </div>
                  </div>
                  {entry.type === 'ledger' && (
                    <div className="flex gap-x-1">
                      {[...Array(entry.intensity)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-emerald-500/40 rounded-full" />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {combinedHistory.length === 0 && (
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
