"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { RiGlobalLine, RiUserHeartLine, RiShieldFlashLine } from "react-icons/ri";
import { twMerge } from "tailwind-merge";
import { useUser } from "@/providers/UserProvider";

const Map = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-900 animate-pulse rounded-[3rem] flex items-center justify-center">
      <p className="text-neutral-500 font-black uppercase tracking-[0.5em] italic">Initializing Grid...</p>
    </div>
  )
});

const MapPage = () => {
  const { user } = useUser();
  const [view, setView] = useState<"public" | "private">("private");

  // Force public view only for unauthenticated users
  useEffect(() => {
    if (!user) {
      setView("public");
    } else {
      setView("private");
    }
  }, [user]);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col relative rounded-[2rem] border border-white/5">
      {/* View Switcher Overlay (Floating) - Vertically Aligned on Left */}
      {user && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-[1000] flex flex-col items-center gap-y-2 bg-black/60 backdrop-blur-3xl p-1.5 rounded-2xl border border-white/10 shadow-3xl pointer-events-auto">
          <button
            onClick={() => setView("private")}
            title="Private Neural Link"
            className={twMerge(
              "flex flex-col items-center justify-center gap-y-2 w-14 h-14 md:w-16 md:h-16 rounded-xl transition-all",
              view === "private" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30" : "text-neutral-500 hover:text-white hover:bg-white/5"
            )}
          >
            <RiUserHeartLine size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest">Private</span>
          </button>
          <div className="w-8 h-[1px] bg-white/5" />
          <button
            onClick={() => setView("public")}
            title="Observe Public Grid"
            className={twMerge(
              "flex flex-col items-center justify-center gap-y-2 w-14 h-14 md:w-16 md:h-16 rounded-xl transition-all",
              view === "public" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30" : "text-neutral-500 hover:text-white hover:bg-white/5"
            )}
          >
            <RiGlobalLine size={20} />
            <span className="text-[7px] font-black uppercase tracking-widest text-center leading-tight">Public</span>
          </button>
        </div>
      )}

      {/* Full-Screen Map Container */}
      <div className="flex-1 relative w-full h-full">
        <Map view={view} />
        
        {!user && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-xs md:max-w-sm px-4">
            <div className="bg-black/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-3xl text-center space-y-5">
              <p className="text-neutral-400 text-[11px] font-bold italic uppercase tracking-widest leading-relaxed">
                "Log in to establish a private neural link and resonance back to these signals."
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-emerald-500 text-black py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Login to Interact
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
