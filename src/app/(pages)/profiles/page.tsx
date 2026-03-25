"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";
import { apiGet, apiPost } from "@/utils/logger";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMagnifyingGlass, HiSparkles, HiUserGroup, HiOutlineArrowLeft } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { toast } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

interface ProfileData {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  followers_count: number;
  vents_count: number;
}

export default function ProfilesPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [recommended, setRecommended] = useState<ProfileData[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  // Fetch following IDs to track follow state
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchFollowing = async () => {
      const ids = await apiGet<string[]>('/api/follows', { params: { follower_id: currentUser.id } });
      setFollowingIds(ids);
    };
    
    fetchFollowing();
  }, [currentUser]);

  const toggleFollow = async (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();

    if (!currentUser) {
        toast.error("Log in to follow signals.");
        return;
    }

    const isFollowing = followingIds.includes(profileId);

    try {
      await apiPost('/api/follows', { follower_id: currentUser.id, following_id: profileId });
      if (isFollowing) {
        setFollowingIds(prev => prev.filter(id => id !== profileId));
        toast.success("Signal unlinked.");
        const updateFn = (p: ProfileData) => p.id === profileId ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p;
        setRecommended(prev => prev.map(updateFn));
        setProfiles(prev => prev.map(updateFn));
      } else {
        setFollowingIds(prev => [...prev, profileId]);
        toast.success("Signal linked!");
        const updateFn = (p: ProfileData) => p.id === profileId ? { ...p, followers_count: p.followers_count + 1 } : p;
        setRecommended(prev => prev.map(updateFn));
        setProfiles(prev => prev.map(updateFn));
      }
    } catch {
      toast.error("Failed to update follow.");
    }
  };

  const formatProfileData = (data: any[]): ProfileData[] => {
    return data.map(profile => ({
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      followers_count: profile.followers?.[0]?.count || 0,
      vents_count: profile.vents?.[0]?.count || 0,
    }));
  };

  // Fetch recommended profiles
  useEffect(() => {
    const fetchRecommended = async () => {
      setLoadingRecommended(true);
      
      // Also fetch who we are already following to filter them out of recommendations
      let followingData: string[] = [];
      if (currentUser?.id) {
        followingData = await apiGet<string[]>('/api/follows', { params: { follower_id: currentUser.id } });
      }

      let query = supabase
        .from("profiles")
        .select(`
          id, 
          username, 
          full_name, 
          avatar_url,
          followers:follows!following_id(count),
          vents:vents!user_id(count)
        `)
        .limit(20); // Fetch more to allow for filtering

      if (currentUser?.id) {
        query = query.neq("id", currentUser.id);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        const filtered = data
            .filter((p: { id: string; }) => p.id !== currentUser?.id && !followingData.includes(p.id))
            .slice(0, 6);
        setRecommended(formatProfileData(filtered));
      }
      setLoadingRecommended(false);
    };

    fetchRecommended();
  }, [supabase, currentUser?.id]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProfiles([]);
      return;
    }

    const fetchProfiles = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select(`
          id, 
          username, 
          full_name, 
          avatar_url,
          followers:follows!following_id(count),
          vents:vents!user_id(count)
        `)
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(20);

      if (currentUser?.id) {
        query = query.neq("id", currentUser.id);
      }

      const { data, error } = await query;

      if (!error && data) {
        setProfiles(formatProfileData(data));
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchProfiles, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase, currentUser?.id]);

  return (
    <div className="bg-neutral-900 rounded-[3rem] h-full w-full overflow-hidden overflow-y-auto relative border border-white/5 shadow-2xl scrollbar-hide">
      <Header className="bg-gradient-to-b from-neutral-800 to-black p-6 md:p-10 lg:p-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-y-6">
           <div className="flex items-center gap-x-5">
                <button
                    onClick={() => router.back()}
                    className="p-4 bg-white/5 rounded-2xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/5 shadow-xl hover:scale-105"
                >
                    <HiOutlineArrowLeft size={24} />
                </button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-x-2 text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mb-1">
                        <HiSparkles className="animate-pulse" size={12} />
                        <span>Signal Extraction Hub</span>
                    </div>
                    <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl leading-tight">
                        Neural <span className="text-emerald-500 underline decoration-emerald-500/10">Search</span>
                    </h1>
                    <p className="text-neutral-500 mt-2 font-medium text-sm max-w-sm">Synchronize with other stress frequencies and establish new collective neural links.</p>
                </div>
            </div>
            
            <div className="flex items-center gap-x-5 bg-neutral-950/40 px-6 py-4 rounded-[2rem] border border-white/5 shadow-xl backdrop-blur-xl">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Signals</span>
                    <span className="text-2xl font-black italic text-white leading-none">{recommended.length + (profiles?.length || 0)}</span>
                 </div>
                 <HiUserGroup size={32} className="text-emerald-500 opacity-30" />
            </div>
        </div>
      </Header>

      <div className="p-6 md:p-10 space-y-12">
        {/* Search Bar - Scaled Down */}
        <div className="relative group max-w-3xl mx-auto">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-emerald-500 transition-colors duration-500">
            <HiOutlineMagnifyingGlass size={24} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by @username or signal name..."
            className="w-full bg-neutral-950/60 text-white pl-16 pr-8 py-5 rounded-[2.5rem] border border-white/5 focus-visible:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all text-xl font-black italic tracking-tight placeholder:text-neutral-700 placeholder:italic"
          />
        </div>

        {/* Results / Recommended - Refined Gaps */}
        <div className="space-y-12">
          {searchQuery.trim() ? (
            <div className="space-y-8">
              <div className="flex items-center gap-x-5">
                <h3 className="text-white text-xl font-black italic uppercase tracking-tight">Extracted <span className="text-emerald-500 underline decoration-emerald-500/20">Signals</span></h3>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {profiles.length > 0 ? (
                    profiles.map((profile) => (
                      <ProfileCard 
                        key={profile.id} 
                        profile={profile} 
                        isFollowing={followingIds.includes(profile.id)}
                        onFollow={(e) => toggleFollow(e, profile.id)}
                        onClick={() => router.push(`/profiles/${profile.id}`)} 
                      />
                    ))
                  ) : !loading ? (
                    <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.4em] italic col-span-full py-20 text-center opacity-40">No signals detected on this frequency...</p>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-x-5">
                <h3 className="text-white text-xl font-black italic uppercase tracking-tight">Recommended <span className="text-emerald-500 underline decoration-emerald-500/20">Signals</span></h3>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loadingRecommended ? (
                  <div className="col-span-full py-20 flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 opacity-50 shadow-2xl shadow-emerald-500/20"></div>
                  </div>
                ) : (
                  recommended.map((profile) => (
                    <ProfileCard 
                        key={profile.id} 
                        profile={profile} 
                        isFollowing={followingIds.includes(profile.id)}
                        onFollow={(e) => toggleFollow(e, profile.id)}
                        onClick={() => router.push(`/profiles/${profile.id}`)} 
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProfileCardProps {
    profile: ProfileData;
    isFollowing: boolean;
    onFollow: (e: React.MouseEvent) => void;
    onClick: () => void;
}

function ProfileCard({ profile, isFollowing, onFollow, onClick }: ProfileCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col bg-neutral-950 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/30 transition-all duration-300 shadow-xl overflow-hidden h-[380px]"
    >
      {/* Dynamic Background / Banner Tease */}
      <div className="h-24 w-full bg-gradient-to-br from-neutral-900 to-neutral-800 relative overflow-hidden shrink-0 group-hover:from-emerald-900/10 group-hover:to-neutral-900 transition-all">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
         <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
      </div>

      <div className="px-6 pb-6 pt-0 flex flex-col flex-1 -mt-10 relative z-10 w-full items-center text-center">
        {/* Avatar Area - Scaled Down */}
        <div 
          onClick={onClick}
          className="w-24 h-24 rounded-[2.2rem] bg-neutral-950 p-1 border-4 border-neutral-900 mb-4 cursor-pointer hover:scale-105 transition-all shadow-2xl overflow-hidden shrink-0"
        >
          <div className="w-full h-full rounded-[1.6rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl font-black text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
              {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
              profile.username.charAt(0).toUpperCase()
              )}
          </div>
        </div>
        
        <div className="flex flex-col flex-1 w-full space-y-1 min-h-0">
            <h4 
                onClick={onClick}
                className="text-white font-black italic uppercase tracking-tighter text-xl group-hover:text-emerald-500 transition-colors line-clamp-1 cursor-pointer leading-tight"
            >
                {profile.full_name || "Neural Signal"}
            </h4>
            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] italic mb-4">@{profile.username}</span>
            
            <div className="flex items-center justify-center gap-x-6 py-4 border-y border-white/5 w-full mt-auto">
                <div className="flex flex-col">
                    <span className="text-white text-base font-black italic tracking-tighter leading-none">{profile.followers_count}</span>
                    <span className="text-[7px] font-black text-neutral-600 uppercase tracking-widest mt-0.5">Links</span>
                </div>
                <div className="w-[1px] h-6 bg-neutral-800" />
                <div className="flex flex-col">
                    <span className="text-white text-base font-black italic tracking-tighter leading-none">{profile.vents_count}</span>
                    <span className="text-[7px] font-black text-neutral-600 uppercase tracking-widest mt-0.5">Vents</span>
                </div>
            </div>
            
            <div className="pt-4 w-full shrink-0">
                <button
                    onClick={onFollow}
                    className={twMerge(
                        "w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95 border",
                        isFollowing 
                            ? "bg-white/5 text-neutral-500 border-white/5 hover:border-red-500/30 hover:text-red-500" 
                            : "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400"
                    )}
                >
                    {isFollowing ? "Linked" : "Link Signal"}
                </button>
            </div>
        </div>
      </div>

      <HiSparkles className="absolute -top-10 -left-10 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors transform -rotate-12 pointer-events-none" size={100} />
    </motion.div>
  );
}

