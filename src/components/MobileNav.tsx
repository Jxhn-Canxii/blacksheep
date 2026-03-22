"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { HiHome, HiChatBubbleLeftRight, HiUsers, HiOutlineUser } from "react-icons/hi2";
import { BiSearch } from "react-icons/bi";
import { MdGroup } from "react-icons/md";
import { RiBroadcastLine, RiLineChartFill } from "react-icons/ri";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { useUnreadCount } from "@/hooks/useUnreadCount";

/**
 * MobileNav Component
 * 
 * Android-style bottom navigation bar.
 * Docked at the bottom of the viewport on mobile devices.
 * Uses a premium blur effect and active indicators.
 */
const MobileNav = () => {
  const pathname = usePathname();
  const unreadCount = useUnreadCount();

  const routes = useMemo(() => [
    {
      icon: HiHome,
      label: 'Home',
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
      icon: RiBroadcastLine,
      label: 'Global',
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
      icon: RiLineChartFill,
      label: 'Ledger',
      active: pathname === '/profile/ledger',
      href: '/profile/ledger',
    },
    {
      icon: MdGroup,
      label: 'Groups',
      active: pathname === '/groups',
      href: '/groups',
    },
    {
      icon: HiOutlineUser,
      label: 'Profile',
      active: pathname === '/profile',
      href: '/profile',
    }
  ], [pathname, unreadCount]);

  return (
    <div 
      className="
        fixed 
        bottom-0 
        left-0 
        right-0 
        bg-neutral-900/80 
        backdrop-blur-3xl 
        border-t 
        border-white/10 
        md:hidden 
        flex 
        items-center 
        justify-around 
        shadow-[0_-5px_20px_rgba(0,0,0,0.5)] 
        z-[5000]
        pb-safe /* Handle safe areas on notched devices */
        h-[75px]
      "
    >
      {routes.map((item: any) => (
        <Link
          key={item.label}
          href={item.href}
          className={twMerge(
            "flex-1 flex flex-col items-center justify-center gap-y-1 transition-all duration-300 relative h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900",
            item.active ? "text-emerald-500" : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <div className={twMerge(
              "p-1.5 rounded-2xl transition-all duration-300 relative",
              item.active && "bg-emerald-500/10 scale-110"
          )}>
            <item.icon size={26} />
            {item.active && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            )}
            {item.count !== undefined && item.count > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-emerald-500 text-black text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg ring-2 ring-neutral-900 animate-pulse">
                {item.count > 99 ? '99+' : item.count}
              </div>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default MobileNav;
