"use client";

import { useEffect, useState, useRef, Suspense, memo, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useSupabase } from "@/hooks/useSupabase";
import Header from "@/components/layout/Header";
import { motion, AnimatePresence } from "framer-motion";
import { HiPaperAirplane, HiOutlineArrowLeft, HiOutlineUserCircle, HiMagnifyingGlass, HiSparkles } from "react-icons/hi2";
import { RiUserHeartLine, RiSearchLine, RiChatHeartLine } from "react-icons/ri";
import { twMerge } from "tailwind-merge";
import { apiGet, apiPost } from "@/utils/logger";

interface Message {
  id: string;
  created_at: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  unread_count: number;
  has_conversation: boolean;
}

const MessageItem = memo(({ message, isOwn, displayName, isFollowing, onToggleFollow }: { message: Message, isOwn: boolean, displayName: string, isFollowing: boolean, onToggleFollow: (id: string) => void }) => (
  <motion.div
    initial={{ scale: 0.95, opacity: 0, y: 5 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
  >
    <div className={`flex items-end gap-x-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center shrink-0 mb-1 overflow-hidden">
          {message.profiles?.avatar_url ? (
            <img src={message.profiles.avatar_url} alt={message.profiles.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-black text-emerald-500 uppercase">{displayName.charAt(0)}</span>
          )}
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
              @{displayName}
            </span>
            {onToggleFollow && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollow(message.sender_id);
                }}
                className={`text-[7px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border transition-all ${
                  isFollowing 
                    ? "text-neutral-500 border-white/5 bg-white/5" 
                    : "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-black"
                }`}
              >
                {isFollowing ? 'Linked' : 'Link Signal'}
              </button>
            )}
          </div>
        )}
        <p className="text-sm leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
    
    <p className="text-[8px] text-neutral-600 mt-1 font-bold tracking-tight uppercase px-1 flex items-center justify-between w-full">
      <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </p>
  </motion.div>
));

MessageItem.displayName = "MessageItem";

const DirectMessageContent = () => {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [isFollowingTarget, setIsFollowingTarget] = useState(false);

  const toggleFollow = async (tid: string) => {
    if (!user) return;
    try {
      await apiPost('/api/dm/toggle-follow', { follower_id: user.id, following_id: tid });
      if (tid === targetUserId) setIsFollowingTarget(prev => !prev);
      // Refresh friends list to update follow status
      fetchFriendsData();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<"neural" | "requests">("neural");

  // Tab State Persistence (Task 12)
  useEffect(() => {
    const savedTab = localStorage.getItem('dm_active_tab');
    if (savedTab === "neural" || savedTab === "requests") setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem('dm_active_tab', activeTab);
  }, [activeTab]);
  const [searchFriend, setSearchFriend] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [isNewFriend, setIsNewFriend] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MESSAGES_PER_PAGE = 20;

  // Fetch Neural Friends (Mutual Follows) and Message Requests
  const fetchFriendsData = useCallback(async () => {
    if (!user) return;
    setLoadingFriends(true);

    try {
      const result = await apiGet<{ friends: Friend[]; requests: Friend[] }>('/api/dm/friends', { 
        params: { user_id: user.id } 
      });
      setFriends(result.friends);
      setRequests(result.requests);
    } catch (error) {
      console.error('Error fetching friends data:', error);
    } finally {
      setLoadingFriends(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriendsData();

    // Realtime listener — only listen for INSERT to avoid refetching on every read-status update
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel('dm-inbox-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        () => {
          // Debounce to avoid rapid-fire refetches
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => fetchFriendsData(), 500);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user, supabase, fetchFriendsData]);

  useEffect(() => {
    if (targetUserId && user) {
      const fetchTargetProfile = async () => {
        try {
          const [profileData, followStatusData, isNewFriendData] = await Promise.all([
            apiGet('/api/dm/profile', { params: { user_id: targetUserId } }),
            apiGet('/api/dm/follow-status', { params: { user_id: user.id, target_id: targetUserId } }),
            apiGet('/api/dm/new-friend-check', { params: { user_id: user.id, target_id: targetUserId } })
          ]);
          
          setTargetProfile(profileData);
          setIsFollowingTarget(followStatusData.isFollowing);
          setIsNewFriend(isNewFriendData.isNewFriend);
        } catch (error) {
          console.error('Error fetching target profile data:', error);
        }
      };
      fetchTargetProfile();
    }
  }, [targetUserId, user]);

  const fetchMessages = async (offset = 0) => {
    if (!user || !targetUserId) return;
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const result = await apiGet<{ data: Message[]; hasMore: boolean }>('/api/dm', {
        params: {
          user_id: user.id,
          target_id: targetUserId,
          offset,
          limit: MESSAGES_PER_PAGE
        }
      });

      if (offset === 0) {
        setMessages(result.data);
      } else {
        setMessages(prev => [...result.data, ...prev]);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user && targetUserId) {
      fetchMessages(0);

      const channelName = `dm-${user.id}-${targetUserId}`;
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "direct_messages" },
          async (payload) => {
            const isRelevant = 
              (payload.new.sender_id === user.id && payload.new.receiver_id === targetUserId) ||
              (payload.new.sender_id === targetUserId && payload.new.receiver_id === user.id);
            
            if (!isRelevant) return;

            const { data: profile } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", payload.new.sender_id)
              .single();

            const newMsg: Message = {
              id: payload.new.id,
              created_at: payload.new.created_at,
              content: payload.new.content,
              sender_id: payload.new.sender_id,
              receiver_id: payload.new.receiver_id,
              profiles: profile,
            };

            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [supabase, targetUserId, user]);

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

  const handleSubmit = async (e?: React.FormEvent, contentOverride?: string) => {
    if (e) e.preventDefault();
    const content = contentOverride || newMessage;
    if (!user || !targetUserId || !content.trim()) return;

    try {
      await apiPost('/api/dm', {
        sender_id: user.id,
        receiver_id: targetUserId,
        content
      });
      
      if (!contentOverride) setNewMessage("");
      setIsNewFriend(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredFriends = useMemo(() => friends.filter(f => 
    f.username.toLowerCase().includes(searchFriend.toLowerCase())
  ), [friends, searchFriend]);

  const filteredRequests = useMemo(() => requests.filter(f => 
    f.username.toLowerCase().includes(searchFriend.toLowerCase())
  ), [requests, searchFriend]);

  const currentList = useMemo(() => activeTab === "neural" ? filteredFriends : filteredRequests, [activeTab, filteredFriends, filteredRequests]);

  if (!targetUserId) {
    return (
      <div className="bg-neutral-900 rounded-[3rem] h-full w-full flex flex-col overflow-hidden border border-white/5 shadow-2xl relative">
        <Header className="bg-gradient-to-b from-neutral-800 to-black p-8 pb-4">
          <div className="flex flex-col">
            <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
              Signal <span className="text-emerald-500 underline decoration-emerald-500/10">Inbox</span>
            </h1>
            <p className="text-neutral-400 mt-2 font-medium">Neural connections established.</p>
          </div>
        </Header>

        {/* Tab Switcher */}
        <div className="px-8 mt-6 flex items-center gap-x-6 border-b border-white/5 mb-4">
           <button 
            onClick={() => setActiveTab("neural")}
            className={twMerge(
              "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === "neural" ? "text-emerald-500" : "text-neutral-600 hover:text-neutral-400"
            )}
           >
             Neural Links
             {activeTab === "neural" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
           </button>
           <button 
            onClick={() => setActiveTab("requests")}
            className={twMerge(
              "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-x-2",
              activeTab === "requests" ? "text-emerald-500" : "text-neutral-600 hover:text-neutral-400"
            )}
           >
             Requests
             {requests.length > 0 && <span className="bg-emerald-500 text-black text-[8px] px-1.5 py-0.5 rounded-full">{requests.length}</span>}
             {activeTab === "requests" && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
           </button>
        </div>

        <div className="px-8 pt-2 pb-6">
           <div className="relative group">
              <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="text"
                placeholder={activeTab === "neural" ? "Search neural friends..." : "Search requests..."}
                value={searchFriend}
                onChange={(e) => setSearchFriend(e.target.value)}
                className="w-full bg-neutral-950/50 border border-white/5 rounded-2xl p-4 pl-12 text-sm outline-none focus:border-emerald-500/30 transition-all placeholder:text-neutral-700"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-2 scrollbar-hide">
           {loadingFriends ? (
             <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
             </div>
           ) : currentList.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <RiUserHeartLine size={48} className="text-neutral-800" />
                <p className="text-neutral-600 text-xs font-black uppercase tracking-widest italic">
                   {activeTab === "neural" ? "No neural links detected." : "No incoming signals detected."}
                </p>
                {activeTab === "neural" && (
                  <button 
                    onClick={() => router.push('/search')}
                    className="bg-white/5 text-emerald-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/10 hover:bg-emerald-500 hover:text-black transition-all"
                  >
                    Find Friends
                  </button>
                )}
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentList.map((friend, i) => {
                  const isNew = (new Date().getTime() - new Date(friend.created_at).getTime()) < 86400000 && !friend.has_conversation;
                  return (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group p-4 bg-neutral-950/40 hover:bg-neutral-800/60 border border-white/5 rounded-2xl flex items-center gap-x-4 transition-all text-left relative overflow-hidden"
                    >
                      <button 
                        onClick={() => router.push(`/chat/dm?user=${friend.id}`)}
                        className="flex items-center gap-x-4 flex-1 min-w-0"
                      >
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center border border-white/5 overflow-hidden">
                            {friend.avatar_url ? (
                              <img src={friend.avatar_url} alt={friend.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-emerald-500 font-black italic">{friend.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {friend.unread_count > 0 && (
                            <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-emerald-500 text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-lg ring-2 ring-neutral-900 z-10">
                              {friend.unread_count}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-x-2">
                            <span className="text-white text-sm font-black uppercase tracking-tighter truncate">@{friend.username}</span>
                            {isNew && activeTab === "neural" && (
                              <span className="bg-emerald-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter animate-pulse shrink-0">New</span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 font-medium italic mt-0.5 truncate text-left">
                            {activeTab === "requests" 
                              ? "Wants to establish a neural link..." 
                              : isNew 
                                ? `Greet your new friend!` 
                                : friend.unread_count > 0 
                                  ? `${friend.unread_count} unread signal${friend.unread_count > 1 ? 's' : ''}`
                                  : "Resume signal link..."}
                          </p>
                        </div>
                      </button>

                      {activeTab === "requests" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(friend.id);
                          }}
                          className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all z-10"
                        >
                          Link Signal
                        </button>
                      )}
                      {isNew && activeTab === "neural" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/chat/dm?user=${friend.id}`);
                          }}
                          className="bg-emerald-500 text-black px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all z-10"
                        >
                          Say Hi
                        </button>
                      )}
                      <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  );
                })}
             </div>
           )}
        </div>

        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 rounded-[3rem] h-full w-full flex flex-col overflow-hidden relative border border-white/5 shadow-2xl">
      <Header className="bg-gradient-to-b from-neutral-800 to-black p-8">
        <div className="flex items-center gap-x-6">
          <button
            onClick={() => router.push('/chat/dm')}
            className="p-4 bg-white/5 rounded-2xl text-white hover:bg-emerald-500 hover:text-black transition-all border border-white/5"
            title="Back to Inbox"
          >
            <HiOutlineArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
              Signal <span className="text-emerald-500 underline decoration-emerald-500/10">Link</span>
            </h1>
            <p className="text-neutral-400 mt-2 font-medium">
              {targetProfile ? `Private channel with @${targetProfile.username}` : "Establishing neural link..."}
            </p>
          </div>
          {targetProfile && (
             <div className="ml-auto hidden md:flex items-center gap-x-4">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Target Active</span>
                    <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest">@{targetProfile.username}</span>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    {targetProfile.avatar_url ? (
                       <img src={targetProfile.avatar_url} alt={targetProfile.username} className="w-full h-full object-cover" />
                    ) : (
                       <HiOutlineUserCircle size={24} className="text-neutral-600" />
                    )}
                 </div>
                 <button
                    onClick={() => toggleFollow(targetUserId!)}
                    className={twMerge(
                      "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                      isFollowingTarget ? "bg-white/10 text-neutral-500 border border-white/5" : "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                    )}
                 >
                   {isFollowingTarget ? 'Linked' : 'Link Signal'}
                 </button>
             </div>
          )}
        </div>
      </Header>
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-y-6 glass-scroll relative"
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
        ) : (
          <>
            {isNewFriend && messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2rem] text-center space-y-4 mb-8"
              >
                <div className="w-16 h-16 bg-emerald-500 text-black rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <HiSparkles size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-white text-xl font-black uppercase tracking-tighter italic">Neural Link Established!</h3>
                  <p className="text-neutral-500 text-sm font-medium">You and @{targetProfile?.username} are now connected.</p>
                </div>
                <button
                  onClick={() => handleSubmit(undefined, `Hey @${targetProfile?.username}! Glad to connect with you. How are you doing?`)}
                  className="bg-emerald-500 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Say Hi to your friend
                </button>
              </motion.div>
            )}

            {messages.length === 0 && !isNewFriend ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-700 space-y-4">
                <RiChatHeartLine size={48} className="opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Start your resonance with @{targetProfile?.username}...</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  const displayName = message.profiles?.username || 'unknown';

                  return (
                    <MessageItem 
                      key={message.id} 
                      message={message} 
                      isOwn={isOwn} 
                      displayName={displayName} 
                      isFollowing={isFollowingTarget}
                      onToggleFollow={toggleFollow}
                    />
                  );
                })}
              </AnimatePresence>
            )}
          </>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-8 bg-neutral-900/50 backdrop-blur-3xl border-t border-white/5 relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-x-4 bg-neutral-800/80 p-2 rounded-full border border-white/5 focus-within:border-emerald-500/30 transition-all duration-300 shadow-2xl">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Establishing neural link..."
            aria-label="Direct message"
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

const DirectMessagePage = () => {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-neutral-900 rounded-[3rem]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 shadow-2xl"></div>
      </div>
    }>
      <DirectMessageContent />
    </Suspense>
  );
};

export default DirectMessagePage;

