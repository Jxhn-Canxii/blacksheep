"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiFire, HiSparkles, HiOutlineUserCircle } from "react-icons/hi2";
import ReplyForm from "./ReplyForm";

// Since this component is dynamically imported with { ssr: false },
// we can safely import Leaflet and React-Leaflet directly.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Fix Leaflet default icon issues for Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Controller to handle map centering and programmatic movement
 */
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && map) {
        map.setView(center, 16);
    }
  }, [center, map]);
  
  return null;
};

interface MapProps {
  view?: "public" | "private";
}

/**
 * Map Component
 * 
 * Displays vents on a real-time dark-themed world map.
 * Features:
 * - Public/Private view modes.
 * - Anonymization for public view.
 * - Real-time synchronization.
 */
const Map: React.FC<MapProps> = ({ view = "public" }) => {
  const { supabase } = useSupabase();
  const { user } = useUser();
  const [vents, setVents] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchVents = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any)
      .from('vents')
      .select('*, profiles (username), replies (content, created_at, profiles (username))')
      .not('location', 'is', null);
    
    const { data, error } = await query;
    
    if (!error && data) {
      setVents(data);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!isMounted) return;

    fetchVents();

    if (navigator.geolocation) {
      setGeoStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setGeoStatus("ready");
        },
        (err) => {
          setGeoStatus("error");
          setGeoError(err.message || "Location unavailable");
        }
      );
    }

    const channel = supabase
      .channel(`world-acoustics-${view}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vents' }, async (p) => {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', p.new.user_id).single();
        if (p.new.location) {
          setVents(prev => [...prev, { ...p.new, profiles: profile, replies: [] }]);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies' }, async (p) => {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', p.new.user_id).single();
        setVents(prev => prev.map(v => v.id === p.new.vent_id ? 
          { ...v, replies: [...(v.replies || []), { ...p.new, profiles: profile }] } : v));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, view, isMounted, fetchVents]);

  const createBubbleIcon = useCallback((emotion: string, replyCount: number) => {
    return L.divIcon({
      className: 'custom-bubble-icon',
      html: `
        <div class="relative group">
           <div class="w-12 h-12 rounded-[1.5rem] bg-emerald-500/80 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.7)] border border-white/30 flex items-center justify-center animate-pulse">
              <span class="text-[10px] font-black text-white uppercase tracking-tighter">${emotion?.slice(0, 3) || 'POP'}</span>
           </div>
           ${view === "private" && replyCount > 0 ? `
           <div class="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 rounded-full border-2 border-neutral-900 flex items-center justify-center shadow-lg z-10">
              <span class="text-[8px] font-black text-neutral-900">${replyCount > 9 ? '9+' : replyCount}</span>
           </div>
           ` : ''}
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  }, [view]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoStatus("loading");
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setGeoStatus("ready");
      },
      (err) => {
        setGeoStatus("error");
        setGeoError(err.message || "Location unavailable");
      }
    );
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-neutral-900 animate-pulse rounded-[3rem] flex items-center justify-center min-h-[400px]">
        <p className="text-neutral-500 font-black uppercase tracking-[0.5em] italic">Initializing Grid...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex flex-col min-h-[400px]">
      <MapContainer
        key={view}
        center={[20, 0]}
        zoom={3}
        className="flex-1 w-full rounded-[3.5rem] overflow-hidden border border-white/5 shadow-inner"
        style={{ minHeight: '400px', background: '#0a0a0a' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {userLocation && <MapController center={userLocation} />}

        {vents.map((vent) => {
          const loc = vent.location as { latitude: number, longitude: number };
          if (!loc || !loc.latitude) return null;
          const replyCount = vent.replies?.length || 0;
          const isOwn = vent.user_id === user?.id;
          const anonymousName = vent.user_id ? `Anonymous-${vent.user_id.slice(-4)}` : "Anonymous-0000";
          const displayName = view === "public" ? anonymousName : (vent.profiles?.username || 'known');

          return (
            <Marker 
              key={vent.id} 
              position={[loc.latitude, loc.longitude]}
              icon={createBubbleIcon(vent.emotion || 'Bubble', replyCount)}
            >
              <Popup className="premium-popup">
                <div className="p-6 bg-neutral-900 border border-white/5 text-white rounded-[2.5rem] min-w-[280px] shadow-3xl space-y-6 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">@{displayName}</span>
                            <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter mt-1">{view === "public" ? "Public" : "Private"}</span>
                        </div>
                        {view === "private" && replyCount > 0 && (
                            <div className="flex items-center gap-x-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{replyCount} Echoes</span>
                            </div>
                        )}
                    </div>
                    
                    <p className="text-sm font-medium leading-relaxed italic text-white/95 relative z-10">
                        "{vent.content}"
                    </p>

                    {/* Show ONLY the latest reply in private view */}
                    {view === "private" && vent.replies && vent.replies.length > 0 && (() => {
                        // Sort by created_at descending and pick the first one
                        const latestReply = [...vent.replies].sort((a: any, b: any) => 
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        )[0];
                        
                        return (
                            <div className="border-t border-white/5 pt-4 relative z-10">
                                <div className="flex items-center gap-x-2 mb-2">
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Latest Resonance</span>
                                </div>
                                <div className="bg-white/5 p-3 rounded-2xl border border-emerald-500/10 shadow-lg">
                                    <div className="flex items-center gap-x-2 mb-1">
                                        <span className="text-[8px] font-black text-emerald-500 uppercase transition-all">@{latestReply.profiles?.username || 'user'}</span>
                                        <span className="text-[7px] text-neutral-700 font-mono italic ml-auto">
                                          {new Date(latestReply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-300 leading-relaxed italic">"{latestReply.content}"</p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Show reply form only in private view */}
                    {view === "private" && (
                      <div className="pt-2 relative z-10 border-t border-white/5 pt-4">
                          <div className="flex items-center gap-x-2 mb-3">
                              <HiSparkles className="text-emerald-500" size={14} />
                              <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">Resonate back</span>
                          </div>
                          <ReplyForm vent_id={vent.id} />
                      </div>
                    )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* UX overlay (map controls + status) */}
      <div className="absolute top-8 right-8 z-[2000] pointer-events-none flex flex-col items-end gap-y-3">
        <button
          type="button"
          aria-label="Locate me"
          disabled={geoStatus === "loading"}
          onClick={handleLocateMe}
          className="pointer-events-auto bg-neutral-900/60 backdrop-blur-3xl p-4 rounded-[2rem] border border-white/10 shadow-3xl text-white hover:border-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-x-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Locate me</span>
          </div>
        </button>

        {loading && (
          <div className="pointer-events-auto bg-neutral-900/60 backdrop-blur-3xl p-4 rounded-[2rem] border border-white/10 shadow-3xl">
            <div className="flex items-center gap-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Loading map signals...</span>
            </div>
          </div>
        )}

        {geoStatus === "error" && (
          <div className="pointer-events-auto bg-neutral-900/60 backdrop-blur-3xl p-4 rounded-[2rem] border border-white/10 shadow-3xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              {geoError || "Location unavailable"}
            </p>
          </div>
        )}
      </div>

      {/* Map Interactive Overlays */}
      <div className="absolute top-6 left-6 right-6 pointer-events-none flex items-center justify-between z-[1000]">
           <div className="bg-neutral-900/60 backdrop-blur-3xl p-4 rounded-[1.8rem] border border-white/10 shadow-3xl pointer-events-auto">
               <h1 className="text-white text-lg font-black italic tracking-tighter uppercase whitespace-nowrap">
                  {view === "public" ? "Public" : "Private"} <span className="text-emerald-500 underline decoration-emerald-500/20">Acoustics</span>
               </h1>
               <div className="flex items-center gap-x-2">
                   <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                   <p className="text-[7px] font-bold text-neutral-500 tracking-[0.4em] uppercase">{view === "public" ? "Global Anonymized Grid" : "Neural Connection Map"}</p>
               </div>
           </div>
           
           <div className="hidden md:flex bg-emerald-500/5 backdrop-blur-3xl p-3 rounded-[1.8rem] border border-emerald-500/10 shadow-2xl pointer-events-auto items-center gap-x-4">
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{view === "public" ? "Total Bubbles" : "Active Signals"}</span>
                    <span className="text-2xl font-black italic text-white drop-shadow-lg">{vents.length}</span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 border border-white/20">
                    <HiFire size={24} className="animate-pulse" />
                </div>
           </div>
      </div>

      <style jsx global>{`
        .premium-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .premium-popup .leaflet-popup-tip {
          background: #171717 !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }
        .premium-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-container {
            font-family: inherit !important;
        }
      `}</style>
    </div>
  );
};

export default Map;
