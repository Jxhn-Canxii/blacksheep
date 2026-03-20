"use client";

import Link from "next/link";
import { IconType } from "react-icons";
import { twMerge } from "tailwind-merge";

interface SidebarItemProps {
  icon: IconType;
  label: string;
  active?: boolean;
  href: string;
  count?: number;
}

/**
 * Premium SidebarItem Component
 * 
 * Individual navigation link for the desktop sidebar.
 * Features:
 * - Subtle hover scaling
 * - Emerald glassmorphic active indicator
 * - Elegant typography and spacing
 */
const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  active,
  href,
  count
}) => {
  return (
    <Link 
      href={href}
      className={twMerge(
        `
        flex 
        flex-row 
        h-auto 
        items-center 
        w-full 
        gap-x-4 
        text-md 
        font-medium 
        cursor-pointer 
        hover:text-emerald-400 
        transition-all 
        duration-500 
        py-1.5 
        px-3 
        rounded-[1.2rem] 
        relative 
        group 
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-emerald-500/50
        focus-visible:ring-offset-2
        focus-visible:ring-offset-neutral-950
        `,
        active ? "text-white bg-white/5 border border-white/5 shadow-2xl" : "text-neutral-500"
      )}
    >
      <div className={twMerge(
        "p-1.5 rounded-lg transition-all duration-500 relative",
        active && "bg-emerald-500/10 text-emerald-500 rotate-12"
      )}>
        <Icon size={20} className="group-hover:scale-110 transition-transform duration-500" />
        {count !== undefined && count > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-emerald-500 text-black text-[8px] font-black rounded-full flex items-center justify-center px-1 shadow-lg ring-2 ring-neutral-950 animate-pulse">
            {count > 99 ? '99+' : count}
          </div>
        )}
      </div>
      <p className="truncate w-full font-black italic uppercase tracking-tighter text-[11px]">
        {label}
      </p>
      
      {active && (
        <div className="absolute left-0 w-1.5 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_15px_rgba(16,185,129,1)]" />
      )}
    </Link>
  );
}

export default SidebarItem;
