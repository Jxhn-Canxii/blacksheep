"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import Header from "@/components/Header";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MdGroupAdd, MdExplore, MdSearch } from "react-icons/md";
import { HiArrowUpRight, HiHashtag, HiMagnifyingGlass } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

interface GroupMember {
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface Group {
  id: string;
  name: string;
  description: string;
  group_members: GroupMember[];
  _count?: {
    group_members: number;
  };
}

/**
 * Super-Premium Circles (Groups) Page
 * 
 * Features:
 * - Experimental Bento-Grid Group Cards
 * - Shimmering creation portal
 * - High-speed resonance indicators
 * - Guaranteed clickability via absolute-link layering
 */
const GroupsPage = () => {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      // Fetch groups with member count and latest 3 member profiles
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (
            user_id,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        // Map the data to include counts and limit members locally for the initial fetch
        const mappedGroups = (data as any[]).map(group => ({
          ...group,
          _count: {
            group_members: group.group_members?.length || 0
          },
          // We'll keep all fetched members but display only 3 in UI
        }));
        setGroups(mappedGroups);
      }
    };
    fetchGroups();
  }, [supabase]);

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Identity required to start a circle."); return; }
    if (!name.trim()) { toast.error("A name is required for resonance."); return; }
    setLoading(true);
    const { data, error } = await (supabase as any).from("groups").insert([{ name, description, created_by: user.id }]).select().single();
    if (!error && data) {
      // Ensure the creator is a member of the group (used by group-members UI).
      const { error: memberError } = await (supabase as any)
        .from("group_members")
        .upsert(
          [{ group_id: data.id, user_id: user.id, status: 'approved', role: 'admin' }],
          { onConflict: "group_id,user_id" }
        );
      if (memberError) {
        // Membership failing shouldn't block group creation, but it's important for UI.
        console.error("Error adding creator to group_members:", memberError);
      }

      setName(""); setDescription("");
      toast.success("Circle established.");
      
      // Fetch the newly created group with members to maintain structure
      const { data: newGroup, error: fetchError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (
            user_id,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .eq('id', data.id)
        .single();
      
      if (!fetchError && newGroup) {
        setGroups(prev => [{
          ...newGroup as any,
          _count: { group_members: 1 }
        }, ...prev]);
      }
    } else {
      toast.error(error?.message || "Signal failure.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-neutral-950 rounded-[2rem] h-full w-full overflow-hidden flex flex-col border border-white/5 relative">
      <Header className="bg-transparent p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-y-6">
            <div className="space-y-2">
                <div className="flex items-center gap-x-2 text-emerald-500 font-black uppercase tracking-[0.3em] text-[9px]">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span>Neural Collective</span>
                </div>
                <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
                    Community <span className="text-emerald-500 underline decoration-emerald-500/10">Circles</span>
                </h1>
                <p className="text-neutral-500 text-sm font-medium opacity-80 max-w-md">Join a resonance group to filter the global noise into meaningful dialogue.</p>
            </div>
            
            <div className="flex items-center gap-x-4 px-6 py-3 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/5 shadow-2xl">
                 <div className="flex flex-col items-end">
                     <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest leading-none">Spheres</span>
                     <span className="text-2xl font-black italic text-white">{groups.length}</span>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                     <MdExplore size={20} className="animate-spin-slow" />
                 </div>
            </div>
        </div>
      </Header>
      
      <div className="p-6 lg:p-8 flex flex-col lg:flex-row gap-10 overflow-y-auto scrollbar-hide flex-1">
        
        {/* Creation Portal */}
        <div className="w-full lg:w-[320px] shrink-0">
           <div className="bg-neutral-900/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex items-center gap-x-3 text-emerald-500 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <MdGroupAdd size={22} />
                 </div>
                 <span className="font-black uppercase tracking-[0.2em] text-xs">Initiate Circle</span>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-600 px-2">Circle Designation</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Midnight Solace"
                      aria-label="Circle name"
                      className="w-full bg-black/40 text-white p-4 rounded-xl border border-white/5 outline-none focus:border-emerald-500/30 transition-all text-sm font-medium placeholder:italic placeholder:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-600 px-2">Resonance Intent</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the frequency..."
                      aria-label="Circle description"
                      className="w-full bg-black/40 text-white p-4 min-h-[100px] rounded-xl border border-white/5 outline-none focus:border-emerald-500/30 transition-all text-sm font-medium placeholder:italic placeholder:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <button disabled={loading} type="submit"
                  className="bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-400 transition-all duration-500 disabled:opacity-50 shadow-xl shadow-emerald-500/20 active:scale-95 focus-visible:outline-none"
                >
                  {loading ? "Establishing..." : "Open Circle"}
                </button>
              </form>
           </div>
        </div>

        {/* Global Spheres Grid */}
        <div className="flex-1">
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-y-4">
               <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Active <span className="text-emerald-500">Clusters</span></h2>
               
               {/* Premium Search Bar */}
               <div className="relative w-full md:w-64 group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <HiMagnifyingGlass size={16} className="text-neutral-600 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search resonance..."
                    className="w-full bg-neutral-900/60 text-white pl-12 pr-4 py-2.5 rounded-xl border border-white/5 outline-none focus:border-emerald-500/30 transition-all text-sm font-medium placeholder:italic placeholder:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                  />
               </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
                {filteredGroups.map((group, i) => (
                <motion.div key={group.id} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="relative group h-[220px]"
                >
                    {/* The Entire Card Surface is the Link */}
                    <Link href={`/groups/${group.id}`} className="absolute inset-0 z-20" />
                    
                    <div className="h-full bg-neutral-900/60 p-6 rounded-2xl border border-white/5 group-hover:border-emerald-500/40 group-hover:bg-neutral-900 transition-all duration-500 shadow-xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none transition-all duration-1000 group-hover:bg-emerald-500/10" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-x-2 text-emerald-500/60">
                                    <HiHashtag size={16} className="group-hover:rotate-[30deg] transition-transform" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Resonance Sphere</span>
                                </div>
                                <div className="px-2 py-0.5 bg-white/5 rounded-full border border-white/5 text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                                   {group._count?.group_members || 0} Synced
                                </div>
                            </div>
                            <h2 className="text-white text-xl font-black italic uppercase tracking-tighter leading-tight mb-2 group-hover:text-emerald-400 transition-colors line-clamp-1">
                                {group.name}
                            </h2>
                            <p className="text-neutral-500 text-xs line-clamp-3 leading-relaxed font-medium group-hover:text-neutral-400 transition-colors">
                                {group.description || "The frequency of this sphere is currently silent but welcoming."}
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center justify-between mt-4">
                             <div className="flex -space-x-2">
                                {group.group_members?.slice(0, 3).map((member, j) => (
                                    <div key={j} className="w-8 h-8 rounded-lg bg-neutral-800 border-2 border-black flex items-center justify-center text-[8px] font-black text-emerald-500 group-hover:border-emerald-500/20 overflow-hidden">
                                        {member.profiles?.avatar_url ? (
                                          <img src={member.profiles.avatar_url} alt={member.profiles.username} className="w-full h-full object-cover" />
                                        ) : (
                                          member.profiles?.username?.charAt(0).toUpperCase() || "?"
                                        )}
                                    </div>
                                ))}
                                {group._count?.group_members && group._count.group_members > 3 && (
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500 border-2 border-black flex items-center justify-center text-[8px] font-black text-black">
                                    +{group._count.group_members - 3}
                                  </div>
                                )}
                             </div>
                             <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-emerald-500 group-hover:text-black transition-all transform group-hover:rotate-[45deg]">
                                <HiArrowUpRight size={18} />
                             </div>
                        </div>
                    </div>
                </motion.div>
                ))}
            </AnimatePresence>
           </div>
        </div>
      </div>
      
      {/* Visual Underlay */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
    </div>
  );
};

export default GroupsPage;
