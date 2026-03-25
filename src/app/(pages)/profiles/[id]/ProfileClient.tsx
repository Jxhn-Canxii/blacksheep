"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { useUser } from "@/contexts/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowLeft, HiSparkles, HiUserGroup, HiOutlineChatBubbleBottomCenterText, HiOutlineChatBubbleOvalLeftEllipsis, HiOutlinePlusCircle } from "react-icons/hi2";
import { RiHandHeartLine, RiShareForwardLine, RiBubbleChartFill, RiLineChartFill } from "react-icons/ri";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import VentForm from "@/components/feed/VentForm";
import BlackSheepAssistant from "@/components/chat/BlackSheepAssistant";
import { toast } from "react-hot-toast";
import { twMerge } from "tailwind-merge";
import { getEmotionColor } from "@/libs/emotionConfig";
import { apiGet, apiPost } from "@/utils/logger";

interface ProfileData {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
}

interface ProfileApiResponse {
  profile: ProfileData;
  vents: any[];
  sharedVents: any[];
  groups: any[];
  isFollowing: boolean;
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
      const data = await apiGet<ProfileApiResponse>('/api/profiles/' + profileId, {
        params: { page, limit: ITEMS_PER_PAGE, current_user_id: currentUser?.id ?? '' },
      });
      setProfile(data.profile);
      setVents(data.vents);
      setSharedVents(data.sharedVents);
      setGroups(data.groups);
      setIsFollowing(data.isFollowing);
    } catch (err) {
      console.error("Error fetching profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => {
    if (page > 0) fetchProfileData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Real-time listener for profile updates (realtime channel — stays in component per architecture rules)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, profileId]);

  // Infinite scroll trigger
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
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
    try {
      const result = await apiPost<{ action: 'followed' | 'unfollowed' }>('/api/follows', {
        follower_id: currentUser.id,
        following_id: profileId,
      });
      if (result.action === 'unfollowed') {
        setIsFollowing(false);
        toast.success("Unfollowed frequency.");
      } else {
        setIsFollowing(true);
        toast.success("Synchronized with frequency!");
      }
    } catch {
      toast.error("Failed to update follow status.");
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchReplies = async (ventId: string) => {
    if (loadingReplies[ventId]) return;
    setLoadingReplies(prev => ({ ...prev, [ventId]: true }));
    try {
      const data = await apiGet<any[]>('/api/replies?vent_id=' + ventId);
      setReplies(prev => ({ ...prev, [ventId]: data }));
    } catch (err) {
      console.error("Error fetching replies:", err);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [ventId]: false }));
    }
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
