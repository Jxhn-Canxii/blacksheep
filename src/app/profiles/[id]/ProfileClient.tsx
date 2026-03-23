"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowLeft, HiSparkles, HiUserGroup, HiOutlineChatBubbleBottomCenterText, HiOutlineChatBubbleOvalLeftEllipsis, HiHandHeart, HiOutlinePlusCircle } from "react-icons/hi2";
import { RiHandHeartLine, RiShareForwardLine, RiBubbleChartFill, RiLineChartFill } from "react-icons/ri";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import VentForm from "@/components/VentForm";
import BlackSheepAssistant from "@/components/BlackSheepAssistant";
import { toast } from "react-hot-toast";
import { twMerge } from "tailwind-merge";
import { getEmotionColor } from "@/libs/emotionColors";

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
  const [sharedVents, setSharedVents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'released' | 'synchronized'>('released');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [showPostForm, setShowPostForm] = useState(false);

  const [expandedVentId, setExpandedVentId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  const fetchProfileData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    
    try {
      const [
        { data: profileData },
        { data: ventsData },
        { data: sharedData },
        { data: groupsData },
        { data: followData }
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", profileId).single(),
        supabase.from("vents")
          .select(`*, profiles(username, avatar_url, is_verified, show_verified_badge), vent_reactions(id, user_id, type)`)
          .eq("user_id", profileId)
          .order("created_at", { ascending: false })
          .range(0, (page + 1) * ITEMS_PER_PAGE - 1),
        supabase.from("pulse_shares")
          .select(`vents(*, profiles(username, avatar_url, is_verified, show_verified_badge), vent_reactions(id, user_id, type))`)
          .eq("user_id", profileId)
          .order("created_at", { ascending: false, foreignTable: 'vents' })
          .range(0, (page + 1) * ITEMS_PER_PAGE - 1),
        supabase.from("group_members").select("groups(*)").eq("user_id", profileId),
        currentUser ? supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', profileId).maybeSingle() : Promise.resolve({ data: null })
      ]);

      if (profileData) setProfile(profileData);
      if (ventsData) setVents(ventsData);
      if (sharedData) setSharedVents(sharedData.map((s: any) => s.vents).filter(Boolean));
      if (groupsData) setGroups(groupsData.map((g: any) => g.groups));
      if (followData !== undefined) setIsFollowing(!!followData);
    } catch (err) {
      console.error("Error fetching profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData(true);
  }, [profileId]); // Only initial fetch on profileId change

  useEffect(() => {
    if (page > 0) fetchProfileData();
  }, [page]); // Fetch more on pagination

  // Real-time listener for profile updates
  useEffect(() => {
    const channel = supabase
      .channel(`profile-updates-${profileId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vents',
        filter: `user_id=eq.${profileId}`
      }, () => {
        fetchProfileData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profileId]);

  // Infinite scroll trigger
  useEffect(() => {
    const handleScroll = (e: any) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        setPage(prev => prev + 1);
      }
    };

    const container = document.getElementById('profile-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

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

  const fetchReplies = async (ventId: string) => {
    if (loadingReplies[ventId]) return;
    setLoadingReplies(prev => ({ ...prev, [ventId]: true }));
    
    const { data, error } = await supabase
      .from('replies')
      .select('*, profiles(username, avatar_url), reply_reactions(id, user_id, type)')
      .eq('vent_id', ventId)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setReplies(prev => ({ ...prev, [ventId]: data }));
    }
    setLoadingReplies(prev => ({ ...prev, [ventId]: false }));
  };

  const toggleExpand = (ventId: string) => {
    if (expandedVentId === ventId) {
      setExpandedVentId(null);
    } else {
      setExpandedVentId(ventId);
      if (!replies[ventId]) {
        fetchReplies(ventId);
      }
    }
  };

  return (
    <div id="profile-scroll-container" className="bg-neutral-900 rounded-[3rem] h-full w-full overflow-hidden overflow-y-auto relative border border-white/5 shadow-2xl scrollbar-hide">
      {/* Social Banner Area */}
      <div className="h-32 md:h-48 w-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-black relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => router.back()}
            className="p-3 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/10"
          >
            <HiOutlineArrowLeft size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12 relative z-10">
        {/* Profile Info Section */}
        <div className="relative -mt-16 mb-8 flex flex-col items-center md:items-start md:flex-row md:justify-between md:items-end gap-6">
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="w-32 h-32 rounded-[2.5rem] bg-neutral-950 p-1.5 border-4 border-neutral-900 shadow-2xl overflow-hidden shrink-0">
              <div className="w-full h-full rounded-[1.8rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-4xl font-black text-emerald-500">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            
            <div className="text-center md:text-left space-y-1">
              <h2 className="text-white text-3xl font-black italic uppercase tracking-tight">{profile.full_name || "Unknown Entity"}</h2>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 md:gap-x-4">
                <div className="flex items-center gap-x-2">
                  <p className="text-neutral-500 font-medium">@{profile.username}</p>
                  <span className="w-1 h-1 bg-neutral-700 rounded-full" />
                  <p className="text-emerald-500 font-bold uppercase text-[9px] tracking-widest">Active Link</p>
                </div>
                {profile.website && (
                  <a 
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-emerald-500 text-[10px] font-medium transition-colors flex items-center gap-x-1"
                  >
                    <HiSparkles size={10} className="text-emerald-500" />
                    {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-x-3 pb-2">
            {!isOwnProfile && (
              <>
                <button
                  disabled={followLoading}
                  onClick={toggleFollow}
                  className={twMerge(
                    "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95",
                    isFollowing 
                      ? "bg-neutral-800 text-neutral-400 border border-white/5 hover:bg-neutral-700 hover:text-white" 
                      : "bg-emerald-500 text-black shadow-emerald-500/20 hover:bg-emerald-400"
                  )}
                >
                  {isFollowing ? "Unfollow" : "Synchronize"}
                </button>
                <button
                  onClick={() => router.push(`/chat?user=${profileId}`)}
                  className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all active:scale-95"
                  aria-label="Direct Message"
                >
                  <HiOutlineChatBubbleBottomCenterText size={18} />
                </button>
              </>
            )}
            {isOwnProfile && (
              <button 
                onClick={() => router.push('/profile/settings')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Calibrate Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-x-8 py-6 border-y border-white/5 mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-x-2 shrink-0">
            <span className="text-white text-lg font-black italic">{vents.length}</span>
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Vents</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10 shrink-0" />
          <div className="flex items-center gap-x-2 shrink-0">
            <span className="text-white text-lg font-black italic">{groups.length}</span>
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Circles</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10 shrink-0" />
          <div className="flex items-center gap-x-2 shrink-0">
            <span className="text-white text-lg font-black italic">{sharedVents.length}</span>
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Echoes</span>
          </div>
          {isOwnProfile && (
            <>
              <div className="w-[1px] h-4 bg-white/10 shrink-0" />
              <button 
                onClick={() => router.push('/ledger')}
                className="flex items-center gap-x-2 shrink-0 hover:text-emerald-500 transition-colors group"
              >
                <RiLineChartFill className="text-emerald-500 group-hover:scale-110 transition-transform" size={18} />
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest group-hover:text-emerald-500">View Ledger</span>
              </button>
            </>
          )}
        </div>

        {/* Post Direct Vent - Only on own profile */}
        {isOwnProfile && (
          <div className="mb-12">
            {!showPostForm ? (
              <button 
                onClick={() => setShowPostForm(true)}
                className="w-full bg-neutral-800/20 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center gap-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <RiBubbleChartFill size={20} />
                  </div>
                  <span className="text-neutral-500 text-sm font-medium italic">Release a new signal to your timeline...</span>
                </div>
                <HiOutlinePlusCircle size={24} className="text-neutral-700 group-hover:text-emerald-500 transition-colors" />
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Post to Timeline</h3>
                  <button 
                    onClick={() => setShowPostForm(false)}
                    className="text-[9px] font-black text-neutral-600 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <VentForm />
              </motion.div>
            )}
          </div>
        )}

        {/* Tab System */}
        <div className="space-y-8">
          <div className="flex items-center gap-x-10 border-b border-white/5">
            <button
              onClick={() => setActiveTab('released')}
              className={twMerge(
                "relative py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                activeTab === 'released' ? "text-emerald-500" : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              Released
              {activeTab === 'released' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
            <button
              onClick={() => setActiveTab('synchronized')}
              className={twMerge(
                "relative py-4 text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                activeTab === 'synchronized' ? "text-emerald-500" : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              Synchronized
              {activeTab === 'synchronized' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
          </div>

          <div className="space-y-6 relative min-h-[400px]">
            {/* Timeline Vertical Line */}
            <div className="absolute left-[1.35rem] top-4 bottom-4 w-px bg-emerald-500/10 hidden md:block" />

            {/* Released Vents Tab */}
            <div className={twMerge(activeTab === 'released' ? "block" : "hidden", "space-y-6")}>
              {vents.length > 0 ? (
                vents.map((vent) => {
                  const reactions = vent.vent_reactions || [];
                  const reactionCounts = reactions.reduce((acc: any, r: any) => {
                    acc[r.type] = (acc[r.type] || 0) + 1;
                    return acc;
                  }, {});
                  const totalReactions = reactions.length;
                  const userReaction = reactions.find((r: any) => r.user_id === currentUser?.id);
                  const isExpanded = expandedVentId === vent.id;
                  const colors = getEmotionColor(vent.emotion);

                  return (
                    <motion.div
                      key={vent.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={twMerge(
                        "relative pl-0 md:pl-12 group transition-all",
                        isExpanded && "z-20"
                      )}
                    >
                      {/* Timeline Node */}
                      <div className={twMerge(
                          "absolute left-4 top-7 w-2 h-2 rounded-full bg-neutral-800 border-2 hidden md:block group-hover:scale-110 transition-all z-10",
                          colors.border
                      )} />

                      <div className={twMerge(
                        "bg-neutral-800/30 rounded-3xl p-6 border transition-all",
                        isExpanded ? "bg-black border-emerald-500/20 shadow-2xl" : "border-white/5 hover:border-emerald-500/20",
                        vent.emotion && !isExpanded && `border-l-4 ${colors.border}`
                      )}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-x-2">
                            <span className={twMerge(
                                "px-2.5 py-1 text-[7px] font-black uppercase tracking-widest rounded-lg border",
                                colors.bg, colors.text, colors.border
                            )}>
                              {vent.emotion || "Signal"}
                            </span>
                          </div>
                          <span className="text-[7px] text-neutral-600 font-bold uppercase tracking-widest">
                            {new Date(vent.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-white/90 text-sm font-medium italic leading-relaxed mb-4">"{vent.content}"</p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-x-3">
                            <div className="flex items-center gap-x-1">
                              {Object.entries(reactionCounts).slice(0, 3).map(([type, count]: any) => (
                                <span key={type} className="text-[10px]">
                                  {type === 'like' ? '👍' : type === 'love' ? '❤️' : type === 'haha' ? '😂' : type === 'wow' ? '😮' : type === 'sad' ? '😢' : '🔥'}
                                </span>
                              ))}
                              {totalReactions > 0 && (
                                <span className="text-[9px] font-black text-neutral-500 ml-1">{totalReactions}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-x-2">
                            <button
                              onClick={() => toggleExpand(vent.id)}
                              className={twMerge(
                                "flex items-center gap-x-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                isExpanded ? "bg-emerald-500/10 text-emerald-500" : "text-neutral-500 hover:text-white bg-white/5"
                              )}
                            >
                              <HiOutlineChatBubbleOvalLeftEllipsis size={14} />
                              <span>{isExpanded ? 'Hide' : 'Reply'}</span>
                            </button>
                            
                            <button
                              className={twMerge(
                                "flex items-center gap-x-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                userReaction ? "bg-emerald-500 text-black" : "text-neutral-500 hover:text-white bg-white/5"
                              )}
                            >
                              {userReaction ? '👍' : <RiHandHeartLine size={14} />}
                              <span>{userReaction ? 'Resonated' : 'Resonate'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Replies Section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-6 space-y-4 pl-4 border-l border-white/5">
                                {loadingReplies[vent.id] ? (
                                  <div className="animate-pulse flex space-x-2 py-2">
                                    <div className="h-1 w-1 bg-emerald-500/50 rounded-full" />
                                    <div className="h-1 w-1 bg-emerald-500/50 rounded-full delay-75" />
                                    <div className="h-1 w-1 bg-emerald-500/50 rounded-full delay-150" />
                                  </div>
                                ) : (replies[vent.id] || []).map((reply) => (
                                  <div key={reply.id} className="space-y-1">
                                    <div className="flex items-center gap-x-2">
                                      <span className="text-[9px] font-black text-emerald-500/70 uppercase">@{reply.profiles?.username || 'anonymous'}</span>
                                      <span className="text-[7px] text-neutral-700 font-mono">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-relaxed italic">"{reply.content}"</p>
                                  </div>
                                ))}
                                {!(replies[vent.id] || []).length && !loadingReplies[vent.id] && (
                                  <p className="text-[8px] text-neutral-700 uppercase tracking-widest italic py-2">No signals yet...</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-4 opacity-20">
                  <HiOutlineChatBubbleBottomCenterText size={40} className="mx-auto" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] italic">No signals detected</p>
                </div>
              )}
            </div>

            {/* Synchronized Vents Tab */}
            <div className={twMerge(activeTab === 'synchronized' ? "block" : "hidden", "space-y-6")}>
              {sharedVents.length > 0 ? (
                sharedVents.map((vent) => {
                  const reactions = vent.vent_reactions || [];
                  const reactionCounts = reactions.reduce((acc: any, r: any) => {
                    acc[r.type] = (acc[r.type] || 0) + 1;
                    return acc;
                  }, {});
                  const totalReactions = reactions.length;
                  const userReaction = reactions.find((r: any) => r.user_id === currentUser?.id);
                  const isExpanded = expandedVentId === vent.id;
                  const colors = getEmotionColor(vent.emotion);

                  return (
                    <motion.div
                      key={vent.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={twMerge(
                        "relative pl-0 md:pl-12 group transition-all",
                        isExpanded && "z-20"
                      )}
                    >
                      {/* Timeline Node */}
                      <div className={twMerge(
                          "absolute left-4 top-7 w-2 h-2 rounded-full bg-neutral-800 border-2 hidden md:block group-hover:scale-110 transition-all z-10",
                          colors.border
                      )} />

                      <div className={twMerge(
                        "bg-neutral-800/30 rounded-3xl p-6 border transition-all",
                        isExpanded ? "bg-black border-emerald-500/20 shadow-2xl" : "border-white/5 hover:border-emerald-500/20",
                        vent.emotion && !isExpanded && `border-l-4 ${colors.border}`
                      )}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-x-2">
                            <span className={twMerge(
                                "px-2.5 py-1 text-[7px] font-black uppercase tracking-widest rounded-lg border",
                                colors.bg, colors.text, colors.border
                            )}>
                              {vent.emotion || "Signal"}
                            </span>
                            <span className="text-[7px] text-neutral-600 font-bold uppercase tracking-widest italic flex items-center gap-x-1">
                              <RiShareForwardLine size={8} className="text-emerald-500" />
                              via @{vent.profiles?.username}
                            </span>
                          </div>
                          <span className="text-[7px] text-neutral-600 font-bold uppercase tracking-widest">
                            {new Date(vent.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-white/90 text-sm font-medium italic leading-relaxed mb-4">"{vent.content}"</p>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-x-3">
                            <div className="flex items-center gap-x-1">
                              {Object.entries(reactionCounts).slice(0, 3).map(([type, count]: any) => (
                                <span key={type} className="text-[10px]">
                                  {type === 'like' ? '👍' : type === 'love' ? '❤️' : type === 'haha' ? '😂' : type === 'wow' ? '😮' : type === 'sad' ? '😢' : '🔥'}
                                </span>
                              ))}
                              {totalReactions > 0 && (
                                <span className="text-[9px] font-black text-neutral-500 ml-1">{totalReactions}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-x-2">
                            <button
                              onClick={() => toggleExpand(vent.id)}
                              className={twMerge(
                                "flex items-center gap-x-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                isExpanded ? "bg-emerald-500/10 text-emerald-500" : "text-neutral-500 hover:text-white bg-white/5"
                              )}
                            >
                              <HiOutlineChatBubbleOvalLeftEllipsis size={14} />
                              <span>{isExpanded ? 'Hide' : 'Reply'}</span>
                            </button>
                            
                            <button
                              className={twMerge(
                                "flex items-center gap-x-2 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                userReaction ? "bg-emerald-500 text-black" : "text-neutral-500 hover:text-white bg-white/5"
                              )}
                            >
                              {userReaction ? '👍' : <RiHandHeartLine size={14} />}
                              <span>{userReaction ? 'Resonated' : 'Resonate'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Replies Section */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-6 space-y-4 pl-4 border-l border-white/5">
                                {loadingReplies[vent.id] ? (
                                  <div className="animate-pulse flex space-x-2 py-2">
                                    <div className="h-1 w-1 bg-emerald-500/50 rounded-full" />
                                    <div className="h-1 w-1 bg-emerald-500/50 rounded-full delay-75" />
                                    <div className="h-1 w-1 bg-emerald-500/50 rounded-full delay-150" />
                                  </div>
                                ) : (replies[vent.id] || []).map((reply) => (
                                  <div key={reply.id} className="space-y-1">
                                    <div className="flex items-center gap-x-2">
                                      <span className="text-[9px] font-black text-emerald-500/70 uppercase">@{reply.profiles?.username || 'anonymous'}</span>
                                      <span className="text-[7px] text-neutral-700 font-mono">{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-relaxed italic">"{reply.content}"</p>
                                  </div>
                                ))}
                                {!(replies[vent.id] || []).length && !loadingReplies[vent.id] && (
                                  <p className="text-[8px] text-neutral-700 uppercase tracking-widest italic py-2">No signals yet...</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-4 opacity-20">
                  <HiOutlineChatBubbleBottomCenterText size={40} className="mx-auto" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] italic">No synchronized signals</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Circles Section */}
        {groups.length > 0 && (
          <div className="mt-12 pt-12 border-t border-white/5 space-y-6">
            <h3 className="text-white text-sm font-black italic uppercase tracking-widest">Active Circles</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => router.push(`/groups/${group.id}`)}
                  className="px-4 py-3 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-x-3 group"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <HiUserGroup size={12} className="text-emerald-500" />
                  </div>
                  <span className="truncate">{group.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Neural Assistant */}
      {/* <BlackSheepAssistant vents={vents} /> */}
    </div>
  );
}
