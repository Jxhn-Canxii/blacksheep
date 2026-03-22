"use client";

import { useState } from "react";
import Header from "@/components/Header";
import VentFeed from "@/components/VentFeed";
import VentForm from "@/components/VentForm";
import BlackSheepAssistant from "@/components/BlackSheepAssistant";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { RiBubbleChartLine, RiMap2Line, RiBubbleChartFill } from "react-icons/ri";
import { HiOutlinePlusCircle } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

const Map = dynamic(() => import("./Map"), { 
    ssr: false,
    loading: () => (
        <div className="h-[600px] w-full bg-neutral-900 animate-pulse rounded-[3rem] flex items-center justify-center">
            <p className="text-neutral-500 font-black uppercase tracking-[0.5em] italic">Initializing Grid...</p>
        </div>
    )
});

const HomeClient = ({ initialVents }: { initialVents?: any[] }) => {
    const [showPostForm, setShowPostForm] = useState(false);

    return (
        <div className="bg-neutral-900 rounded-[2rem] h-full w-full overflow-y-auto relative border border-white/5 shadow-2xl glass-scroll overflow-x-hidden">
            <Header className="bg-gradient-to-b from-blue-900/40 via-emerald-900/60 to-black p-4 px-6 md:p-6 md:px-8 border-b border-white/5">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-y-6">
                    <div className="flex-1">
                        <h1 className="text-white text-3xl lg:text-4xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
                            Stress <span className="text-emerald-500 underline decoration-emerald-500/20">Bubbles</span>
                        </h1>
                        <p className="text-neutral-300 mt-1.5 font-medium max-w-sm text-sm">
                            Release your thoughts into the sky. They float as bubbles for the world to hear.
                        </p>
                    </div>
                </div>
            </Header>

            <div className="p-4 px-6 md:p-8 relative z-10">
                <div className="mb-12">
                    {!showPostForm ? (
                        <button 
                            onClick={() => setShowPostForm(true)}
                            className="w-full bg-neutral-800/20 border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-inner"
                        >
                            <div className="flex items-center gap-x-5">
                                <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-2xl">
                                    <RiBubbleChartFill size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-neutral-500 text-sm font-medium italic">What's vibrating in your grid?</p>
                                    <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.2em] mt-0.5">Release a new signal</p>
                                </div>
                            </div>
                            <HiOutlinePlusCircle size={28} className="text-neutral-700 group-hover:text-emerald-500 transition-colors" />
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Global Broadcast</h3>
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

                <div className="mt-8">
                    <div className="flex items-center gap-x-4 mb-4">
                        <h2 className="text-xl font-bold text-white tracking-tight uppercase italic">Recent <span className="text-emerald-500">Releases</span></h2>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
                    </div>
                    <VentFeed initialData={initialVents} />
                </div>
            </div>

            {/* Decorative background blurs */}
            <div className="fixed top-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-20 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Neural Assistant */}
            <BlackSheepAssistant vents={initialVents || []} />
        </div>
    );
};

export default HomeClient;
