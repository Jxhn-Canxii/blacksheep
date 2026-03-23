"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import Header from "@/components/Header";
import { RiNotification2Line, RiChatFollowUpLine, RiUserFollowLine, RiAtLine, RiMailLine, RiCheckDoubleLine } from "react-icons/ri";
import { HiHashtag } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { toast } from "react-hot-toast";

type Notifications = {
    id: string;
    user_id: string;
    is_read: boolean;
    type: 'reply' | 'follow' | 'mention' | 'message' | 'group_info' | string;
    created_at: string;
    metadata?: {
        name?: string;
        cluster_id?: string;
    } | null;
    actor?: {
        username?: string;
        avatar_url?: string;
    } | null;
};

const NotificationsPage = () => {
    const { supabase } = useSupabase();
    const { user } = useUser();

    const [notifications, setNotifications] = useState<Notifications[]>([]);
    const [loading, setLoading] = useState(true);


    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor:actor_id (username, avatar_url)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setNotifications(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    // useEffect(() => {
    //     if (notifications.some(n => !n.is_read)) {
    //         const timer = setTimeout(() => {
    //             markAllAsRead();
    //         }, 3000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [notifications]);

// const markAllAsRead = async () => {
//     if (!user) return;

//     const { error } = await supabase
//         .from('notifications')
//         .update({ is_read: true })
//         .eq('user_id', user.id);

//     if (!error) {
//         setNotifications(prev =>
//             prev.map(n => ({ ...n, is_read: true }))
//         );
//         toast.success("All signals normalized.");
//     }
// };
    const getIcon = (type: string) => {
        switch (type) {
            case 'reply': return <RiChatFollowUpLine size={24} className="text-emerald-500" />;
            case 'follow': return <RiUserFollowLine size={24} className="text-blue-500" />;
            case 'mention': return <RiAtLine size={24} className="text-purple-500" />;
            case 'message': return <RiMailLine size={24} className="text-orange-500" />;
            case 'group_info': return <HiHashtag size={24} className="text-emerald-500" />;
            default: return <RiNotification2Line size={24} className="text-neutral-500" />;
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return "Just Now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-neutral-950 rounded-[2rem] h-full w-full overflow-hidden flex flex-col border border-white/5 relative">
            <Header className="bg-transparent p-6 lg:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-x-2 text-emerald-500 font-black uppercase tracking-[0.3em] text-[9px]">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            <span>Neural Log</span>
                        </div>
                        <h1 className="text-white text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
                            Spectral <span className="text-emerald-500 underline decoration-emerald-500/10">Activity</span>
                        </h1>
                        <p className="text-neutral-500 text-sm font-medium opacity-80 max-w-md">Your history of neural links and community resonance.</p>
                    </div>

                    {/* {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-x-3 px-6 py-3 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all shadow-xl active:scale-95"
                        >
                            <RiCheckDoubleLine size={18} />
                            <span>Clear Frequencies</span>
                        </button>
                    )} */}
                </div>
            </Header>

            <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10 space-y-4 scrollbar-hide">
                {loading ? (
                    <div className="flex flex-col gap-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-24 bg-neutral-900/40 animate-pulse rounded-3xl border border-white/5" />
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence>
                            {notifications.map((n, i) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={twMerge(
                                        "group p-6 rounded-[2rem] border border-white/5 backdrop-blur-3xl transition-all duration-500 hover:border-emerald-500/20",
                                        !n.is_read ? "bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.05)]" : "bg-neutral-900/40"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-x-6">
                                        <div className="flex items-center gap-x-5 flex-1 min-w-0">
                                            <div className="w-14 h-14 rounded-2xl bg-black border border-white/5 flex items-center justify-center relative shadow-lg">
                                                {getIcon(n.type)}
                                                {!n.is_read && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="text-white text-sm font-bold leading-snug">
                                                    {n.type === 'group_info' ? (
                                                        <span>
                                                            Circle Established: <b className="text-emerald-500">{n.metadata?.name}</b>.
                                                            Neural ID: <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono select-all ml-1">{n.metadata?.cluster_id}</span>
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            <b className="text-emerald-500">@{n.actor?.username}</b> {
                                                                n.type === 'reply' ? 'resonated with your bubble' :
                                                                    n.type === 'follow' ? 'is syncing with your frequency' :
                                                                        n.type === 'mention' ? 'called your signal in a thread' :
                                                                            n.type === 'message' ? 'initiated a direct link' : 'interacted with your signal'
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-neutral-600 tracking-widest mt-1">
                                                    {formatTimeAgo(n.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-[9px] font-black uppercase text-emerald-500/50 hover:text-emerald-500 tracking-tighter transition-colors">
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-center">
                        <RiNotification2Line size={80} className="mb-6" />
                        <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Silent Horizon</h3>
                        <p className="text-neutral-500 text-xs mt-2 uppercase font-black tracking-widest">No spectral activity detected</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
