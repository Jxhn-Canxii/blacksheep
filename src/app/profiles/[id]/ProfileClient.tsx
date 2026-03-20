"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowLeft, HiSparkles, HiUserGroup, HiOutlineChatBubbleBottomCenterText } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { toast } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

interface ProfileData {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
}

export default function ProfileClient({ profileId }: { profileId: string }) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [vents, setVents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      
      // Fetch profile info
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileError) {
        toast.error("Profile not found.");
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // Fetch user's vents
      const { data: ventsData } = await supabase
        .from("vents")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });
      setVents(ventsData || []);

      // Fetch user's groups (circles they belong to)
      const { data: groupsData } = await supabase
        .from("group_members")
        .select("groups(*)")
        .eq("user_id", profileId);
      
      if (groupsData) {
        setGroups(groupsData.map((g: any) => g.groups));
      }

      // Check if following
      if (currentUser) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUser.id)
          .eq('following_id', profileId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };

    fetchProfileData();
  }, [supabase, profileId, currentUser]);

  const toggleFollow = async () => {
    if (!currentUser) {
      toast.error("Please login to follow.");
      return;
    }
    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', profileId);
      if (!error) {
        setIsFollowing(false);
        toast.success("Unfollowed frequency.");
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: currentUser.id, following_id: profileId }]);
      if (!error) {
        setIsFollowing(true);
        toast.success("Synchronized with frequency!");
      }
    }
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 rounded-[3rem] h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 shadow-2xl"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-neutral-900 rounded-[3rem] h-full w-full flex flex-col items-center justify-center text-neutral-500 gap-y-4">
        <HiUserGroup size={64} className="opacity-20" />
        <p className="font-black uppercase tracking-widest text-sm italic">Neural Link Broken...</p>
        <button onClick={() => router.back()} className="text-emerald-500 underline uppercase text-xs font-black tracking-widest">Return to Safe Space</button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileId;

  return (
    <div className="bg-neutral-900 rounded-[3rem] h-full w-full overflow-hidden overflow-y-auto relative border border-white/5 shadow-2xl scrollbar-hide">
      <Header className="bg-gradient-to-b from-neutral-800 to-black p-8">
        <div className="flex items-center gap-x-6">
          <button
            onClick={() => router.back()}
            className="p-4 bg-white/5 rounded-2xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/5"
          >
            <HiOutlineArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
              Neural <span className="text-emerald-500 underline decoration-emerald-500/10">Link</span>
            </h1>
            <p className="text-neutral-500 mt-2 font-medium">@{profile.username}</p>
          </div>
        </div>
      </Header>

      <div className="p-8 space-y-12">
        {/* Profile Stats Card */}
        <div className="bg-neutral-800/40 rounded-[3rem] p-10 border border-white/5 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-4xl font-black text-emerald-500 shadow-2xl overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile.username.charAt(0).toUpperCase()
              )}
            </div>
            
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-1">
                <h2 className="text-white text-3xl font-black italic uppercase tracking-tight">{profile.full_name || "Unknown Entity"}</h2>
                <p className="text-emerald-500 font-bold tracking-[0.3em] uppercase text-xs">Synchronized Stress-Blower</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-white text-2xl font-black italic">{vents.length}</span>
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Vents Released</span>
                </div>
                <div className="w-[1px] h-8 bg-white/5" />
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-white text-2xl font-black italic">{groups.length}</span>
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Active Circles</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-x-3">
              {!isOwnProfile && (
                <>
                  <button
                    disabled={followLoading}
                    onClick={toggleFollow}
                    className={twMerge(
                      "px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95",
                      isFollowing 
                        ? "bg-neutral-800 text-neutral-400 border border-white/5 hover:bg-neutral-700 hover:text-white" 
                        : "bg-emerald-500 text-black shadow-emerald-500/20 hover:bg-emerald-400"
                    )}
                  >
                    {isFollowing ? "Unfollow Signal" : "Synchronize"}
                  </button>
                  <button
                    onClick={() => router.push(`/chat?user=${profileId}`)}
                    className="p-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all active:scale-95"
                    aria-label="Direct Message"
                  >
                    <HiOutlineChatBubbleBottomCenterText size={20} />
                  </button>
                </>
              )}
              {isOwnProfile && (
                <button 
                  onClick={() => router.push('/profile/settings')}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest transition-all"
                >
                  Calibrate Neural Link
                </button>
              )}
            </div>
          </div>

          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
        </div>

        {/* Vents Feed */}
        <div className="space-y-8">
          <div className="flex items-center gap-x-4">
            <h3 className="text-white text-xl font-black italic uppercase tracking-tight">Recent <span className="text-emerald-500 underline decoration-emerald-500/10">Vents</span></h3>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vents.length > 0 ? (
              vents.map((vent) => (
                <motion.div
                  key={vent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-800/40 rounded-[2.5rem] p-8 border border-white/5 hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20">
                      {vent.emotion || "Release"}
                    </span>
                    <span className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest">
                      {new Date(vent.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white font-medium italic leading-relaxed group-hover:text-emerald-500 transition-colors">"{vent.content}"</p>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4 opacity-20">
                <HiOutlineChatBubbleBottomCenterText size={48} className="mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.4em] italic">Frequency Silent...</p>
              </div>
            )}
          </div>
        </div>

        {/* Circles Feed */}
        <div className="space-y-8">
          <div className="flex items-center gap-x-4">
            <h3 className="text-white text-xl font-black italic uppercase tracking-tight">Active <span className="text-emerald-500">Circles</span></h3>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
          </div>

          <div className="flex flex-wrap gap-4">
            {groups.length > 0 ? (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="px-6 py-4 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-2xl border border-white/5 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-x-3 group"
                >
                  <HiUserGroup size={18} className="text-emerald-500 group-hover:text-black" />
                  {group.name}
                </button>
              ))
            ) : (
              <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.2em] italic pl-4">No circles joined yet...</p>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  );
}
