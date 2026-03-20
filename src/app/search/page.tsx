"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import Header from "@/components/Header";
import { Vent } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { BiSearch } from "react-icons/bi";
import { HiOutlineChatBubbleLeftRight, HiSparkles } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { twMerge } from "tailwind-merge";

const SearchPage = () => {
    const { supabase } = useSupabase();
    const { user } = useUser();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [vents, setVents] = useState<Vent[]>([]);
    const [loading, setLoading] = useState(false);
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [followerIds, setFollowerIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchFollowData = async () => {
            if (!user) return;
            const [following, followers] = await Promise.all([
                supabase.from('follows').select('following_id').eq('follower_id', user.id),
                supabase.from('follows').select('follower_id').eq('following_id', user.id)
            ]);
            if (!following.error && following.data) setFollowingIds(following.data.map(f => f.following_id));
            if (!followers.error && followers.data) setFollowerIds(followers.data.map(f => f.follower_id));
        };
        fetchFollowData();
    }, [user, supabase]);

    const toggleFollow = async (targetId: string) => {
        if (!user) {
            router.push('/');
            return;
        }
        const isCurrentlyFollowing = followingIds.includes(targetId);
        if (isCurrentlyFollowing) {
            const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
            if (!error) setFollowingIds(prev => prev.filter(id => id !== targetId));
        } else {
            const { error } = await supabase.from('follows').insert([{ follower_id: user.id, following_id: targetId }]);
            if (!error) setFollowingIds(prev => [...prev, targetId]);
        }
    };

    useEffect(() => {
        if (!searchTerm) {
            setVents([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('vents')
                .select('*, profiles (username)')
                .ilike('content', `%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setVents(data as any);
            }
            setLoading(false);
        };

        const timer = setTimeout(fetchResults, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, supabase]);

    return (
        <div className="bg-neutral-950 rounded-[2rem] h-full w-full overflow-hidden flex flex-col border border-white/5 relative">
            <Header className="bg-transparent p-6 lg:p-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-x-2 text-emerald-500 font-black uppercase tracking-[0.3em] text-[9px]">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span>Signal Extraction</span>
                    </div>
                    <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
                        Neural <span className="text-emerald-500 underline decoration-emerald-500/10">Search</span>
                    </h1>
                    <p className="text-neutral-500 text-sm font-medium opacity-80">Locate specific stress frequencies by keyword.</p>
                </div>
            </Header>

            <div className="px-6 lg:px-8 pb-6">
                <div className="relative group max-w-2xl">
                    <BiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-emerald-500 transition-colors duration-300" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search resonance (e.g., 'work', 'angry', 'sad')..."
                        aria-label="Search bubbles"
                        className="w-full bg-neutral-900/60 text-white p-4 pl-12 rounded-xl border border-white/5 outline-none focus:border-emerald-500/30 transition-all duration-300 shadow-xl text-sm font-medium placeholder:italic placeholder:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 lg:px-8 scrollbar-hide pt-0">
                {loading && (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
                    </div>
                )}
                
                {!loading && vents.length === 0 && searchTerm && (
                    <div className="text-center p-12 text-neutral-700 font-black uppercase tracking-widest text-[10px] italic">
                        No bubbles matched your search. Try another keyword.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2 pb-24">
                    <AnimatePresence>
                        {vents.map((vent, i) => {
                            const anonymousName = vent.user_id ? `Anonymous-${vent.user_id.slice(-4)}` : "Anonymous-0000";
                            const isFollowing = followingIds.includes(vent.user_id);
                            const isFollower = followerIds.includes(vent.user_id);
                            const isFriend = isFollowing && isFollower;

                            return (
                                <motion.div
                                    key={vent.id}
                                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-5 rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-white/5 shadow-xl flex flex-col hover:border-emerald-500/20 transition-all duration-500 group"
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-[30px] pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-1000" />
                                    
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest italic">{anonymousName}</span>
                                            {isFriend && (
                                                <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-x-1 mt-0.5">
                                                    <HiSparkles size={8} /> Neural Friend
                                                </span>
                                            )}
                                        </div>
                                        {user && user.id !== vent.user_id && (
                                            <button
                                                onClick={() => toggleFollow(vent.user_id)}
                                                className={twMerge(
                                                    "px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                                                    isFollowing 
                                                        ? "bg-white/5 text-neutral-500 border-white/5 hover:border-red-500/30 hover:text-red-500" 
                                                        : "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20"
                                                )}
                                            >
                                                {isFollowing ? 'Disconnect' : 'Connect'}
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-neutral-200 text-sm font-medium leading-relaxed mb-6">"{vent.content}"</p>
                                    
                                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                                        <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">{new Date(vent.created_at).toLocaleDateString([], { dateStyle: 'short' })}</span>
                                        {isFriend && (
                                            <button
                                                onClick={() => router.push(`/chat/dm?user=${vent.user_id}`)}
                                                className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black rounded-xl transition-all border border-emerald-500/20 active:scale-90"
                                                title="Connect via Signal (Friend)"
                                            >
                                                <HiOutlineChatBubbleLeftRight size={18} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Decorative blurs */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
};

export default SearchPage;
