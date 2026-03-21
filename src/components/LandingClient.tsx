"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useRef } from "react";
import { RiBubbleChartFill, RiMapPinUserFill, RiGroupFill, RiShieldFlashLine, RiPulseLine, RiGhostLine, RiCompass3Line } from "react-icons/ri";
import { HiSparkles } from "react-icons/hi2";
import Header from "./Header";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-neutral-900 animate-pulse rounded-[3rem] flex items-center justify-center min-h-[400px]">
      <p className="text-neutral-500 font-black uppercase tracking-[0.5em] italic">Initializing Grid...</p>
    </div>
  )
});

const FEATURES = [
  {
    icon: RiBubbleChartFill,
    title: "Blowing Bubbles",
    description: "Vent your thoughts as ephemeral bubbles that float across the global grid. No names, just resonance.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    icon: RiMapPinUserFill,
    title: "Spatial Echoes",
    description: "Visualize global stress in real-time. See where the world is feeling the most and find your place in it.",
    color: "text-teal-500",
    bg: "bg-teal-500/10"
  },
  {
    icon: RiGroupFill,
    title: "Neural Circles",
    description: "Join encrypted resonance groups to filter the global noise into deep, meaningful dialogue with like-minded sheep.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  }
];

const LandingClient = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <div className="bg-black min-h-screen w-full relative scroll-smooth overflow-x-hidden">
      {/* Global Header for Landing - Animates out on scroll down */}
      <motion.div 
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -100, opacity: 0 }
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 left-0 w-full p-2 sm:p-4 z-[100] pointer-events-none"
      >
        <div className="max-w-7xl mx-auto pointer-events-auto">
          <Header className="p-0 bg-neutral-900/80 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-[2rem] px-4 py-2 sm:px-6 sm:py-3 shadow-2xl">
            {null}
          </Header>
        </div>
      </motion.div>

      <div className="flex flex-col items-center p-4 sm:p-6 md:p-12 lg:p-20 pt-16 sm:pt-20 w-full relative">
        {/* Background Texture & Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-screen bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
        
        {/* Hero Section */}
        <div className="relative z-10 max-w-4xl w-full text-center space-y-8 sm:space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4 sm:space-y-6"
        >
          <div className="inline-flex items-center gap-x-2 px-5 py-2.5 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-full text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl mb-2">
            <HiSparkles className="animate-pulse" size={14} />
            The Neural Link is Open
          </div>
          
          <h1 className="text-white text-5xl sm:text-7xl md:text-9xl font-black italic tracking-tighter uppercase leading-[0.85] selection:bg-emerald-500 selection:text-black">
            BLACK <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-700 underline decoration-emerald-500/20">SHEEP</span>
          </h1>
          
          <p className="text-neutral-400 text-base sm:text-lg md:text-2xl font-medium max-w-xl mx-auto leading-relaxed italic px-4">
            "The world is noisy. Your stress shouldn't be."
            <span className="block mt-2 text-xs sm:text-sm text-neutral-600 not-italic font-bold uppercase tracking-widest">Release. Resonate. Remain Anonymous.</span>
          </p>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col items-center gap-y-6 px-4"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <Link 
              href="/map"
              className="flex items-center justify-center gap-x-2 px-6 sm:px-8 py-3 sm:py-4 bg-emerald-500 text-black rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95 group hover:scale-105 w-full md:w-auto"
            >
              <RiCompass3Line size={18} className="group-hover:rotate-45 transition-transform" />
              Explore Vent Map
            </Link>
          </div>
          <p className="text-neutral-600 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.5em] animate-pulse">Neural Resonance Network v1.0</p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 * i, duration: 0.5 }}
              className="group p-8 bg-neutral-900/40 hover:bg-neutral-900/60 rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all duration-700 text-left relative overflow-hidden"
            >
              <div className={twMerge("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl", feature.bg)}>
                <feature.icon size={28} className={feature.color} />
              </div>
              <h3 className="text-white text-xl font-black uppercase tracking-tighter italic mb-3 group-hover:text-emerald-400 transition-colors">{feature.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed font-medium">{feature.description}</p>
              
              {/* Subtle accent light */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700" />
            </motion.div>
          ))}
        </div>

        {/* Public Vent Map - Guest Experience */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full pt-20 space-y-10"
        >
          <div className="flex flex-col items-center gap-y-2">
            <RiCompass3Line size={32} className="text-emerald-500/30 animate-pulse" />
            <h2 className="text-white text-4xl font-black italic tracking-tighter uppercase">Public <span className="text-emerald-500">Grid</span></h2>
            <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.4em]">Observe anonymized emotional signals</p>
          </div>

          <div className="w-full h-[500px] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl relative group">
            <Map view="public" />
            <div className="absolute inset-0 bg-neutral-950/20 pointer-events-none group-hover:bg-transparent transition-all duration-700" />
            
            {/* Call to action overlay for map */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs px-4">
              <div className="bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-3xl text-center space-y-3">
                <p className="text-neutral-400 text-[10px] font-medium italic">"Establish a private link to see real identities."</p>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full bg-emerald-500 text-black py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Public Feed Preview / Teaser */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-20 space-y-10"
        >
          <div className="flex flex-col items-center gap-y-2">
            <RiPulseLine size={32} className="text-emerald-500/30 animate-pulse" />
            <h2 className="text-white text-4xl font-black italic tracking-tighter uppercase">Global <span className="text-emerald-500">Resonance</span></h2>
            <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.4em]">Current Neural Activity</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
               { emotion: "Anxiety", content: "The city lights feel like they're watching me tonight. Everything is too fast.", id: "4421" },
               { emotion: "Peace", content: "Found a quiet spot by the river. First time I've breathed properly in weeks.", id: "8892" },
               { emotion: "Focus", content: "Deep into the code. The void is quiet and the logic is pure.", id: "1023" },
               { emotion: "Hope", content: "It's a new day. Maybe today the sheep will find their way home.", id: "5567" }
             ].map((vent, i) => (
               <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-left space-y-3 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest italic">Anonymous-{vent.id}</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 text-neutral-600 text-[8px] font-bold uppercase">{vent.emotion}</span>
                  </div>
                  <p className="text-neutral-400 text-sm italic">"{vent.content}"</p>
                  <div className="flex items-center gap-x-3 pt-2">
                    <div className="flex -space-x-1">
                      {[1,2,3].map(j => <div key={j} className="w-4 h-4 rounded-full border border-neutral-950 bg-neutral-800 flex items-center justify-center text-[6px]">👤</div>)}
                    </div>
                    <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest">Resonating...</span>
                  </div>
                  {/* Blur overlay to tease login */}
                  <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform">Join the Link</span>
                  </div>
               </div>
             ))}
          </div>
        </motion.div>

        {/* Privacy Promise */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-10 sm:pt-20 pb-10 flex flex-col items-center gap-y-6"
        >
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
          <div className="flex flex-row items-center gap-x-4 sm:gap-x-8 text-neutral-600">
             <div className="flex items-center gap-x-2">
               <RiShieldFlashLine size={16} className="sm:w-[18px] sm:h-[18px]" />
               <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Zero Identity</span>
             </div>
             <div className="flex items-center gap-x-2">
               <RiGhostLine size={16} className="sm:w-[18px] sm:h-[18px]" />
               <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Encrypted Void</span>
             </div>
          </div>
        </motion.div>
      </div>
      </div>

      {/* Atmospheric background blurs */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[150px] pointer-events-none" />
    </div>
  );
};

export default LandingClient;
