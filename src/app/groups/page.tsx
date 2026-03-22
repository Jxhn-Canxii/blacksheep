"use client";

import { useEffect, useState, useMemo, memo } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import Header from "@/components/Header";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MdGroupAdd, MdExplore } from "react-icons/md";
import { HiArrowUpRight, HiHashtag, HiMagnifyingGlass, HiSparkles } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { supabaseFetcher } from "@/libs/fetcher";

interface GroupMember {
  user_id: string;
  status?: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface Group {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  cluster_number: number;
  cluster_id: string;
  group_members: GroupMember[];
  _count?: {
    group_members: number;
  };
}

const GroupCard = memo(({ group, i, user, joinGroup, loadingCircles }: any) => {
  const isMember = group.group_members?.some((m: any) => m.user_id === user?.id);
  const isPending = group.group_members?.find((m: any) => m.user_id === user?.id)?.status === 'pending';
  const isSyncing = loadingCircles.has(group.id);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
        className="relative group min-h-[300px] flex"
    >
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/0 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
        
        <div className="flex-1 bg-gradient-to-br from-neutral-900/90 via-neutral-900/70 to-emerald-500/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 group-hover:border-emerald-500/50 transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col justify-between cursor-default">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none transition-all duration-1000 group-hover:bg-emerald-500/15" />
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-x-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 group-hover:bg-emerald-500 group-hover:text-black transition-all flex items-center justify-center shadow-xl group-hover:shadow-emerald-500/20">
                          <HiHashtag size={18} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-600 group-hover:text-white transition-colors" title={group.cluster_id}>
                            {group.cluster_id?.slice(0, 16) || `Cluster #${group.cluster_number}`}
                          </span>
                          {group.is_private && (
                            <div className="flex items-center gap-x-1.5 mt-0.5">
                              <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" />
                              <span className="text-[7px] font-black text-yellow-500/70 uppercase tracking-widest">Gated Frequency</span>
                            </div>
                          )}
                        </div>
                    </div>
                    
                    <div className="flex -space-x-2.5">
                        {group.group_members?.slice(0, 4).map((m: any, idx: number) => (
                            <div key={idx} className="w-7 h-7 rounded-lg border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110" style={{ zIndex: 10 - idx }}>
                                {m.profiles?.avatar_url ? (
                                    <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[8px] font-black text-emerald-500/50">{m.profiles?.username?.charAt(0) || '?'}</span>
                                )}
                            </div>
                        ))}
                        {group.group_members?.length > 4 && (
                            <div className="w-7 h-7 rounded-lg border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-[7px] font-black text-neutral-500 z-0">
                                +{group.group_members.length - 4}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white italic group-hover:text-emerald-500 transition-colors uppercase leading-none tracking-tight">
                    {group.name}
                  </h3>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed italic group-hover:text-neutral-400 transition-colors">
                    {group.description || "No transmission description available for this cluster frequency."}
                  </p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-12 relative z-10">
                <div className="flex items-center gap-x-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest group-hover:text-neutral-500 transition-colors">Synced Signals</span>
                    <span className="text-xl font-black text-emerald-500 tracking-tighter">{group._count?.group_members || 0}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/5" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest group-hover:text-neutral-500 transition-colors">Vibration Status</span>
                    <span className="text-[10px] font-black text-white uppercase italic tracking-widest">
                      {group.is_private ? "STABLE" : "OSCILLATING"}
                    </span>
                  </div>
                </div>

                {isMember ? (
                  <Link href={`/groups/${group.id}`}
                    className="h-14 px-8 bg-emerald-500 text-black rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-white hover:scale-105 active:scale-95 transition-all"
                  >
                    Open Portal
                  </Link>
                ) : isPending ? (
                  <button disabled
                    className="h-14 px-8 bg-white/5 text-neutral-500 border border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] italic"
                  >
                    Sync Pending...
                  </button>
                ) : (
                  <button 
                    onClick={() => joinGroup(group.id, group.is_private)}
                    disabled={isSyncing}
                    className="h-14 px-8 bg-white/5 text-white hover:bg-white hover:text-black border border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50"
                  >
                    {isSyncing ? "Syncing..." : "Connect Frequency"}
                  </button>
                )}
            </div>
        </div>
    </motion.div>
  );
});

const GroupsPage = () => {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingCircles, setLoadingCircles] = useState<Set<string>>(new Set());

  const { data: groups, error, mutate } = useSWR(
    ['groups', user?.id],
    async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (
            user_id,
            status,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as any[]).map(group => ({
        ...group,
        _count: {
          group_members: group.group_members?.length || 0
        }
      }));
    },
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const loading = !groups && !error;

  const userGroups = useMemo(() => {
    if (!groups || !user) return [];
    return groups.filter(g => g.group_members?.some((m: any) => m.user_id === user.id));
  }, [groups, user]);

  useEffect(() => {
    const channel = supabase
      .channel('groups-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => mutate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => mutate())
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, mutate]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(group => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const matchesName = group.name.toLowerCase().includes(query);
      const matchesDesc = group.description?.toLowerCase().includes(query);
      const isMatchingNumber = group.cluster_number?.toString() === query;
      const isMatchingUniqueId = group.cluster_id?.toLowerCase() === query;
      const isPartialUniqueId = group.cluster_id?.toLowerCase().includes(query);
      
      return matchesName || matchesDesc || isMatchingNumber || isMatchingUniqueId || isPartialUniqueId;
    });
  }, [groups, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Identity required to start a circle."); return; }
    if (!name.trim()) { toast.error("A name is required for resonance."); return; }
    setCreating(true);
    const { data, error } = await (supabase as any)
      .from("groups")
      .insert([{ name, description, created_by: user.id, is_private: isPrivate }])
      .select()
      .single();
    if (!error && data) {
      setName(""); setDescription("");
      toast.success("Circle established.");
      
      const { data: newGroup, error: fetchError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (
            user_id,
            status,
            profiles (
              username,
              avatar_url
            )
          )
        `)
        .eq('id', data.id)
        .single();
      
      if (!fetchError && newGroup) {
        const mapped = {
          ...newGroup as any,
          _count: { group_members: 1 }
        };
        setGroups(prev => [mapped, ...prev]);
        setUserGroups(prev => [mapped, ...prev]);
      }
    } else {
      toast.error(error?.message || "Signal failure.");
    }
    setCreating(false);
  };

  const joinGroup = async (id: string, isPrivate: boolean) => {
    if (!user) {
      toast.error("Sign in to join this circle.");
      return;
    }

    setLoadingCircles(prev => new Set(prev).add(id));

    const { error } = await (supabase as any)
      .from('group_members')
      .insert([{ 
        group_id: id, 
        user_id: user.id, 
        status: isPrivate ? 'pending' : 'approved',
        role: 'member'
      }]);

    if (!error) {
      const newStatus = isPrivate ? 'pending' : 'approved';
      toast.success(newStatus === 'pending' ? "Join request sent." : "Circle synchronized.");
      mutate();
    } else {
      console.error(error);
      toast.error(error.message || "Signal lost. Reconnecting...");
    }
    setLoadingCircles(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
  };

  const handleJoinRequest = async (e: React.MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    return joinGroup(group.id, group.is_private);
  };

  return (
    <div className="bg-neutral-950 min-h-screen w-full relative pb-24">
      <Header className="bg-transparent pt-8 px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-y-8 pb-10 border-b border-white/5">
            <div className="space-y-3">
                <div className="flex items-center gap-x-3 text-emerald-500 font-black uppercase tracking-[0.4em] text-[10px]">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span>Neural Collective</span>
                </div>
                <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-[0.9]">
                    Collective <br /> <span className="text-neutral-800">Discovery</span>
                </h1>
                <p className="text-neutral-500 text-sm font-medium opacity-60 max-w-lg">Join a resonance group to filter the global noise into meaningful dialogue.</p>
            </div>
            
            <div className="flex items-center gap-x-6 px-8 py-4 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/5 shadow-2xl">
                 <div className="flex flex-col items-end">
                     <span className="text-[9px] font-black uppercase text-emerald-500 tracking-[0.3em] leading-none mb-1">Active Spheres</span>
                     <span className="text-3xl font-black italic text-white leading-none">{groups.length}</span>
                 </div>
                 <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                     <MdExplore size={24} className="animate-spin-slow" />
                 </div>
            </div>
        </div>
      </Header>
      
      <div className="px-6 lg:px-12 mt-12 flex flex-col lg:flex-row gap-12 lg:gap-16">
        
        {/* Creation Sidepanel */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-10">
           <div className="bg-gradient-to-br from-neutral-900/40 via-neutral-900/20 to-emerald-500/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="flex items-center gap-x-3 text-white mb-8">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <MdGroupAdd size={20} />
                 </div>
                 <h2 className="font-black uppercase tracking-tighter italic text-xl">Initiate <span className="text-emerald-500">Circle</span></h2>
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-y-5">
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-600 px-3">Designation</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Midnight Solace"
                      className="w-full bg-black/40 text-white p-4 rounded-xl border border-white/5 outline-none focus:border-emerald-500/40 transition-all text-sm font-bold placeholder:italic placeholder:opacity-20"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-[0.3em] text-neutral-600 px-3">Intent</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the frequency..."
                      className="w-full bg-black/40 text-white p-4 min-h-[110px] rounded-xl border border-white/5 outline-none focus:border-emerald-500/40 transition-all text-sm font-bold placeholder:italic placeholder:opacity-20 resize-none"
                    />
                </div>
                <div className="flex items-center gap-x-3 px-3 py-1.5 group/check cursor-pointer" onClick={() => setIsPrivate(!isPrivate)}>
                    <div className={`w-4 h-4 rounded-md border transition-all flex items-center justify-center ${isPrivate ? 'bg-emerald-500 border-emerald-500' : 'bg-black/40 border-white/10'}`}>
                        {isPrivate && <div className="w-1.5 h-1.5 bg-black rounded-sm" />}
                    </div>
                    <label className="text-[10px] font-black uppercase text-neutral-400 cursor-pointer tracking-widest">Restrict Entrance</label>
                </div>
                <button disabled={creating} type="submit"
                  className="bg-emerald-500 text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white transition-all duration-500 disabled:opacity-50 shadow-2xl shadow-emerald-500/20 active:scale-95 mt-2"
                >
                  {creating ? "Establishing Neural Node..." : "Establish Circle"}
                </button>
              </form>
           </div>

           {user && (
             <div className="space-y-6 px-2">
                <div className="flex items-center gap-x-2.5 text-neutral-700 font-black uppercase tracking-[0.3em] text-[9px]">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                    <span>Active Resonances</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {loading ? (
                        [1,2,3].map(i => <div key={i} className="h-16 bg-neutral-900/40 animate-pulse rounded-2xl border border-white/5" />)
                    ) : userGroups.length > 0 ? (
                        userGroups.map((group) => (
                           <Link key={group.id} href={`/groups/${group.id}`}
                             className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-emerald-500 hover:text-black transition-all group/sc shadow-lg"
                           >
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-white uppercase italic group-hover/sc:text-black transition-colors">{group.name}</span>
                                 <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest group-hover/sc:text-black/60">{group._count?.group_members} Synced</span>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/sc:bg-black/10 transition-colors">
                                <HiArrowUpRight size={14} className="text-neutral-500 group-hover/sc:text-black transition-all" />
                              </div>
                           </Link>
                        ))
                    ) : (
                        <p className="text-[9px] text-neutral-700 font-black uppercase tracking-[0.2em] px-2 italic">Grid silent. Find a cluster.</p>
                    )}
                </div>
             </div>
           )}
        </div>

        {/* Global Spheres Grid */}
        <div className="flex-1 space-y-12">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="flex flex-col space-y-1.5">
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Neural <span className="text-emerald-500 underline decoration-emerald-500/20">Clusters</span></h2>
                  <p className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.4em] mt-0.5">Global discovery grid initialized</p>
               </div>
               
               <div className="relative w-full md:w-[400px] group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <HiMagnifyingGlass size={18} className="text-neutral-700 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search neural frequencies..."
                    className="w-full bg-neutral-900/40 text-white pl-14 pr-5 py-4 rounded-[2rem] border border-white/5 outline-none focus:border-emerald-500/40 transition-all text-sm font-bold placeholder:italic placeholder:opacity-20 shadow-2xl focus:shadow-emerald-500/10"
                  />
               </div>
           </div>
           
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-[280px] bg-neutral-900/40 animate-pulse rounded-[2.5rem] border border-white/5" />
                ))}
             </div>
           ) : filteredGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 xl:gap-10">
              <AnimatePresence mode="popLayout">
                  {filteredGroups.map((group, i) => (
                    <GroupCard 
                      key={group.id}
                      group={group}
                      i={i}
                      user={user}
                      joinGroup={joinGroup}
                      loadingCircles={loadingCircles}
                    />
                  ))}
              </AnimatePresence>
              </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-40 text-center space-y-8">
                <div className="w-24 h-24 rounded-[2rem] bg-neutral-900 flex items-center justify-center border border-white/5 shadow-inner">
                    <MdExplore size={40} className="text-neutral-700 animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">No Clusters Detected</h3>
                    <p className="text-neutral-600 text-sm font-medium">Global grid silent. Adjust your search or initiate a new resonance circle.</p>
                </div>
             </div>
           )}
        </div>
      </div>
      
      {/* Dynamic Background Fog */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[200px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>
    </div>
  );
};

export default GroupsPage;
