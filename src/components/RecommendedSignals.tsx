"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiSparkles, HiLink } from "react-icons/hi2";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import toast from "react-hot-toast";

interface RecommendedProfile {
  id: string;
  username: string;
  full_name: string | null;
  followers_count: number;
  vents_count: number;
}

const RecommendedSignals = () => {
  const { supabase } = useSupabase();
  const { user: currentUser } = useUser();
  const [recommended, setRecommended] = useState<RecommendedProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowing = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUser.id);
    if (data) setFollowingIds(data.map(f => (f as any).following_id));
  };

  const fetchRecommended = async () => {
    setLoading(true);

    // Fetch following list first to ensure accurate filtering
    let following: string[] = [];
    if (currentUser?.id) {
       const { data: fData } = await supabase.from('follows').select('following_id').eq('follower_id', currentUser.id);
       if (fData) following = fData.map(f => (f as any).following_id as string);
    }

    let query = supabase
      .from("profiles")
      .select(`
        id, 
        username, 
        full_name,
        followers:follows!following_id(count),
        vents:vents!user_id(count)
      `)
      .limit(10); // Fetch more to allow for filtering out self/follows

    if (currentUser?.id) {
      query = query.neq("id", currentUser.id);
    }

    const { data, error } = await query;
    if (!error && data) {
      const filtered = (data as any[])
        .filter(p => p.id !== currentUser?.id && !following.includes(p.id))
        .slice(0, 3);

      setRecommended(filtered.map(p => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        followers_count: p.followers?.[0]?.count || 0,
        vents_count: p.vents?.[0]?.count || 0,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFollowing();
    fetchRecommended();
  }, [supabase, currentUser?.id]);

  const toggleFollow = async (profileId: string) => {
    if (!currentUser) return;
    const isFollowing = followingIds.includes(profileId);
    
    if (isFollowing) {
      const { error } = await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", profileId);
      if (!error) {
        setFollowingIds(prev => prev.filter(id => id !== profileId));
        setRecommended(prev => prev.map(p => p.id === profileId ? { ...p, followers_count: Math.max(0, p.followers_count - 1)} : p));
        toast.success("Unlinked signal.");
      }
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: profileId });
      if (!error) {
        setFollowingIds(prev => [...prev, profileId],);
        setRecommended(prev => prev.map(p => p.id === profileId ? { ...p, followers_count: p.followers_count + 1} : p));
        toast.success("Linked signal!");
      }
    }
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse px-1">
      <div className="h-2 w-1/3 bg-white/5 rounded-full" />
      <div className="flex items-center gap-x-3">
        <div className="w-8 h-8 rounded-xl bg-white/5" />
        <div className="space-y-1">
          <div className="h-2 w-20 bg-white/5 rounded-full" />
          <div className="h-1.5 w-12 bg-white/5 rounded-full" />
        </div>
      </div>
    </div>
  );

  if (recommended.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-neutral-600 font-black uppercase tracking-widest text-[9px] mb-1 px-1">
          <div className="flex items-center gap-x-2">
            <span className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full" />
            <span>Recommended Signals</span>
          </div>
          <Link href="/profiles" className="text-emerald-500 hover:text-emerald-400 transition-colors lowercase tracking-normal font-medium">more</Link>
      </div>

      <div className="flex flex-col gap-y-3 px-1">
        <AnimatePresence>
          {recommended.map((profile) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between group"
            >
              <Link
                href={`/profile/${profile.id}`}
                className="flex items-center gap-x-3 flex-1 min-w-0"
              >
                <div className="w-9 h-9 rounded-[0.8rem] bg-neutral-900 border border-white/5 flex items-center justify-center text-xs font-black text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black italic uppercase tracking-tighter text-white truncate group-hover:text-emerald-500 transition-colors">
                    {profile.full_name || `@${profile.username}`}
                  </span>
                  <div className="flex items-center gap-x-2">
                    <span className="text-[7px] font-bold text-neutral-600 uppercase tracking-widest whitespace-nowrap">
                        {profile.followers_count} LINKS
                    </span>
                    <span className="w-0.5 h-0.5 bg-neutral-800 rounded-full" />
                    <span className="text-[7px] font-bold text-neutral-600 uppercase tracking-widest whitespace-nowrap">
                        {profile.vents_count} VENTS
                    </span>
                  </div>
                </div>
              </Link>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleFollow(profile.id);
                }}
                className={twMerge(
                  "p-2 rounded-lg transition-all border shadow-sm active:scale-90",
                  followingIds.includes(profile.id)
                    ? "text-neutral-600 border-white/5 bg-white/5 hover:text-red-500"
                    : "text-emerald-500 border-emerald-500/10 hover:bg-emerald-500/10"
                )}
                title={followingIds.includes(profile.id) ? "Unlink Signal" : "Link Signal"}
              >
                <HiLink size={12} className={followingIds.includes(profile.id) ? "opacity-40" : ""} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecommendedSignals;
