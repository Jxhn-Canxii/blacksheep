"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMagnifyingGlass, HiSparkles, HiUserGroup, HiOutlineArrowLeft } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { toast } from "react-hot-toast";

interface ProfileData {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function ProfilesPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [recommended, setRecommended] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  // Fetch recommended profiles (randomly or by most active)
  useEffect(() => {
    const fetchRecommended = async () => {
      setLoadingRecommended(true);
      // For now, let's just get 5 profiles that aren't the current user
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .limit(5);

      if (currentUser?.id) {
        query = query.neq("id", currentUser.id);
      }

      const { data, error } = await query;
      
      if (!error && data) {
        setRecommended(data);
      }
      setLoadingRecommended(false);
    };

    fetchRecommended();
  }, [supabase, currentUser?.id]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setProfiles([]);
      return;
    }

    const fetchProfiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(20);

      if (!error && data) {
        setProfiles(data);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchProfiles, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  return (
    <div className="bg-neutral-900 rounded-[3rem] h-full w-full overflow-hidden overflow-y-auto relative border border-white/5 shadow-2xl scrollbar-hide">
      <Header className="bg-gradient-to-b from-neutral-800 to-black p-8">
        <div className="flex items-center gap-x-6">
          <button
            onClick={() => router.back()}
            className="p-4 bg-white/5 rounded-2xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/5"
          >
            <HiOutlineArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
              Signal <span className="text-emerald-500">Search</span>
            </h1>
            <p className="text-neutral-500 mt-2 font-medium">Find other stress-blowers in the neural network.</p>
          </div>
        </div>
      </Header>

      <div className="p-8 space-y-12">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-emerald-500 transition-colors">
            <HiOutlineMagnifyingGlass size={24} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by @username or name..."
            className="w-full bg-neutral-800/40 text-white pl-16 pr-8 py-6 rounded-[2.5rem] border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus:border-emerald-500/30 transition-all text-lg font-medium shadow-inner placeholder:text-neutral-600"
          />
        </div>

        {/* Results / Recommended */}
        <div className="space-y-12">
          {searchQuery.trim() ? (
            <div className="space-y-8">
              <div className="flex items-center gap-x-4">
                <h3 className="text-white text-xl font-black italic uppercase tracking-tight">Search <span className="text-emerald-500">Signals</span></h3>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {profiles.length > 0 ? (
                    profiles.map((profile) => (
                      <ProfileCard key={profile.id} profile={profile} onClick={() => router.push(`/profiles/${profile.id}`)} />
                    ))
                  ) : !loading ? (
                    <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.2em] italic col-span-full py-10 text-center">No signals detected on this frequency...</p>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-x-4">
                <h3 className="text-white text-xl font-black italic uppercase tracking-tight">Recommended <span className="text-emerald-500">Signals</span></h3>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingRecommended ? (
                  <div className="col-span-full py-10 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 opacity-50 shadow-2xl"></div>
                  </div>
                ) : (
                  recommended.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} onClick={() => router.push(`/profiles/${profile.id}`)} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ profile, onClick }: { profile: ProfileData; onClick: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className="bg-neutral-800/40 rounded-[2.5rem] p-8 border border-white/5 hover:border-emerald-500/30 transition-all group flex items-center gap-x-6 text-left relative overflow-hidden"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl font-black text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          profile.username.charAt(0).toUpperCase()
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="text-white font-black italic uppercase tracking-tight text-lg group-hover:text-emerald-500 transition-colors line-clamp-1">{profile.full_name || "Unknown Signal"}</span>
        <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">@{profile.username}</span>
      </div>

      <HiSparkles className="absolute top-4 right-4 text-emerald-500/10 group-hover:text-emerald-500/40 transition-colors" size={24} />
    </motion.button>
  );
}
