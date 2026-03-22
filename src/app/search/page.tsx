"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import Header from "@/components/Header";
import { Vent } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { BiSearch } from "react-icons/bi";
import { HiChatBubbleLeftRight, HiSparkles } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/UserProvider";
import { twMerge } from "tailwind-merge";
import dynamic from "next/dynamic";
import { RiMap2Line, RiLayoutGridFill } from "react-icons/ri";

const Map = dynamic(() => import("@/components/Map"), { 
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-neutral-900 animate-pulse flex items-center justify-center rounded-3xl">
            <p className="text-neutral-500 font-black uppercase tracking-[0.5em] italic">Initializing Grid...</p>
        </div>
    )
});

const SearchPage = () => {
    const { supabase } = useSupabase();
    const { user } = useUser();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [vents, setVents] = useState<Vent[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'map'>('list');
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
            setProfiles([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            
            // Search Vents by content and emotion
            const ventsQuery = supabase
                .from('vents')
                .select('*, profiles (username)')
                .or(`content.ilike.%${searchTerm}%,emotion.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });

            // Search Profiles by username
            const profilesQuery = supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${searchTerm}%`)
                .limit(10);

            const [ventsRes, profilesRes] = await Promise.all([ventsQuery, profilesQuery]);

            if (!ventsRes.error && ventsRes.data) {
                setVents(ventsRes.data as any);
            }
            if (!profilesRes.error && profilesRes.data) {
                setProfiles(profilesRes.data);
            }
            
            setLoading(false);
        };

        const timer = setTimeout(fetchResults, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, supabase]);

    return (
        <div className="bg-neutral-950 rounded-[2rem] h-full w-full overflow-hidden flex flex-col border border-white/5 relative">
            <Header className="bg-transparent p-6 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-x-2 text-emerald-500 font-black uppercase tracking-[0.3em] text-[9px]">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span>Signal Extraction</span>
                        </div>
                        <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
                            Neural <span className="text-emerald-500 underline decoration-emerald-500/10">Explore</span>
                        </h1>
                        <p className="text-neutral-500 text-sm font-medium opacity-80">Locate specific stress frequencies across the grid.</p>
                    </div>

                    <div className="flex items-center gap-x-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner backdrop-blur-md">
                        <button
                            onClick={() => setView('list')}
                            className={twMerge(
                                "flex items-center gap-x-2 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                view === 'list' ? "bg-emerald-500 text-black shadow-lg" : "text-neutral-500 hover:text-white"
                            )}
                        >
                            <RiLayoutGridFill size={14} />
                            List
                        </button>
                        <button
                            onClick={() => setView('map')}
                            className={twMerge(
                                "flex items-center gap-x-2 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                view === 'map' ? "bg-emerald-500 text-black shadow-lg" : "text-neutral-500 hover:text-white"
                            )}
                        >
                            <RiMap2Line size={14} />
                            Grid Map
                        </button>
                    </div>
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
                <AnimatePresence mode="wait">
                    {view === 'list' ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            {loading && (
                                <div className="flex justify-center p-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
                                </div>
                            )}
                            
                            {!loading && vents.length === 0 && profiles.length === 0 && searchTerm && (
                                <div className="text-center p-12 text-neutral-700 font-black uppercase tracking-widest text-[10px] italic">
                                    No results matched your search. Try another keyword.
                                </div>
                            )}

                            {/* Profiles Section */}
                            {profiles.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-x-4 mb-4">
                                        <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Neural <span className="text-emerald-500">Entities</span></h2>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {profiles.map((p) => (
                                            <Link 
                                                key={p.id}
                                                href={`/profiles/${p.id}`}
                                                className="bg-neutral-900/60 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex items-center gap-x-3 hover:border-emerald-500/30 transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black">
                                                    {p.avatar_url ? (
                                                        <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover rounded-xl" />
                                                    ) : (
                                                        p.username?.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white text-[11px] font-black italic uppercase tracking-tight truncate max-w-[100px]">@{p.username}</p>
                                                    <p className="text-neutral-500 text-[8px] font-bold uppercase tracking-widest">Active Link</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vents Section */}
                            {vents.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-x-4 mb-4">
                                        <h2 className="text-xs font-black text-white uppercase tracking-widest italic">Signal <span className="text-emerald-500">Bursts</span></h2>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
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
                                                                {isFollowing ? 'Linked' : 'Link Signal'}
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
                                                                <HiChatBubbleLeftRight size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="map"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-[600px] w-full rounded-[2.5rem] border border-white/10 overflow-hidden shadow-3xl mb-12"
                        >
                            <Map view="public" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Decorative blurs */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            </div>
        </div>
    );
};

export default SearchPage;
