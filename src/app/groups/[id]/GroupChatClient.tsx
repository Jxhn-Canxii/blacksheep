"use client";

import { useEffect, useState, useRef, memo, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useUser } from "@/providers/UserProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiHashtag, HiChatBubbleBottomCenterText, HiArrowLeft, HiRocketLaunch, HiUserPlus, HiXMark, HiCheckBadge, HiSparkles, HiShieldCheck, HiUserMinus, HiUser, HiShare, HiQrCode } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Swal from 'sweetalert2';

interface Profile {
  username: string;
  avatar_url?: string | null;
}

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  profiles: Profile | null;
}

const GroupMessageItem = memo(({ message, isOwn, router, isFollowing, onToggleFollow }: { message: Message, isOwn: boolean, router: any, isFollowing: boolean, onToggleFollow: (id: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, x: isOwn ? 5 : -5, scale: 0.98 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-x-2`}
  >
    {!isOwn && (
      <button 
        onClick={() => router.push(`/profiles/${message.user_id}`)}
        className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-black mb-1 hover:bg-emerald-500 hover:text-black transition-all overflow-hidden"
      >
        {message.profiles?.avatar_url ? (
          <img src={message.profiles.avatar_url} alt={message.profiles.username} className="w-full h-full object-cover" />
        ) : (
          message.profiles?.username?.charAt(0) || "?"
        )}
      </button>
    )}

    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[85%] md:max-w-[75%] relative`}>
      <div
        className={`
                      relative p-3 px-4 rounded-xl text-[13px] leading-relaxed tracking-tight group
                      ${
                        isOwn
                          ? "bg-emerald-500 text-black rounded-br-none shadow-md shadow-emerald-500/10"
                          : "bg-neutral-900/60 text-neutral-100 border border-white/5 rounded-bl-none shadow-sm hover:border-emerald-500/20 transition-all duration-500"
                      }
                  `}
      >
          <div className="flex items-center gap-x-2 mb-1">
            <button 
              onClick={() => router.push(`/profiles/${message.user_id}`)}
              className={`text-[8px] font-black uppercase tracking-[0.1em] whitespace-nowrap truncate hover:underline transition-all ${isOwn ? "text-black/60" : "text-emerald-500/80"}`}
            >
              @{message.profiles?.username || "known"}
            </button>
            {onToggleFollow && !isOwn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow(message.user_id);
                }}
                className={`text-[6px] font-black uppercase tracking-[0.15em] px-1 py-0.5 rounded border transition-all ${
                  isFollowing 
                    ? "text-neutral-500 border-white/5 bg-white/5" 
                    : "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-black"
                }`}
              >
                {isFollowing ? 'Linked' : 'Link Signal'}
              </button>
            )}
            <span className={`text-[6px] font-mono italic whitespace-nowrap shrink-0 ml-auto ${isOwn ? "text-black/40" : "text-neutral-500"}`}>
              {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="relative z-10 font-medium">
            {message.content}
          </div>
        </div>
      </div>

    {isOwn && (
      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-neutral-600 text-[8px] font-black mb-1 italic">
        ME
      </div>
    )}
  </motion.div>
));

GroupMessageItem.displayName = "GroupMessageItem";

type GroupMessageRow = {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  group_id?: string | null;
  // Supabase row may include other columns (e.g. group_id). We only need these fields for UI.
  [key: string]: unknown;
};

type RealtimeInsertPayload<TNew> = {
  new: TNew;
};

