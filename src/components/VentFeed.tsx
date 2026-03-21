"use client";

import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import ReplyForm from "./ReplyForm";
import { motion, AnimatePresence } from "framer-motion";
import { RiBubbleChartLine, RiChatFollowUpFill, RiHeart2Line, RiHeart2Fill, RiUserFollowLine, RiGlobalLine, RiHandHeartLine } from "react-icons/ri";
import { HiChatBubbleOvalLeftEllipsis, HiSparkles, HiArrowTrendingUp, HiOutlineFaceSmile, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Resonate' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '🔥', label: 'Burn' },
];

const ReplyItem = ({ 
  reply, 
  allReplies, 
  user, 
  view, 
  toggleReplyReaction, 
  ventId,
  level = 0 
}: any) => {
  const [isReplying, setIsReplying] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  const replyAnonymousName = reply.user_id ? `Anonymous-${reply.user_id.slice(-4)}` : "Anonymous-0000";
  const replyDisplayName = (view === "Following") && reply.profiles?.username 
    ? `@${reply.profiles.username}` 
    : replyAnonymousName;
  
  const totalReplyReactions = reply.reply_reactions?.length || 0;
  const userReplyReaction = reply.reply_reactions?.find((r: any) => r.user_id === user?.id);
  const reactionCounts = reply.reply_reactions?.reduce((acc: any, r: any) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const childReplies = allReplies.filter((r: any) => r.parent_reply_id === reply.id);

  return (
    <div className={twMerge(
      "flex flex-col gap-y-2 group/reply relative",
      level > 0 ? "ml-4 pl-4 border-l border-white/5 mt-2" : "mt-4"
    )}>
      {/* Visual Nesting Guide */}
      {level > 0 && (
        <div className="absolute left-0 top-3 w-3 h-[1px] bg-white/10" />
      )}

      <div className="flex flex-col gap-y-1">
        <div className="flex items-center gap-x-2">
          <span className={twMerge(
            "text-[10px] font-black italic uppercase transition-colors",
            level === 0 ? "text-emerald-500" : "text-emerald-500/70 group-hover/reply:text-emerald-500"
          )}>
            {replyDisplayName}
          </span>
          <span className="text-[7px] text-neutral-700 font-mono">
            {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className={twMerge(
          "leading-relaxed transition-colors",
          level === 0 ? "text-xs text-neutral-400" : "text-[11px] text-neutral-500 group-hover/reply:text-neutral-400"
        )}>
          {reply.content}
        </p>
        
        <div className="flex items-center gap-x-3 mt-1 relative">
           <div className="flex items-center gap-x-1">
             <button 
              onMouseEnter={() => setShowReactions(true)}
              onClick={() => toggleReplyReaction(reply.id, 'like')}
              className={twMerge(
                "text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-x-1 px-1.5 py-0.5 rounded-md",
                userReplyReaction ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-neutral-600 hover:text-neutral-400 bg-white/5"
              )}
             >
                {userReplyReaction ? REACTION_TYPES.find(r => r.type === userReplyReaction.type)?.emoji : 'Resonate'}
                {totalReplyReactions > 0 && <span className={userReplyReaction ? "text-black/70" : "text-emerald-500/70"}>{totalReplyReactions}</span>}
             </button>

             {/* Reaction Picker for Reply */}
             <AnimatePresence>
                {showReactions && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    onMouseLeave={() => setShowReactions(false)}
                    className="absolute bottom-full left-0 mb-2 p-1 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl flex items-center gap-x-0.5 z-50"
                  >
                    {REACTION_TYPES.map((rt) => (
                      <button
                        key={rt.type}
                        onClick={() => {
                          toggleReplyReaction(reply.id, rt.type);
                          setShowReactions(false);
                        }}
                        className={twMerge(
                          "w-7 h-7 flex items-center justify-center text-sm hover:bg-white/5 rounded-lg transition-all hover:scale-125",
                          userReplyReaction?.type === rt.type ? "bg-emerald-500/20" : ""
                        )}
                        title={rt.label}
                      >
                        {rt.emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
             </AnimatePresence>
           </div>

           <button 
            onClick={() => setIsReplying(!isReplying)}
            className={twMerge(
              "text-[8px] font-black uppercase tracking-widest transition-all px-1.5 py-0.5 rounded-md bg-white/5",
              isReplying ? "text-emerald-500" : "text-neutral-600 hover:text-neutral-400"
            )}
           >
              {isReplying ? 'Cancel' : 'Reply'}
           </button>

           {/* Small reaction icons display */}
           <div className="flex items-center gap-x-0.5 ml-auto">
             {REACTION_TYPES.map(rt => reactionCounts?.[rt.type] > 0 && (
               <span key={rt.type} className="text-[8px]" title={`${reactionCounts[rt.type]} ${rt.label}`}>
                 {rt.emoji}
               </span>
             ))}
           </div>
        </div>
      </div>

      {/* Reply Form for this specific reply */}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 mb-2">
              <ReplyForm 
                vent_id={ventId} 
                parent_reply_id={reply.id} 
                onSuccess={() => setIsReplying(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recursive Child Replies */}
      {childReplies.length > 0 && (
        <div className="flex flex-col">
          {childReplies.map((child: any) => (
            <ReplyItem 
              key={child.id} 
              reply={child} 
              allReplies={allReplies} 
              user={user} 
              view={view} 
              toggleReplyReaction={toggleReplyReaction}
              ventId={ventId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const VentCard = memo(({ 
  vent, 
  user, 
  isActive, 
  reactionPickerId, 
  setReactionPickerId, 
  toggleReaction,
  router,
  isFollowing,
  isFollower,
  toggleFollow,
  view,
  supabase
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const anonymousName = vent.user_id ? `Anonymous-${vent.user_id.slice(-4)}` : "Anonymous-0000";
  // Strict identity logic: 
  // 1. If view is "Following", show @username
  // 2. If view is "Global", always show Anonymous-xxxx (even for yourself, to maintain collective feel)
  const displayName = (view === "Following") && vent.profiles?.username 
    ? `@${vent.profiles.username}` 
    : anonymousName;

  const userReaction = vent.vent_reactions?.find((r: any) => r.user_id === user?.id);
  const reactionCounts = vent.vent_reactions?.reduce((acc: any, r: any) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});
  const totalReactions = vent.vent_reactions?.length || 0;
  const isFriend = isFollowing && isFollower;

  const fetchReplies = async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    const { data, error } = await supabase
      .from('replies')
      .select('*, profiles(username, avatar_url), reply_reactions(id, user_id, type)')
      .eq('vent_id', vent.id)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setReplies(data);
    }
    setLoadingReplies(false);
  };

  const toggleReplyReaction = async (replyId: string, type: string) => {
    if (!user) {
      router.push('/');
      return;
    }

    const reply = replies.find(r => r.id === replyId);
    const existingReaction = reply?.reply_reactions?.find((r: any) => r.user_id === user.id);

    if (existingReaction && existingReaction.type === type) {
      const { error } = await supabase
        .from('reply_reactions')
        .delete()
        .eq('reply_id', replyId)
        .eq('user_id', user.id);
      
      if (!error) {
        setReplies(prev => prev.map(r => r.id === replyId ? {
          ...r,
          reply_reactions: r.reply_reactions.filter((rx: any) => rx.user_id !== user.id)
        } : r));
      }
    } else {
      const { data, error } = await supabase
        .from('reply_reactions')
        .upsert(
          { reply_id: replyId, user_id: user.id, type },
          { onConflict: 'reply_id,user_id' }
        )
        .select()
        .single();
      
      if (!error && data) {
        setReplies(prev => prev.map(r => r.id === replyId ? {
          ...r,
          reply_reactions: [
            ...(Array.isArray(r.reply_reactions) ? r.reply_reactions.filter((rx: any) => rx.user_id !== user.id) : []),
            data
          ]
        } : r));
      }
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchReplies();
      
      const channel = supabase
        .channel(`replies-${vent.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'replies',
          filter: `vent_id=eq.${vent.id}`
        }, async (payload: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();
          
          setReplies(prev => [...prev, { ...payload.new, profiles: profile, reply_reactions: [] }]);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reply_reactions'
        }, async (payload: any) => {
          // Simplest is to refetch or manually update
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
             setReplies(prev => prev.map(r => r.id === payload.new.reply_id ? {
               ...r,
               reply_reactions: [
                 ...(Array.isArray(r.reply_reactions) ? r.reply_reactions.filter((rx: any) => rx.user_id !== payload.new.user_id) : []),
                 payload.new
               ]
             } : r));
          } else if (payload.eventType === 'DELETE') {
             setReplies(prev => prev.map(r => ({
               ...r,
               reply_reactions: Array.isArray(r.reply_reactions) 
                ? r.reply_reactions.filter((rx: any) => rx.id !== payload.old.id) 
                : []
             })));
          }
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isExpanded, vent.id]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="relative group"
    >
      {/* Desktop Card */}
      <div className={twMerge(
          "hidden md:flex flex-col rounded-[1.5rem] transition-all duration-500 overflow-hidden relative border",
          isActive || isExpanded
            ? "bg-black border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20" 
            : "bg-neutral-900/40 border-white/5 hover:border-emerald-500/10 shadow-xl hover:bg-neutral-900/60"
      )}>
          <div className="flex flex-col p-5 gap-y-3 relative z-10">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-2.5">
                     <div className="w-8 h-8 rounded-lg bg-neutral-800 text-emerald-500 border border-white/5 flex items-center justify-center text-sm font-black italic uppercase">
                        {displayName.charAt(displayName.startsWith('@') ? 1 : 0)}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-white text-sm font-black italic uppercase tracking-tighter">
                          {displayName}
                        </span>
                        {isFollower && !isFollowing && (
                          <span className="text-[8px] font-bold text-emerald-500/50 uppercase tracking-widest">Follows you</span>
                        )}
                        {isFriend && (
                          <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-x-1">
                            <HiSparkles size={8} /> Neural Friends
                          </span>
                        )}
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-x-2">
                    {user && user.id !== vent.user_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow(vent.user_id);
                        }}
                        className={twMerge(
                          "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                          isFollowing 
                            ? "bg-white/5 text-neutral-500 border-white/5 hover:border-red-500/30 hover:text-red-500" 
                            : "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20 hover:scale-105"
                        )}
                      >
                        {isFollowing ? 'Disconnect' : 'Connect'}
                      </button>
                    )}
                    <div className="text-neutral-700 px-3 py-1 rounded-full border border-white/5 text-[7px] font-mono uppercase">
                       {new Date(vent.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }).toUpperCase()}
                    </div>
                  </div>
              </div>

              <div className="text-left text-neutral-200 font-medium leading-[1.4] text-[15px]">
                {vent.content}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                   <div className="flex items-center gap-x-3">
                       <div className="flex flex-col">
                           <div className="flex items-center gap-x-1.5">
                               <p className="text-[8px] font-black uppercase tracking-widest text-neutral-600">Resonance</p>
                               {totalReactions > 0 && (
                                   <span className="text-[9px] font-black text-emerald-500/80">{totalReactions}</span>
                               )}
                           </div>
                           <div className="flex items-center gap-x-1 mt-0.5">
                                {REACTION_TYPES.map((rt) => (
                                    reactionCounts?.[rt.type] > 0 && (
                                        <span key={rt.type} className="text-[10px]" title={rt.label}>{rt.emoji}</span>
                                    )
                                ))}
                                {totalReactions === 0 && [1,2,3,4,5].map(i => (
                                    <div key={i} className="w-0.5 h-0.5 rounded-full bg-neutral-800" />
                                ))}
                           </div>
                       </div>
                   </div>

                   <div className="flex items-center gap-x-2 relative">
                        <AnimatePresence>
                            {reactionPickerId === vent.id && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute bottom-full right-0 mb-3 p-2 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex items-center gap-x-1 z-50"
                                >
                                    {REACTION_TYPES.map((rt) => (
                                        <button
                                            key={rt.type}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleReaction(vent.id, rt.type, userReaction);
                                            }}
                                            className={twMerge(
                                                "w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:bg-white/5 transition-all hover:scale-125 active:scale-90",
                                                userReaction?.type === rt.type ? "bg-emerald-500/20" : ""
                                            )}
                                            title={rt.label}
                                        >
                                            {rt.emoji}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reply Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                          }}
                          className={twMerge(
                            "flex items-center gap-x-2 h-9 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-300",
                            isExpanded ? "bg-white/10 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white"
                          )}
                        >
                          <HiChatBubbleOvalLeftEllipsis size={14} className={isExpanded ? "text-emerald-500" : ""} />
                          <span>Reply</span>
                        </button>

                        {/* DM Button - Only for friends */}
                        {isFriend && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/chat/dm?user=${vent.user_id}`);
                            }}
                            className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all border border-white/5 shadow-lg active:scale-90"
                            title="Send Signal (Friend)"
                          >
                            <HiOutlineChatBubbleLeftRight size={18} />
                          </button>
                        )}

                        <button
                          onMouseEnter={() => setReactionPickerId(vent.id)}
                          onClick={() => toggleReaction(vent.id, 'like', userReaction)}
                          className={twMerge(
                            "flex items-center gap-x-2 h-9 px-4 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-500",
                            userReaction ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-neutral-800 text-emerald-500 hover:bg-neutral-700"
                          )}
                        >
                          {userReaction ? REACTION_TYPES.find(r => r.type === userReaction.type)?.emoji : <RiHandHeartLine size={14} />}
                          <span>{userReaction ? REACTION_TYPES.find(r => r.type === userReaction.type)?.label : 'Resonate'}</span>
                        </button>
                   </div>
              </div>

              {/* Replies Section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 flex flex-col gap-y-4">
                      {/* Top-level Reply Form */}
                      <div className="mb-2">
                        <ReplyForm vent_id={vent.id} />
                      </div>

                      {/* Threaded Replies List */}
                      <div className="flex flex-col gap-y-3 pl-4 border-l border-white/5">
                        {replies.filter(r => !r.parent_reply_id).map((reply) => (
                          <ReplyItem 
                            key={reply.id} 
                            reply={reply} 
                            allReplies={replies} 
                            user={user} 
                            view={view} 
                            toggleReplyReaction={toggleReplyReaction}
                            ventId={vent.id}
                          />
                        ))}
                        {loadingReplies && (
                          <div className="animate-pulse flex space-x-2 items-center py-4">
                            <div className="h-1.5 w-1.5 bg-emerald-500/50 rounded-full" />
                            <div className="h-1.5 w-1.5 bg-emerald-500/50 rounded-full delay-75" />
                            <div className="h-1.5 w-1.5 bg-emerald-500/50 rounded-full delay-150" />
                          </div>
                        )}
                        {!loadingReplies && replies.length === 0 && (
                          <p className="text-[9px] text-neutral-700 italic uppercase tracking-widest py-2">No signals received yet...</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
      </div>

      {/* Mobile Card */}
      <div className={twMerge(
        "md:hidden flex flex-col p-5 bg-neutral-900/60 rounded-2xl border border-white/5 gap-y-3 relative transition-all duration-300",
        isExpanded ? "ring-1 ring-emerald-500/30" : ""
      )}>
          <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest italic">{displayName}</span>
                {isFriend && <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-tighter">Neural Friend</span>}
              </div>
              <span className="text-[8px] text-neutral-700 font-mono uppercase">{new Date(vent.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="text-neutral-200 text-sm leading-relaxed">{vent.content}</p>
          
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-x-3">
                <div className="flex items-center gap-x-1.5">
                    {REACTION_TYPES.slice(0, 3).map((rt) => (
                        reactionCounts?.[rt.type] > 0 && (
                            <span key={rt.type} className="text-[10px]">{rt.emoji}</span>
                        )
                    ))}
                    {totalReactions > 0 && (
                        <span className="text-[9px] font-black text-neutral-500">{totalReactions}</span>
                    )}
                </div>
                {user && user.id !== vent.user_id && (
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(vent.user_id);
                    }}
                    className={twMerge(
                      "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border transition-all",
                      isFollowing ? "text-neutral-500 border-white/5" : "text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
                    )}
                  >
                    {isFollowing ? 'Unlink' : 'Link'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-x-2 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className={twMerge(
                      "p-1.5 rounded-lg border transition-all",
                      isExpanded ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500" : "bg-white/5 border-white/5 text-neutral-500"
                    )}
                  >
                    <HiChatBubbleOvalLeftEllipsis size={14} />
                  </button>

                  {isFriend && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/chat/dm?user=${vent.user_id}`);
                      }}
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 active:scale-90"
                    >
                      <HiOutlineChatBubbleLeftRight size={14} />
                    </button>
                  )}
                  
                  <div className="relative">
                    <AnimatePresence>
                        {reactionPickerId === vent.id && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-full right-0 mb-2 p-1.5 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl flex items-center gap-x-1 z-50"
                            >
                                {REACTION_TYPES.map((rt) => (
                                     <button
                                         key={rt.type}
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             toggleReaction(vent.id, rt.type, userReaction);
                                         }}
                                         className="w-8 h-8 flex items-center justify-center text-lg active:scale-125"
                                     >
                                         {rt.emoji}
                                     </button>
                                 ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                      onContextMenu={(e) => {
                          e.preventDefault();
                          setReactionPickerId(vent.id);
                      }}
                      onClick={() => toggleReaction(vent.id, 'like', userReaction)} 
                      className={twMerge(
                          "flex items-center gap-x-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                          userReaction ? "bg-emerald-500 text-black" : "text-neutral-600 bg-white/5"
                      )}
                    >
                        {userReaction ? REACTION_TYPES.find(r => r.type === userReaction.type)?.emoji : <RiHandHeartLine size={12} />}
                        <span>{userReaction ? REACTION_TYPES.find(r => r.type === userReaction.type)?.label : 'Resonate'}</span>
                    </button>
                  </div>
              </div>
          </div>

          {/* Mobile Replies Section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="flex flex-col gap-y-4">
                   <div className="flex flex-col gap-y-3 pl-3 border-l-2 border-emerald-500/20">
                      {replies.filter(r => !r.parent_reply_id).map((reply) => (
                        <ReplyItem 
                          key={reply.id} 
                          reply={reply} 
                          allReplies={replies} 
                          user={user} 
                          view={view} 
                          toggleReplyReaction={toggleReplyReaction}
                          ventId={vent.id}
                        />
                      ))}
                      {loadingReplies && <div className="h-4 w-20 bg-neutral-800 animate-pulse rounded" />}
                   </div>
                   <ReplyForm vent_id={vent.id} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </motion.div>
  );
});

/**
 * Super-Premium Experimental VentFeed
 * 
 * Features:
 * - High-speed real-time social updates.
 * - 'Neural Grid' responsive masonry-style cards.
 * - Shimmering borders with custom emotional resonance glows.
 * - Orbiting Mini-Bubbles for mobile (Reply visualization).
 * - Layered social snippets with avatar initial stacks.
 */
const VentFeed = () => {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const router = useRouter();
  const [vents, setVents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVentId, setActiveVentId] = useState<string | null>(null);
  const [reactionPickerId, setReactionPickerId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followerIds, setFollowerIds] = useState<string[]>([]);

  const [selectedEmotion, setSelectedEmotion] = useState<string>("All");
  const [view, setView] = useState<"All" | "Following">("All");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const handleClickAway = () => setReactionPickerId(null);
    window.addEventListener('click', handleClickAway);
    return () => window.removeEventListener('click', handleClickAway);
  }, []);

  const toggleReaction = useCallback(async (ventId: string, type: string, existingReaction?: any) => {
    if (!user) {
      router.push('/');
      return;
    }

    if (existingReaction && existingReaction.type === type) {
      const { error } = await supabase
        .from('vent_reactions')
        .delete()
        .eq('vent_id', ventId)
        .eq('user_id', user.id);
      
      if (!error) {
        setVents(prev => prev.map(v => v.id === ventId ? {
          ...v,
          vent_reactions: v.vent_reactions.filter((r: any) => r.user_id !== user.id)
        } : v));
      }
    } else {
      const { data, error } = await supabase
        .from('vent_reactions')
        .upsert(
          { vent_id: ventId, user_id: user.id, type },
          { onConflict: 'vent_id,user_id' }
        )
        .select()
        .single();
      
      if (!error && data) {
        setVents(prev => prev.map(v => v.id === ventId ? {
          ...v,
          vent_reactions: [
            ...(Array.isArray(v.vent_reactions) ? v.vent_reactions.filter((r: any) => r.user_id !== user.id) : []),
            data
          ]
        } : v));
      }
    }
    setReactionPickerId(null);
  }, [user, supabase, router]);

  const toggleFollow = useCallback(async (targetId: string) => {
    if (!user) {
      router.push('/');
      return;
    }

    const isCurrentlyFollowing = followingIds.includes(targetId);

    if (isCurrentlyFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetId);
      
      if (!error) {
        setFollowingIds(prev => prev.filter(id => id !== targetId));
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: user.id, following_id: targetId }]);
      
      if (!error) {
        setFollowingIds(prev => [...prev, targetId]);
      }
    }
  }, [user, followingIds, supabase, router]);

  const fetchVents = useCallback(async (pageNum = 0) => {
    if (pageNum === 0) setLoading(true);
    else setIsFetchingMore(true);

    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = (supabase as any)
      .from('vents')
      .select(`
        *,
        profiles (username),
        vent_reactions (id, user_id, type)
      `);

    if (view === "Following" && user) {
      const { data: followed } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followedIds = followed?.map(f => f.following_id) || [];
      query = query.in('user_id', [...followedIds, user.id]);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (!error && data) {
      if (data.length < ITEMS_PER_PAGE) setHasMore(false);
      
      if (pageNum === 0) {
        setVents(data);
      } else {
        setVents(prev => [...prev, ...data]);
      }
    }
    setLoading(false);
    setIsFetchingMore(false);
  }, [supabase, view, user]);

  const emotionOptions = useMemo(() => Array.from(
    new Set(
      vents
        .map((v) => v.emotion)
        .filter((e) => typeof e === "string" && e.trim().length > 0)
    )
  ).slice(0, 6), [vents]);

  const filteredVents = useMemo(() => selectedEmotion === "All"
    ? vents
    : vents.filter((v) => v.emotion === selectedEmotion), [selectedEmotion, vents]);

  // If the user filters the feed away from the currently expanded vent, collapse it.
  useEffect(() => {
    if (!activeVentId) return;
    const stillVisible = filteredVents.some((v) => v.id === activeVentId);
    if (!stillVisible) setActiveVentId(null);
  }, [selectedEmotion, vents]);

  useEffect(() => {
    fetchVents(0);
    setPage(0);
    setHasMore(true);

    const fetchFollowData = async () => {
      if (!user) return;
      
      const [following, followers] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        supabase.from('follows').select('follower_id').eq('following_id', user.id)
      ]);

      if (!following.error && following.data) {
        setFollowingIds(following.data.map(f => f.following_id));
      }
      if (!followers.error && followers.data) {
        setFollowerIds(followers.data.map(f => f.follower_id));
      }
    };

    fetchFollowData();

    const channel = supabase
      .channel('neural-feed-v4')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vents' }, async (p) => {
           const { data: profile } = await supabase.from('profiles').select('username').eq('id', p.new.user_id).single();
           setVents(prev => [{ ...p.new, profiles: profile, vent_reactions: [] }, ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vent_reactions' }, (p) => {
           setVents(prev => prev.map(v => v.id === p.new.vent_id ? {
             ...v,
             vent_reactions: [
               ...(Array.isArray(v.vent_reactions) ? v.vent_reactions.filter((r: any) => r.user_id !== p.new.user_id) : []),
               p.new
             ]
           } : v));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vent_reactions' }, (p) => {
           setVents(prev => prev.map(v => v.id === p.new.vent_id ? {
             ...v,
             vent_reactions: [
               ...(Array.isArray(v.vent_reactions) ? v.vent_reactions.filter((r: any) => r.user_id !== p.new.user_id) : []),
               p.new
             ]
           } : v));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'vent_reactions' }, (p) => {
           if (p.old && p.old.vent_id) {
             setVents(prev => prev.map(v => v.id === p.old.vent_id ? {
               ...v,
               vent_reactions: Array.isArray(v.vent_reactions) 
                ? v.vent_reactions.filter((r: any) => r.user_id !== p.old.user_id) 
                : []
             } : v));
           } else if (p.old && p.old.id) {
             setVents(prev => prev.map(v => ({
               ...v,
               vent_reactions: Array.isArray(v.vent_reactions) 
                ? v.vent_reactions.filter((r: any) => r.id !== p.old.id) 
                : []
             })));
           }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, view, user, fetchVents]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading || isFetchingMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchVents(nextPage);
          return nextPage;
        });
      }
    }, { threshold: 0.1 });

    const target = document.querySelector('#infinite-scroll-trigger');
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, loading, isFetchingMore, fetchVents]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 shadow-2xl"></div>
      </div>
    );
  }

  if (vents.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-neutral-900/40 rounded-[3rem] border border-dashed border-white/5 opacity-50">
        <RiBubbleChartLine size={64} className="text-emerald-500 mb-4 animate-bounce-slow" />
        <p className="text-neutral-500 font-black uppercase tracking-widest text-xs italic">The neural link is currently silent...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4 md:gap-y-4 p-4 lg:p-6 pb-24 max-w-[700px] mx-auto">
      {/* View Switcher */}
      {user && (
        <div className="flex items-center gap-x-2 bg-neutral-900/40 p-1.5 rounded-2xl border border-white/5 w-fit mb-2">
          <button
            onClick={() => setView("All")}
            className={twMerge(
              "flex items-center gap-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              view === "All" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-neutral-500 hover:text-white"
            )}
          >
            <RiGlobalLine size={14} />
            Global
          </button>
          <button
            onClick={() => setView("Following")}
            className={twMerge(
              "flex items-center gap-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              view === "Following" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-neutral-500 hover:text-white"
            )}
          >
            <RiUserFollowLine size={14} />
            Following
          </button>
        </div>
      )}

      {/* Premium Emotion Filter Bar */}
      <div className="flex items-center gap-x-4 overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex items-center gap-x-2 shrink-0">
          <HiArrowTrendingUp className="text-emerald-500" size={16} />
          <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Resonance:</span>
        </div>
        
        <div className="flex items-center gap-x-2">
          <button
            onClick={() => setSelectedEmotion("All")}
            className={twMerge(
              "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 border whitespace-nowrap",
              selectedEmotion === "All"
                ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "bg-white/5 text-neutral-500 border-white/5 hover:border-emerald-500/30 hover:text-white"
            )}
          >
            All Frequencies
          </button>
          
          {emotionOptions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => setSelectedEmotion(emotion)}
              className={twMerge(
                "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 border whitespace-nowrap",
                selectedEmotion === emotion
                  ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "bg-white/5 text-neutral-500 border-white/5 hover:border-emerald-500/30 hover:text-white"
              )}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredVents.map((vent, index) => (
          <VentCard
            key={vent.id}
            vent={vent}
            user={user}
            isActive={activeVentId === vent.id}
            reactionPickerId={reactionPickerId}
            setReactionPickerId={setReactionPickerId}
            toggleReaction={toggleReaction}
            router={router}
            isFollowing={followingIds.includes(vent.user_id)}
            isFollower={followerIds.includes(vent.user_id)}
            toggleFollow={toggleFollow}
            view={view}
            supabase={supabase}
          />
        ))}
      </AnimatePresence>

      {/* Infinite Scroll Trigger */}
      <div id="infinite-scroll-trigger" className="h-20 flex items-center justify-center">
        {isFetchingMore && (
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-emerald-500/50"></div>
        )}
        {!hasMore && vents.length > 0 && (
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-700">All resonant echoes captured</p>
        )}
      </div>
    </div>
  );
};

export default VentFeed;
