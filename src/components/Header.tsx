"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { FaUserAlt } from 'react-icons/fa';
import { HiArrowRightOnRectangle, HiMagnifyingGlass } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

import { useUser } from "@/providers/UserProvider";
import { useSupabase } from "@/providers/SupabaseProvider";

import Button from "./Button";
import Notifications from "./Notifications";
import LoadingOverlay from "./LoadingOverlay";

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ children, className }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { supabase } = useSupabase();
  const { user, userDetails } = useUser();

  const handleLogout = async () => {
    const result = await Swal.fire({
        title: 'Neural Link Termination',
        text: 'Are you sure you want to go offline? This will sever your connection to the global grid.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981', // emerald-500
        cancelButtonColor: '#3f3f46',
        confirmButtonText: 'Sever Link',
        cancelButtonText: 'Stay Connected',
        background: '#171717',
        color: '#fff',
        customClass: {
          popup: 'rounded-[2.5rem] border border-white/10 shadow-3xl',
          title: 'text-2xl font-black italic uppercase tracking-tighter text-white',
          confirmButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] mx-2',
          cancelButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] mx-2'
        }
    });

    if (!result.isConfirmed) return;

    setIsLoggingOut(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        setIsLoggingOut(false);
      } else {
        toast.success('Neural link terminated safely.');
        // Hard reload to root is the most reliable way to clear all state and server components
        window.location.href = '/';
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Even if API fails, forcefully redirect to home
      window.location.href = '/';
    }
  }

  return (
    <>
      <LoadingOverlay isVisible={isLoggingOut} message="Disconnecting Neural Link..." />
      <div
        className={twMerge(
          `
          h-fit 
          bg-transparent
          px-5 py-3
          relative
          z-[900]
          flex flex-col
          justify-center
          `,
          className
        )}
      >
      <div className={twMerge(
        "w-full flex items-center justify-between gap-x-4 relative z-50",
        children && "mb-4"
      )}>
        <div className="flex items-center gap-x-4">
          {/* Mobile Brand - Always visible on mobile */}
          <div className="flex gap-x-2 items-center">
             <div className="text-lg font-black italic tracking-tighter text-white">
               BLACK <span className="text-emerald-500">SHEEP</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-x-2 sm:gap-x-4">
          {user ? (
            <div className="flex gap-x-3 sm:gap-x-5 items-center">
              {/* User Stats Display */}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-white text-[12px] font-black italic tracking-tighter uppercase leading-none truncate max-w-[120px]">
                  {userDetails?.full_name || userDetails?.username || "Neural Entity"}
                </span>
                <div className="flex items-center gap-x-2 mt-0.5">
                  <span className="text-emerald-500 text-[8px] font-bold uppercase tracking-widest">
                    @{userDetails?.username || "unknown"}
                  </span>
                  <div className="w-0.5 h-0.5 bg-white/20 rounded-full" />
                  <span className="text-neutral-500 text-[8px] text-nowrap font-black uppercase tracking-[0.2em]">
                    {userDetails?.followers_count || 0} LINKS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-x-2 bg-neutral-900/60 backdrop-blur-xl p-1 rounded-2xl border border-white/5">
                <Link
                  href="/search"
                  className="p-2 sm:p-2.5 rounded-xl text-neutral-400 hover:text-emerald-500 hover:bg-white/5 transition-all duration-300 group"
                  aria-label="Search"
                >
                  <HiMagnifyingGlass size={18} className="group-hover:scale-110 transition-transform" />
                </Link>
                <Notifications />
                <Link
                  href="/profile"
                  className="bg-emerald-500 p-2 sm:p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all duration-300 group"
                  aria-label="Open profile"
                >
                  <FaUserAlt size={14} className="sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
                </Link>
              </div>

              <button 
                onClick={handleLogout}
                title="Terminate Neural Link (Logout)"
                className="bg-white/5 backdrop-blur-md border border-white/5 text-neutral-400 p-2.5 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all shadow-xl active:scale-90"
              >
                <HiArrowRightOnRectangle size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-x-3 sm:gap-x-5">
              <Link 
                href="/"
                className="
                  text-emerald-500 
                  font-black 
                  uppercase 
                  tracking-[0.2em] 
                  text-[9px] sm:text-[10px]
                  hover:text-emerald-400
                  transition-all
                  flex
                  items-center
                  gap-x-1.5
                  group
                  whitespace-nowrap
                "
              >
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full group-hover:animate-ping" />
                Home
              </Link>
              <div className="h-4 w-[1px] bg-white/10 mx-0.5 sm:mx-1" />
              <Link 
                href="/signup"
                className="
                  text-neutral-400 
                  font-bold
                  uppercase 
                  tracking-widest 
                  text-[9px] sm:text-[10px]
                  hover:text-white
                  transition
                  whitespace-nowrap
                  hidden xs:block
                "
              >
                Sign up
              </Link>
              <Button
                onClick={() => router.push('/login')}
                className="bg-white text-black px-3 sm:px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-black italic uppercase tracking-tighter hover:scale-105 transition-all shadow-xl whitespace-nowrap"
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
    </>
  );
};

export default Header;
