"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { FaUserAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

import useAuthModal from "@/hooks/useAuthModal";
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
  const authModal = useAuthModal();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { supabase } = useSupabase();
  const { user } = useUser();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(error.message);
      setIsLoggingOut(false);
    } else {
      toast.success('Signed out safely.')
      router.push('/');
      router.refresh();
      // Ensure the server re-evaluates the layout and page
      window.location.reload();
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
          z-[100]
          flex flex-col
          justify-center
          `,
          className
        )}
      >
      <div className={twMerge(
        "w-full flex items-center justify-between gap-x-4",
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
            <div className="flex gap-x-2 sm:gap-x-3 items-center">
              <Notifications />
              <Button 
                onClick={handleLogout}
                className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-3 sm:px-4 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold hover:bg-white/20 transition-all shadow-xl"
              >
                Logout
              </Button>
              <button
                onClick={() => router.push('/profile')}
                className="bg-emerald-500 p-2 sm:p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-90 transition-all duration-300"
                aria-label="Open profile"
              >
                <FaUserAlt size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-x-3 sm:gap-x-5">
              <button 
                onClick={() => router.push('/map')}
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
                Vent Map
              </button>
              <div className="h-4 w-[1px] bg-white/10 mx-0.5 sm:mx-1" />
              <button 
                onClick={authModal.onOpen}
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
              </button>
              <Button
                onClick={authModal.onOpen}
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
