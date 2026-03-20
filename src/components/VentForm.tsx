"use client";

import { useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { RiBubbleChartFill } from "react-icons/ri";
import { twMerge } from "tailwind-merge";

import TrendingFeelings from "./TrendingFeelings";

const FEELINGS = [
  "Anxious",
  "Angry",
  "Overwhelmed",
  "Sad",
  "Numb",
  "Restless",
  "Lonely",
  "Exhausted",
  "Stressed",
  "Frustrated",
  "Guilty",
  "Hopeless",
  "Uncertain",
  "Burnt Out",
  "Tense",
  "Disconnected",
  "Worried",
  "Tired",
  "Melancholy",
  "Apathetic",
  "Insecure",
  "Betrayed",
  "Grieving",
  "Pressure",
  "Isolated",
  "Misunderstood",
  "Suffocated",
  "Lost",
  "Fragile",
  "Invisible"
];

/**
 * VentForm Component
 * 
 * Provides a premium interface for users to "release" their stress as bubbles.
 * Captures user content, optional emotion, and geolocation if permitted.
 */
const VentForm = () => {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [content, setContent] = useState("");
  const [emotion, setEmotion] = useState("");
  const [loading, setLoading] = useState(false);

  // Handles the submission of the vent form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to post a vent.");
      return;
    }

    if (!content.trim()) {
      toast.error("Say something!");
      return;
    }

    if (!emotion) {
      toast.error("Pick a feeling for your bubble.");
      return;
    }

    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location = { latitude, longitude };

          const { error } = await (supabase as any)
            .from("vents")
            .insert([{ content, emotion, user_id: user.id, location }]);

          if (error) {
            toast.error(error.message);
          } else {
            toast.success("Vent released!");
            setContent("");
            setEmotion("");
          }
          setLoading(false);
        },
        async (error) => {
          console.error("Geolocation error:", error);
          const { error: postError } = await (supabase as any)
            .from("vents")
            .insert([{ content, emotion, user_id: user.id }]);

          if (postError) {
            toast.error(postError.message);
          } else {
            toast.success("Vent released (without location)!");
            setContent("");
            setEmotion("");
          }
          setLoading(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-[1px] rounded-[1.2rem] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10">
      <div className="bg-neutral-900/90 backdrop-blur-xl p-4 md:p-5 rounded-[1.2rem] shadow-xl overflow-hidden relative">
        <motion.div
           animate={{
             scale: [1, 1.1, 1],
             opacity: [0.05, 0.1, 0.05],
           }}
           transition={{
             duration: 6,
             repeat: Infinity,
             ease: "easeInOut"
           }}
           className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full blur-[50px] pointer-events-none"
        />

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-y-3">
          <div className="flex items-center gap-x-2 text-emerald-400 font-black tracking-widest text-[9px] uppercase">
            <RiBubbleChartFill size={18} className="animate-pulse" />
            <h2>Blowing a Bubble</h2>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Release your thoughts... they float here safely."
            aria-label="Vent content"
            className="w-full bg-neutral-800/20 text-white p-3.5 rounded-xl border border-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/30 min-h-[80px] shadow-inner transition-all duration-500 text-sm leading-relaxed placeholder:text-neutral-700"
          />

          <div className="space-y-2">
            <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-600 ml-1">How does this feel?</p>
            <div className="flex flex-wrap gap-1">
              {FEELINGS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setEmotion(f)}
                  className={twMerge(
                    "px-2.5 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all duration-300 border border-white/5 focus-visible:outline-none",
                    emotion === f 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-emerald-400" 
                      : "bg-neutral-800/40 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end mt-1">
            <button
              disabled={loading}
              type="submit"
              aria-label="Release bubble"
              className="
                bg-gradient-to-r from-emerald-500 to-teal-500 
                hover:from-emerald-400 hover:to-teal-400
                text-white px-6 py-2 rounded-lg font-black uppercase tracking-widest text-[9px]
                transition-all duration-500 shadow-xl shadow-emerald-500/20
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-105 active:scale-95
                focus-visible:outline-none
              "
            >
              {loading ? "Releasing..." : "Release Bubble"}
            </button>
          </div>
        </form>

        {/* Mobile-only Trending Section */}
        <div className="block md:hidden mt-10 pt-6 border-t border-white/5">
             <TrendingFeelings />
        </div>
      </div>
    </div>
  );
};

export default VentForm;
