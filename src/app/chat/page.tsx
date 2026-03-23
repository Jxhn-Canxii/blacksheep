"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/providers/UserProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { HiPaperAirplane, HiOutlineUserCircle } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

interface Message {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

const GlobalChatPage = () => {
  const { user } = useUser();
  const { supabase } = useSupabase();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MESSAGES_PER_PAGE = 20;

  const fetchMessages = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    const { data, error } = await (supabase.from("messages") as any)
      .select("*, profiles (username, avatar_url)")
      .is("group_id", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + MESSAGES_PER_PAGE - 1);

    if (!error && data) {
      const formattedData = (data as any[]).reverse();
      if (offset === 0) {
        setMessages(formattedData);
      } else {
        setMessages(prev => [...formattedData, ...prev]);
      }
      if (data.length < MESSAGES_PER_PAGE) setHasMore(false);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchMessages(0);

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          if (payload.new.group_id !== null) return;
          
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("username, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg: Message = {
            id: payload.new.id,
            created_at: payload.new.created_at,
            content: payload.new.content,
            user_id: payload.new.user_id,
            profiles: profile,
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!loadingMore) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingMore]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !loadingMore) {
      fetchMessages(messages.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    const { error } = await (supabase.from("messages") as any)
      .insert([{ content: newMessage, user_id: user.id }]);
    if (!error) setNewMessage("");
  };

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

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

  const toggleFollow = async (targetUserId: string) => {
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
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.add(targetUserId);
          return next;
        });
      }
    }
  };

  return (
    <div className="bg-neutral-900 rounded-[3rem] h-full w-full flex flex-col overflow-hidden relative border border-white/5 shadow-2xl">
      <Header className="bg-gradient-to-b from-neutral-800 to-black p-8">
        <div className="flex flex-col">
          <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
            Global <span className="text-emerald-500 underline decoration-emerald-500/20">Chat</span>
          </h1>
          <p className="text-neutral-400 mt-2 font-medium">
            Real-time room for all stress-blowers.
          </p>
        </div>
      </Header>
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-y-6 scrollbar-hide relative"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-emerald-500"></div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-700 space-y-4">
            <HiOutlineUserCircle size={48} className="opacity-20" />
            <p className="text-xs font-black uppercase tracking-[0.3em] italic">No signals detected yet...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isOwn = message.user_id === user?.id;
              const anonymousName = message.user_id ? `Anonymous-${message.user_id.slice(-4)}` : "Anonymous-0000";

              return (
                <motion.div
                  key={message.id}
                  initial={{ scale: 0.95, opacity: 0, y: 5 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                >
                  <div className={`flex items-end gap-x-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    {!isOwn && (
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center shrink-0 mb-1 overflow-hidden">
                        <span className="text-[10px] font-black text-emerald-500 uppercase">{anonymousName.charAt(0)}</span>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] md:max-w-[70%] p-3 px-5 rounded-2xl shadow-lg border border-white/5 ${
                        isOwn
                          ? "bg-emerald-500 text-black rounded-br-none font-medium"
                          : "bg-neutral-800/60 text-white rounded-bl-none"
                      }`}
                    >
                      {!isOwn && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                            @{anonymousName}
                          </span>
                          {user && user.id !== message.user_id && (
                            <button
                              onClick={() => toggleFollow(message.user_id)}
                              className={twMerge(
                                "text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border transition-all",
                                followingIds.has(message.user_id)
                                  ? "text-neutral-500 border-white/5 bg-white/5 hover:border-red-500/20 hover:text-red-500"
                                  : "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-black"
                              )}
                            >
                              {followingIds.has(message.user_id) ? 'Linked' : 'Link Signal'}
                            </button>
                          )}
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-[8px] text-neutral-600 mt-1 font-bold tracking-tight uppercase px-1">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-8 bg-neutral-900/50 backdrop-blur-3xl border-t border-white/5 relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-x-4 bg-neutral-800/80 p-2 rounded-full border border-white/5 focus-within:border-emerald-500/30 transition-all duration-300 shadow-2xl">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="How are you really doing?"
            aria-label="Chat message"
            className="flex-1 bg-transparent text-white px-6 py-2 rounded-full outline-none placeholder:text-neutral-500 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="bg-emerald-500 text-white p-4 rounded-full hover:bg-emerald-600 transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            <HiPaperAirplane className="rotate-90 translate-x-[2px]" size={20} />
          </button>
        </form>
      </div>

      {/* Decorative background blurs */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

export default GlobalChatPage;
