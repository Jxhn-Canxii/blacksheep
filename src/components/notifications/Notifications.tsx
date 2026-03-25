"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@/hooks/useUser";
import { RiNotification2Line, RiNotification2Fill, RiChatFollowUpLine, RiUserFollowLine, RiAtLine, RiMailLine } from "react-icons/ri";
import { HiHashtag } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";
import { formatTimeAgo } from "@/utils/time";
import { Notification } from "@/interfaces/types";
import { apiGet, apiPost } from "@/utils/logger";

const Notifications = () => {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    try {
      await apiPost('/api/notifications', { user_id: user!.id, action: 'mark_read', notification_id: id });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const timer = setTimeout(() => {
        notifications.forEach(n => {
          if (!n.is_read) markAsRead(n.id);
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount, notifications]);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const data = await apiGet<Notification[]>('/api/notifications', { params: { user_id: user.id } });
        setNotifications(data);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Realtime: supabase.channel() is allowed — only supabase.from() is banned in components
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
        const incoming = payload.new as Notification;
        // Append without actor detail; a subsequent fetch or page refresh will hydrate it
        setNotifications(prev => [incoming, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);


  const getIcon = (type: string) => {
    switch (type) {
      case 'reply': return <RiChatFollowUpLine size={16} className="text-emerald-500" />;
      case 'follow': return <RiUserFollowLine size={16} className="text-blue-500" />;
      case 'mention': return <RiAtLine size={16} className="text-purple-500" />;
      case 'message': return <RiMailLine size={16} className="text-orange-500" />;
      case 'group_info': return <HiHashtag size={16} className="text-emerald-500" />;
      default: return <RiNotification2Line size={16} />;
    }
  };

  const getMessage = (n: Notification) => {
    const actorName = n.actor?.username || 'Someone';
    switch (n.type) {
      case 'reply': return <span><b className="text-white">@{actorName}</b> resonated with your bubble.</span>;
      case 'follow': return <span><b className="text-white">@{actorName}</b> is now following your frequency.</span>;
      case 'mention': return <span><b className="text-white">@{actorName}</b> called your signal.</span>;
      case 'message': return <span><b className="text-white">@{actorName}</b> sent you a direct message.</span>;
      case 'group_info': return <span>Circle <b>Established</b>: <b className="text-white">{n.metadata?.name}</b>. ID: <b className="text-emerald-500 select-all cursor-pointer" title="Click to Copy">{n.metadata?.cluster_id || 'Syncing...'}</b></span>;
      default: return <span>Activity from <b className="text-white">@{actorName}</b></span>;
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-neutral-900/50 border border-white/5 text-neutral-400 hover:text-emerald-500 transition-all active:scale-95"
      >
        {unreadCount > 0 ? <RiNotification2Fill size={20} className="text-emerald-500" /> : <RiNotification2Line size={20} />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[999] overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Neural Activity</h3>
              <div className="flex items-center gap-x-3">
                <button 
                  onClick={() => window.location.href = '/notifications'}
                  className="text-[9px] font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                  See All
                </button>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => notifications.forEach(n => !n.is_read && markAsRead(n.id))}
                    className="text-[9px] font-bold text-emerald-500 hover:underline uppercase tracking-widest"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-emerald-500"></div>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={twMerge(
                      "p-4 border-b border-white/5 flex gap-x-3 cursor-pointer transition-colors",
                      !n.is_read ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-white/5"
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex flex-col gap-y-1">
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        {getMessage(n)}
                      </p>
                      <span className="text-[8px] font-mono text-neutral-600 uppercase">
                        {formatTimeAgo(n.created_at)}
                      </span>
                    </div>
                    {!n.is_read && (
                      <div className="ml-auto shrink-0 w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-10 text-center opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">No signals detected</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;

