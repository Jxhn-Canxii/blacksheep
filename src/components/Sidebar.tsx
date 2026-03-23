"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { HiHome, HiChatBubbleLeftRight, HiUsers, HiHashtag, HiOutlineUser, HiOutlineBookOpen, HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { BiSearchAlt } from "react-icons/bi";
import { MdGroups2 } from "react-icons/md";
import { RiLineChartFill, RiBroadcastLine, RiGlobalLine } from "react-icons/ri";
import { twMerge } from "tailwind-merge";

import SidebarItem from "./SidebarItem";
import Box from "./Box";
import TrendingFeelings from "./TrendingFeelings";
import RecommendedSignals from "./RecommendedSignals";
import { useUser } from "@/providers/UserProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUnreadCount } from "@/hooks/useUnreadCount";

interface SidebarProps {
  children: React.ReactNode;
  initialRecentGroups?: any[];
  initialTrendingData?: any[];
}

/**
 * Premium Sidebar Component
 * 
 * Elegant desktop sidebar for the Black Sheep community.
 * Features:
 * - Unified navigation with clear hierarchy
 * - Dynamic trending feelings section
 * - Premium forum styling
 */
const Sidebar: React.FC<SidebarProps> = ({ 
  children,
  initialRecentGroups = [],
  initialTrendingData = []
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const unreadCount = useUnreadCount();
  const [recentGroups, setRecentGroups] = useState<any[]>(initialRecentGroups);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecentGroups([]);
      return;
    }

    // Only fetch if initialRecentGroups is empty and we haven't loaded yet
    const fetchRecentGroups = async () => {
      if (initialRecentGroups.length > 0) return;
      
      setLoadingGroups(true);
      const { data, error } = await supabase
        .from('group_members')
        .select('groups (id, name)')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .limit(5);
      
      if (error) {
        console.error("Error fetching recent circles:", error);
        setRecentGroups([]);
      } else if (data) {
        setRecentGroups(data.map((item: any) => item.groups).filter(Boolean));
      }
      setLoadingGroups(false);
    };

    fetchRecentGroups();
  }, [user, supabase, initialRecentGroups]);

  const routes = useMemo(() => [
    {
      icon: HiHome,
      label: 'Feed',
      active: pathname === '/',
      href: '/',
    },
    {
      icon: HiUsers,
      label: 'Profiles',
      active: pathname === '/profiles',
      href: '/profiles',
    },
    {
      icon: RiGlobalLine,
      label: 'Vent Maps',
      active: pathname === '/map',
      href: '/map',
    },
    {
      icon: RiBroadcastLine,
      label: 'Chat',
      active: pathname === '/chat',
      href: '/chat',
    },
    {
      icon: HiChatBubbleLeftRight,
      label: 'Signals',
      active: pathname === '/chat/dm',
      href: '/chat/dm',
      count: unreadCount,
    },
    {
      icon: MdGroups2,
      label: 'Circles',
      active: pathname === '/groups',
      href: '/groups',
    },
    {
      icon: RiLineChartFill,
      label: 'Ledger',
      active: pathname === '/ledger',
      href: '/ledger',
    },
    {
      icon: HiOutlineUser,
      label: 'Profile',
      active: pathname === '/profile',
      href: '/profile',
    }
  ], [pathname, unreadCount]);

  return (
    <div className="flex h-screen md:h-dvh bg-black overflow-hidden p-4 md:p-5 gap-x-5">
      <div 
        className="
          hidden 
          md:flex 
          flex-col 
          gap-y-5 
          h-full 
          w-[240px] 
          shrink-0
        "
      >
        <Box className="bg-neutral-900/60 backdrop-blur-3xl border border-white/5 shadow-3xl p-3 overflow-hidden">
            {/* Branding */}
            <div className="px-3 py-2 border-b border-white/5 mb-2 group cursor-pointer">
                <h1 className="text-xl font-black italic tracking-tighter text-white">
                    BLACK <span className="text-emerald-500 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all">SHEEP</span>
                </h1>
                <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-neutral-700 mt-1">Stress Collective</p>
            </div>
            
            <div className="flex flex-col gap-y-1">
                {routes.map((item) => (
                    <SidebarItem key={item.label} {...item} />
                ))}
            </div>
        </Box>

        <Box className="flex-1 bg-neutral-900/40 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-y-auto glass-scroll">
            <div className="p-3 space-y-6">
                <TrendingFeelings initialData={initialTrendingData} />
                
                <RecommendedSignals />
                
                <div className="space-y-3">
                    <div className="flex items-center gap-x-2 text-neutral-600 font-black uppercase tracking-widest text-[9px] mb-1 px-1">
                        <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full" />
                        <span>Recent Circles</span>
                    </div>
                    <div className="flex flex-col gap-y-1.5 px-1">
                        {loadingGroups ? (
                            <div className="animate-pulse space-y-2 px-1">
                                <div className="h-2 w-2/3 bg-white/5 rounded-full" />
                                <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                            </div>
                        ) : recentGroups.length > 0 ? (
                            recentGroups.map((group) => (
                                <Link
                                    key={group.id}
                                    href={`/groups/${group.id}`}
                                    className="flex items-center gap-x-2 text-[10px] font-bold text-neutral-400 hover:text-emerald-500 transition-colors uppercase tracking-tight text-left"
                                >
                                    <HiHashtag size={10} className="text-neutral-600" />
                                    <span className="truncate">{group.name}</span>
                                </Link>
                            ))
                        ) : (
                            <p className="text-[9px] text-neutral-700 font-medium italic leading-relaxed">
                                Join a circle to see your active threads here.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Box>
      </div>

      <main className="h-full flex-1 overflow-y-auto glass-scroll bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-[1.5rem] shadow-inner p-0.5">
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