export default function GroupChatClient({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { user, userDetails } = useUser();
  const { supabase } = useSupabase();

  const [newMessage, setNewMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const LIMIT = 20;

  // Optimized SWR Fetching for group data
  const { data: groupData, error: groupError, mutate: mutateGroup } = useSWR(
    [`group-detail`, groupId, user?.id],
    async () => {
      const [groupRes, membershipRes, membersRes] = await Promise.all([
        (supabase as any).from("groups")
          .select("name, cluster_id, cluster_number")
          .eq("id", groupId)
          .single(),
        (supabase as any).from("group_members")
          .select("id, status, role")
          .eq("group_id", groupId)
          .eq("user_id", user?.id)
          .maybeSingle(),
        (supabase as any).from("group_members")
          .select("profiles(id, username, avatar_url), status, role")
          .eq("group_id", groupId)
          .eq("status", "approved"),
      ]);
      
      return {
        group: groupRes.data,
        membership: membershipRes.data,
        members: membersRes.data?.map((m: any) => ({ ...m.profiles, role: m.role })) || []
      };
    },
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  // Optimized SWR Fetching for messages
  const { data: messages, error: messagesError, mutate: mutateMessages } = useSWR(
    [`group-messages`, groupId],
    async () => {
      const { data, error } = await (supabase as any)
        .from('group_messages')
        .select('*, profiles(username, avatar_url)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (error) throw error;
      return data as Message[];
    },
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  );

  const loading = !groupData && !groupError;
  const groupName = groupData?.group?.name || "";
  const clusterId = groupData?.group?.cluster_id || "";
  const clusterNumber = groupData?.group?.cluster_number || null;
  const isMember = groupData?.membership?.status === 'approved';
  const membershipStatus = groupData?.membership?.status || null;
  const userRole = groupData?.membership?.role || null;
  const members = groupData?.members || [];

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const handleShare = async () => {
    const shareData = {
      title: `Join our Circle: ${groupName}`,
      text: `Connect with us in the ${groupName} resonance sphere on Black Sheep.`,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Signal propagated.");
      } catch (err) {
        // silence
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied for shared frequency.");
    }
  };

  const handleCopyClusterId = () => {
    navigator.clipboard.writeText(clusterId);
    toast.success("Cluster ID copied for resonance.");
  };

  const fetchFollowing = async () => {
    if (!user) return;
    const { data } = await (supabase
      .from('follows') as any)
      .select('following_id')
      .eq('follower_id', user.id);
    
    if (data) {
      setFollowingIds(new Set((data as any[]).map(f => f.following_id)));
    }
  };

  useEffect(() => {
    fetchFollowing();
  }, [user, supabase]);

  const toggleFollow = useCallback(async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = followingIds.has(targetUserId);

    if (isFollowing) {
      const { error } = await (supabase
        .from('follows') as any)
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      
      if (!error) {
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      }
    } else {
      const { error } = await (supabase
        .from('follows') as any)
        .insert([{ follower_id: user.id, following_id: targetUserId }]);
      
      if (!error) {
        setFollowingIds(prev => new Set(prev).add(targetUserId));
      }
    }
  }, [user, supabase, followingIds]);

  const [pendingMembers, setPendingMembers] = useState<any[]>([]);

  // Fetch pending members if user is admin/moderator
  useEffect(() => {
    const fetchPending = async () => {
      if (userRole !== 'admin' && userRole !== 'moderator') return;
      const { data, error } = await (supabase as any).from("group_members")
        .select("profiles(id, username, avatar_url)")
        .eq("group_id", groupId)
        .eq("status", "pending");
      
      if (!error && data) {
        setPendingMembers(data.map((m: any) => m.profiles));
      }
    };
    fetchPending();
  }, [supabase, groupId, userRole]);

  // Real-time subscription for messages and group data
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-realtime-${groupId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`
      }, () => {
        mutateMessages();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`
      }, () => {
        mutateGroup();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, groupId, mutateMessages, mutateGroup]);

  // Defensive guard: if some navigation bug ever produces `/groups/undefined`.
  const isInvalidGroupId = !groupId || groupId === "undefined";


  // Request to join the group
  const handleRequestJoin = useCallback(async () => {
    if (!user) {
      toast.error("Sign in to request joining this circle.");
      return;
    }
    
    const { error } = await (supabase as any)
      .from("group_members")
      .insert([{ group_id: groupId, user_id: user.id, status: 'pending' }]);
    
    if (error) {
      toast.error("Failed to send join request.");
    } else {
      toast.success("Join request sent! Awaiting approval.");
      setIsMember(true);
      setMembershipStatus('pending');
    }
  }, [user, supabase, groupId]);

  // Approve a member (Admin/Moderator only)
  const approveMember = useCallback(async (targetUserId: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') {
      toast.error("You don't have permission to approve members.");
      return;
    }

    const { data, error } = await (supabase as any)
      .from("group_members")
      .update({ status: 'approved' })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .select();

    if (error) {
      toast.error("Failed to approve member.");
    } else {
      toast.success("Member approved!");
      // Refresh member lists
      const { data: memberData } = await (supabase as any).from("group_members")
        .select("profiles(id, username, avatar_url), status, role")
        .eq("group_id", groupId)
        .eq("status", "approved");
      
      if (memberData) {
        setMembers(memberData.map((m: any) => ({ ...m.profiles, role: m.role })));
      }
      
      setPendingMembers(prev => prev.filter(m => m.id !== targetUserId));
    }
  }, [userRole, supabase, groupId]);

  // Update a member's role (Admin only)
  const updateMemberRole = useCallback(async (targetUserId: string, newRole: 'admin' | 'moderator' | 'member') => {
    if (userRole !== 'admin') {
      toast.error("Only the creator/admin can assign roles.");
      return;
    }

    const { data, error } = await (supabase as any)
      .from("group_members")
      .update({ role: newRole })
      .eq("group_id", groupId)
      .eq("user_id", targetUserId)
      .select();

    if (error) {
      toast.error(`Failed to update role to ${newRole}.`);
    } else {
      toast.success(`User promoted to ${newRole}!`);
      // Refresh member list
      const { data: memberData } = await (supabase as any).from("group_members")
        .select("profiles(id, username, avatar_url), status, role")
        .eq("group_id", groupId)
        .eq("status", "approved");
      
      if (memberData) {
        setMembers(memberData.map((m: any) => ({ ...m.profiles, role: m.role })));
      }
    }
  }, [userRole, supabase, groupId]);

  // Remove a member (Admin/Moderator only)
  const removeMember = useCallback(async (targetUserId: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') {
      toast.error("You don't have permission to remove members.");
      return;
    }

    const result = await Swal.fire({
        title: 'Sever Connection?',
        text: 'Are you sure you want to decouple this entity from the circle? This will terminate their resonance with this frequency.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // red-500
        cancelButtonColor: '#3f3f46',
        confirmButtonText: 'Sever Link',
        cancelButtonText: 'Maintain Connection',
        background: '#171717',
        color: '#fff',
        customClass: {
          popup: 'rounded-[2.5rem] border border-white/10 shadow-3xl',
          title: 'text-xl font-black italic uppercase tracking-tighter text-white',
          confirmButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] mx-2',
          cancelButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-[10px] mx-2'
        }
    });

    if (!result.isConfirmed) return;

    const { error } = await (supabase as any)
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", targetUserId);

    if (error) {
      toast.error("Failed to remove member.");
    } else {
      toast.success("Member removed from circle.");
      setMembers(prev => prev.filter(m => m.id !== targetUserId));
    }
  }, [userRole, supabase, groupId]);

  // Search for users to add to the group
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${searchQuery}%`)
      .limit(5);

    if (error) {
      toast.error("Failed to search users.");
    } else {
      setSearchResults(data || []);
    }
    setSearching(false);
  }, [searchQuery, supabase]);

  // Add a user to the group
  const addMember = useCallback(async (targetUserId: string) => {
    const { error } = await (supabase as any)
      .from("group_members")
      .insert([{ group_id: groupId, user_id: targetUserId, status: 'approved' }]);

    if (error) {
      if (error.code === "23505") {
        toast.error("User is already in this circle.");
      } else {
        toast.error("Failed to add member.");
      }
    } else {
      toast.success("User added to the circle!");
      setIsAddMemberOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [supabase, groupId]);

  // Helper to scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Scroll to bottom on initial messages load
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    fetchInitialMessages();

    if (isInvalidGroupId || membershipStatus !== 'approved') return;

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "messages",
          filter: `group_id=eq.${groupId}` 
        },
        async (payload: RealtimeInsertPayload<GroupMessageRow>) => {

          const { data: profile } = await (supabase as any)
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          setMessages((prev) => {
            const filtered = prev.filter(m => 
              !(m.user_id === payload.new.user_id && m.content === payload.new.content && m.id.length > 30)
            );
            
            const updated = [
              ...filtered,
              {
                id: payload.new.id,
                created_at: payload.new.created_at,
                content: payload.new.content,
                user_id: payload.new.user_id,
                profiles: profile,
              },
            ];

            // If we are already near the bottom, scroll to the new message
            if (scrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
              if (isNearBottom) {
                setTimeout(() => scrollToBottom(), 100);
              }
            }

            return updated;
          });
        },
      )
      .subscribe();

  // No longer needed, as we have SWR and real-time subscription.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (honeypot) {
      console.warn("Bot detected in group chat.");
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < 1000) { // Reduced to 1 second for smoother feel
      toast.error("Vibrating too fast. Wait a moment...");
      return;
    }

    if (!user) {
      toast.error("Sign in to resonate.");
      return;
    }
    if (isInvalidGroupId) return;
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage("");

    // Optimistic Update
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      created_at: new Date().toISOString(),
      content: content,
      user_id: user.id,
      profiles: {
        username: userDetails?.username || "me",
        avatar_url: userDetails?.avatar_url || null,
      },
    };

    mutateMessages([...(messages || []), optimisticMessage], false);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const { error } = await (supabase as any)
        .from('group_messages')
        .insert([{ content, user_id: user.id, group_id: groupId }]);

      if (error) {
        console.error("Failed to send message:", error);
        toast.error("Signal lost. Reconnecting...");
        // Rollback
        mutateMessages();
        setNewMessage(content);
      } else {
        setLastSubmitTime(Date.now());
        mutateMessages();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Neural link interrupted.");
      mutateMessages();
      setNewMessage(content);
    }
  };

  return (
    isInvalidGroupId ? (
      <div className="bg-neutral-950 rounded-[3rem] h-full w-full overflow-hidden flex flex-col border border-white/5 p-8">
        <div className="text-white font-black text-xl">Circle not found</div>
        <div className="text-neutral-500 mt-2">Invalid circle id.</div>
      </div>
    ) : isMember === false ? (
      <div className="bg-neutral-950 rounded-[3rem] h-full w-full overflow-hidden flex flex-col border border-white/5 relative items-center justify-center p-8 text-center">
        <div className="absolute top-8 left-8">
           <button
            onClick={() => router.back()}
            className="p-4 bg-white/5 rounded-2xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/5"
          >
            <HiArrowLeft size={24} />
          </button>
        </div>
        
        <div className="max-w-md space-y-8">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
             <HiChatBubbleBottomCenterText size={48} className="animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-white text-4xl font-black italic uppercase tracking-tighter">
              Private <span className="text-emerald-500 underline decoration-emerald-500/20">Resonance</span>
            </h2>
            <p className="text-neutral-500 text-lg leading-relaxed">
              This circle is currently vibrating on a frequency you haven't synced with yet.
            </p>
          </div>
          
          <button
            onClick={handleRequestJoin}
            className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-black rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95"
          >
            Request to Join
          </button>
        </div>
        
        {/* Atmospheric background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>
    ) : membershipStatus === 'pending' ? (
      <div className="bg-neutral-950 rounded-[3rem] h-full w-full overflow-hidden flex flex-col border border-white/5 relative items-center justify-center p-8 text-center">
        <div className="absolute top-8 left-8">
           <button
            onClick={() => router.back()}
            className="p-4 bg-white/5 rounded-2xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/5"
          >
            <HiArrowLeft size={24} />
          </button>
        </div>
        
        <div className="max-w-md space-y-8">
          <div className="w-24 h-24 bg-yellow-500/10 rounded-[2rem] border border-yellow-500/20 flex items-center justify-center mx-auto text-yellow-500">
             <HiRocketLaunch size={48} className="animate-bounce" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-white text-4xl font-black italic uppercase tracking-tighter">
              Request <span className="text-yellow-500">Sent</span>
            </h2>
            <p className="text-neutral-500 text-lg leading-relaxed">
              Your signal is waiting for approval from the circle's moderators.
            </p>
          </div>
          
          <div className="py-4 px-8 bg-white/5 rounded-2xl border border-white/5 text-neutral-400 text-xs font-black uppercase tracking-widest italic">
            Waiting for neural link authorization...
          </div>
        </div>
      </div>
    ) : (
    <div className="bg-neutral-950 rounded-[2rem] h-full w-full overflow-hidden flex flex-col border border-white/5 relative">
      {/* Dynamic Header */}
      <div className="bg-neutral-900/40 backdrop-blur-3xl border-b border-white/5 p-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-x-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="group p-2 bg-white/5 rounded-xl text-white hover:bg-emerald-500 hover:text-black transition-all duration-500 border border-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50"
          >
            <HiArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-base font-black italic uppercase tracking-tighter">
              {groupName || "Stress Circle"}
            </h1>
            <div className="flex items-center gap-x-1.5">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-neutral-500 text-[7px] uppercase font-black tracking-[0.2em]">Neural Link Active</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-x-2.5">
          {/* Admin: Show Pending Requests */}
          {(userRole === 'admin' || userRole === 'moderator') && pendingMembers.length > 0 && (
            <div className="relative group">
              <button
                className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all animate-pulse"
                aria-label="Pending Requests"
              >
                <HiUserPlus size={18} />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-black">
                  {pendingMembers.length}
                </span>
              </button>
              
              {/* Dropdown for pending requests */}
              <div className="absolute top-full right-0 mt-2 w-56 bg-neutral-900 border border-white/10 rounded-2xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                <h4 className="text-white text-[8px] font-black uppercase tracking-widest mb-2 border-b border-white/5 pb-1.5">Join Requests</h4>
                <div className="space-y-2">
                  {pendingMembers.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-x-2">
                      <div className="flex items-center gap-x-2 truncate">
                        <div className="relative flex-shrink-0">
                          <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-[9px] text-emerald-500 border border-white/10 overflow-hidden">
                            {p.avatar_url ? <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" /> : p.username.charAt(0)}
                          </div>
                        </div>
                        <span className="text-white text-[11px] font-bold truncate">@{p.username}</span>
                      </div>
                      <button
                        onClick={() => approveMember(p.id)}
                        className="p-1 bg-emerald-500 rounded-lg text-black hover:bg-emerald-400 transition-all"
                      >
                        <HiCheckBadge size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleShare}
            className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all duration-300 border border-emerald-500/20"
            title="Propagate Signal (Share)"
          >
            <HiShare size={16} />
          </button>

          <button
            onClick={() => setIsQrOpen(true)}
            className="p-2 bg-neutral-900/60 rounded-xl text-white hover:bg-neutral-800 transition-all duration-300 border border-white/5"
            title="Pulse Signature (QR)"
          >
            <HiQrCode size={16} />
          </button>

          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="p-2 bg-white/5 rounded-xl text-white hover:bg-emerald-500 hover:text-black transition-all duration-300 border border-white/5"
            aria-label="Add Member"
          >
            <HiUserPlus size={18} />
          </button>

          <div 
            onClick={() => setIsMembersModalOpen(true)}
            className="hidden md:flex p-2 bg-white/5 rounded-xl border border-white/5 items-center gap-x-2.5 cursor-pointer hover:bg-white/10 transition-all"
          >
            <div className="flex -space-x-1.5">
              {members.slice(0, 3).map((member, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg bg-neutral-800 border-2 border-black flex items-center justify-center text-[9px] font-bold text-emerald-500 overflow-hidden relative group/member hover:scale-110 hover:z-10 transition-all shadow-xl"
                  title={`@${member.username} (${member.role})`}
                >
                  {member?.avatar_url ? (
                    <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                  ) : (
                    member?.username?.charAt(0) || "?"
                  )}
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-7 h-7 rounded-lg bg-neutral-900 border-2 border-black flex items-center justify-center text-[8px] font-bold text-neutral-500 shadow-xl">
                  +{members.length - 3}
                </div>
              )}
            </div>
            <div className="flex flex-col items-start pr-1">
              <span className="text-[8px] font-black uppercase text-white tracking-widest whitespace-nowrap">{members.length} Synced</span>
              <div className="flex items-center gap-x-1 mt-0.5">
                <div className="w-0.5 h-0.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[6px] font-black uppercase text-emerald-500/60 tracking-widest whitespace-nowrap">{messages.length} Echoes</span>
              </div>
            </div>
          </div>
        </div>
    </div>

      {/* Experimental Chat Feed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-8 glass-scroll bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-opacity-5"
      >
        <AnimatePresence>
          {loadingMore && (
            <div className="w-full flex justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-emerald-500" />
            </div>
          )}
          
          {messages.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-800 gap-y-4">
              <HiChatBubbleBottomCenterText size={64} className="opacity-5 animate-bounce-slow" />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] italic opacity-50">Tacet Horizon...</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.user_id === user?.id;
              return (
                <GroupMessageItem 
                  key={message.id} 
                  message={message} 
                  isOwn={isOwn} 
                  router={router} 
                  isFollowing={followingIds.has(message.user_id)}
                  onToggleFollow={toggleFollow}
                />
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Glass-Docked Message Input */}
      <div className="p-4 bg-neutral-900/80 backdrop-blur-3xl border-t border-white/5 z-30">
        <form onSubmit={handleSubmit} className="relative z-20 flex gap-x-3 items-center">
          <div className="flex-1 relative group">
            {/* Honeypot field - bots will fill this */}
            <input
              type="text"
              name="chat_neural_signature"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Resonate with the circle..."
              aria-label="Circle message"
              className="w-full bg-black/60 text-white p-4 rounded-xl border border-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus:border-emerald-500/30 transition-all text-sm font-medium shadow-inner placeholder:text-neutral-700 placeholder:italic"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-x-2 pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Linked</span>
            </div>
          </div>

          <button
            type="submit"
            aria-label="Send circle message"
            className="
                p-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all duration-500 shadow-xl shadow-emerald-500/20
                active:scale-90
                focus-visible:outline-none
            "
          >
            <HiRocketLaunch size={20} />
          </button>
        </form>
      </div>

      {/* Atmospheric Underlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[150px] animate-pulse-slow" />
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddMemberOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => setIsAddMemberOpen(false)}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <HiXMark size={24} />
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                  Expand <span className="text-emerald-500">Circle</span>
                </h2>
                <p className="text-neutral-500 text-sm">Add other stress-blowers to this resonance sphere.</p>
              </div>

              <form onSubmit={handleSearch} className="flex gap-x-2 mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by @username"
                  className="flex-1 bg-black/40 text-white px-6 py-4 rounded-2xl border border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-4 bg-emerald-500 text-black font-black uppercase text-xs rounded-2xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {searching ? "..." : "Search"}
                </button>
              </form>

              <div className="space-y-3">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all"
                    >
                      <span className="text-white font-bold tracking-tight">@{result.username}</span>
                      <button
                        onClick={() => addMember(result.id)}
                        className="px-4 py-2 bg-white/5 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-black transition-all"
                      >
                        Add to Circle
                      </button>
                    </div>
                  ))
                ) : searchQuery && !searching ? (
                  <p className="text-center text-neutral-600 py-4 text-xs font-black uppercase tracking-widest italic">
                    No signals found...
                  </p>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Members List Modal */}
      <AnimatePresence>
        {isMembersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMembersModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="absolute top-0 right-0 p-4">
                <button
                  onClick={() => setIsMembersModalOpen(false)}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <HiXMark size={24} />
                </button>
              </div>

              <div className="mb-8">
                <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">
                  Circle <span className="text-emerald-500">Minds</span>
                </h2>
                <p className="text-neutral-500 text-sm">{members.length} entities synchronized in this sphere.</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group/member-row hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center gap-x-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-lg text-emerald-500 border border-white/10 overflow-hidden">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                          ) : (
                            member.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        {member.role === 'admin' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg z-10">
                            <HiSparkles size={10} className="text-black" />
                          </div>
                        )}
                        {member.role === 'moderator' && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg z-10">
                            <HiShieldCheck size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-black italic tracking-tight truncate">@{member.username}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          member.role === 'admin' ? 'text-emerald-500' : 
                          member.role === 'moderator' ? 'text-blue-500' : 'text-neutral-500'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-x-2">
                      {/* Admin Actions */}
                      {userRole === 'admin' && member.id !== user?.id && (
                        <>
                          {member.role !== 'moderator' && (
                            <button
                              onClick={() => updateMemberRole(member.id, 'moderator')}
                              className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                              title="Make Moderator"
                            >
                              <HiShieldCheck size={18} />
                            </button>
                          )}
                          {member.role === 'moderator' && (
                            <button
                              onClick={() => updateMemberRole(member.id, 'member')}
                              className="p-3 bg-neutral-500/10 text-neutral-500 rounded-xl hover:bg-neutral-500 hover:text-white transition-all"
                              title="Demote to Member"
                            >
                              <HiUser size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            title="Remove from Circle"
                          >
                            <HiUserMinus size={18} />
                          </button>
                        </>
                      )}
                      
                      {/* Moderator Actions (Remove members only) */}
                      {userRole === 'moderator' && member.role === 'member' && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          title="Remove from Circle"
                        >
                          <HiUserMinus size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => router.push(`/profiles/${member.id}`)}
                        className="p-3 bg-white/5 text-neutral-400 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                        title="View Profile"
                      >
                        <HiArrowLeft size={18} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Signature Modal */}
      <AnimatePresence>
        {isQrOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQrOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-[340px] bg-neutral-900 border border-white/10 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col items-center"
            >
              <div className="absolute top-0 right-0 p-6">
                <button
                  onClick={() => setIsQrOpen(false)}
                  className="p-2 text-neutral-500 hover:text-white transition-colors"
                >
                  <HiXMark size={24} />
                </button>
              </div>

              <div className="mb-8 text-center">
                <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-1">
                  Pulse <span className="text-emerald-500">Signature</span>
                </h2>
                <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest">{groupName}</p>
              </div>

              <div className="relative group/qr p-6 bg-white rounded-[2rem] shadow-2xl transition-transform hover:scale-105 duration-700">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-[2rem] animate-pulse pointer-events-none" />
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&bgcolor=ffffff&color=10b981&format=svg&qzone=1`} 
                  alt="Circle QR Code"
                  className="w-40 h-40 relative z-10"
                />
              </div>

              <div className="mt-10 w-full space-y-4">
                <div 
                  onClick={handleCopyClusterId}
                  className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-all group"
                >
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-neutral-600 tracking-widest leading-none mb-1">Cluster ID</span>
                      <span className="text-sm font-black italic text-white uppercase tracking-tight group-hover:text-emerald-500 transition-colors truncate max-w-[180px]">{clusterId}</span>
                   </div>
                   <HiHashtag size={20} className="text-neutral-800 group-hover:text-emerald-500 transition-colors" />
                </div>
                
                <p className="text-neutral-600 text-[9px] text-center font-medium leading-relaxed px-2">
                  Scanning this signature redirects users to this resonance sphere. Keep it secure or propagate widely.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    )
  );
}

