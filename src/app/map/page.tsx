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
    <div className="bg-neutral-900 rounded-[2rem] h-full w-full overflow-hidden flex flex-col border border-white/5 relative shadow-2xl">
      <Header className="bg-gradient-to-b from-neutral-800 to-black p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-x-4">
              <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
                {view === "public" ? "Public" : "Private"} <span className="text-emerald-500 underline decoration-emerald-500/10">Grid</span>
              </h1>
              <div className="hidden sm:flex flex-col items-center px-4 py-1.5 bg-neutral-950/40 border border-white/5 rounded-2xl shadow-xl">
                <span className="text-emerald-500 text-[10px] font-black italic uppercase tracking-widest">{user ? 'Established' : 'Public'}</span>
                <span className="text-[7px] font-black text-neutral-600 uppercase tracking-[0.2em]">Neural Link</span>
              </div>
            </div>
            <p className="text-neutral-400 mt-2 font-medium">Real identities and deep resonance signals.</p>
          </div>

          {/* View Switcher - Only show if user is logged in, but default to Private */}
          {user ? (
            <div className="flex items-center gap-x-2 bg-neutral-950/40 p-1.5 rounded-2xl border border-white/5 w-fit">
              <button
                onClick={() => setView("private")}
                className={twMerge(
                  "flex items-center gap-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  view === "private" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-neutral-500 hover:text-white"
                )}
              >
                <RiUserHeartLine size={14} />
                Private
              </button>
              <button
                onClick={() => setView("public")}
                className={twMerge(
                  "flex items-center gap-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  view === "public" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-neutral-500 hover:text-white"
                )}
              >
                <RiGlobalLine size={14} />
                Observe Public
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-x-2 bg-neutral-950/40 px-4 py-2 rounded-2xl border border-white/5 w-fit">
              <RiShieldFlashLine size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Guest Access</span>
            </div>
          )}
        </div>
      </Header>
      
      <div className="flex-1 p-4 lg:p-6 relative">
        <Map view={view} />
        {!user && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xs md:max-w-sm px-4">
            <div className="bg-black/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-3xl text-center space-y-4">
              <p className="text-neutral-400 text-xs font-medium italic">"Log in to establish a private neural link and resonance back to these signals."</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-emerald-500 text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
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
