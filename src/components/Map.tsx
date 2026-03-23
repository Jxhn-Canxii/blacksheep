"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useUser } from "@/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { HiFire, HiSparkles, HiOutlineUserCircle, HiUserCircle } from "react-icons/hi2";
import ReplyForm from "./ReplyForm";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { getEmotionColor } from "@/libs/emotionColors";

// Since this component is dynamically imported with { ssr: false },
// we can safely import Leaflet and React-Leaflet directly.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';

// Fix Leaflet default icon issues for Next.js
if (typeof window !== 'undefined' && L.Icon) {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

/**
 * Controller to handle map centering and reactive data loading
 */
const MapEventsHandler = ({ 
  onBoundsChange, 
  userLocation 
}: { 
  onBoundsChange: (bounds: L.LatLngBounds, zoom: number) => void,
  userLocation: [number, number] | null 
}) => {
  const map = useMap();
  const [hasCentered, setHasCentered] = useState(false);

  // Initial centering on user
  useEffect(() => {
    if (userLocation && !hasCentered && map) {
      map.setView(userLocation, 18);
      setHasCentered(true);
      onBoundsChange(map.getBounds(), map.getZoom());
    }
  }, [userLocation, map, hasCentered, onBoundsChange]);

  const mapEvents = useMapEvents({
    moveend: () => {
      onBoundsChange(mapEvents.getBounds(), mapEvents.getZoom());
    },
    zoomend: () => {
      onBoundsChange(mapEvents.getBounds(), mapEvents.getZoom());
    }
  });

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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [bounds, setBounds] = useState<{ sw: L.LatLng, ne: L.LatLng } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: vents, error, mutate: mutateVents } = useSWR(
    [`map-vents`, view, user?.id, bounds?.sw?.lat, bounds?.sw?.lng, bounds?.ne?.lat, bounds?.ne?.lng],
    async () => {
      let query = (supabase as any)
        .from('vents')
        .select(`
          id, 
          content, 
          emotion, 
          location, 
          created_at, 
          user_id,
          profiles (username)
        `)
        .not('location', 'is', null)
        .order('created_at', { ascending: false });

      if (bounds) {
          const latBuffer = (bounds.ne.lat - bounds.sw.lat) * 0.1;
          const lngBuffer = (bounds.ne.lng - bounds.sw.lng) * 0.1;

          const minLat = bounds.sw.lat - latBuffer;
          const maxLat = bounds.ne.lat + latBuffer;
          const minLng = bounds.sw.lng - lngBuffer;
          const maxLng = bounds.ne.lng + lngBuffer;

          // Ensure we have valid numbers before filtering
          if (!isNaN(minLat) && !isNaN(maxLat) && !isNaN(minLng) && !isNaN(maxLng)) {
            // Use .filter with string values to avoid potential serialization issues in some PostgREST versions
            query = query
              .filter('location->latitude', 'gte', minLat.toString())
              .filter('location->latitude', 'lte', maxLat.toString())
              .filter('location->longitude', 'gte', minLng.toString())
              .filter('location->longitude', 'lte', maxLng.toString());
          }
      }

      query = query.limit(300);

      if (view === "private" && user) {
        const { data: followed } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
        const followingIds = (followed || []).map((f: any) => f.following_id);
        query = query.in('user_id', [user.id, ...followingIds]);
      }
      
      let { data, error } = await query;
      
      // Fallback: If filtered query fails (common with JSON range queries in some Supabase versions),
      // fetch all vents with locations and filter on client side.
      if (error && bounds) {
        console.warn("Server-side JSON filtering failed, falling back to client-side filtering.", error);
        const { data: allVents, error: fallbackError } = await (supabase as any)
          .from('vents')
          .select(`
            id, content, emotion, location, created_at, user_id,
            profiles (username)
          `)
          .not('location', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500);
        
        if (fallbackError) throw fallbackError;
        
        const filtered = (allVents || []).filter((v: any) => {
          try {
            const loc = typeof v.location === 'string' ? JSON.parse(v.location) : v.location;
            const lat = loc.latitude ?? loc.lat;
            const lng = loc.longitude ?? loc.lng;
            if (lat === undefined || lng === undefined) return false;
            
            const latBuffer = (bounds.ne.lat - bounds.sw.lat) * 0.1;
            const lngBuffer = (bounds.ne.lng - bounds.sw.lng) * 0.1;
            
            return lat >= (bounds.sw.lat - latBuffer) && 
                   lat <= (bounds.ne.lat + latBuffer) && 
                   lng >= (bounds.sw.lng - lngBuffer) && 
                   lng <= (bounds.ne.lng + lngBuffer);
          } catch (e) { return false; }
        });
        
        data = filtered;
      } else if (error) {
        throw error;
      }

      return (data || []).map((v: any) => ({ ...v, followerCount: 0 }));
    },
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  const loading = !vents && !error;

  const onBoundsChange = useCallback((newBounds: L.LatLngBounds) => {
    setBounds({ sw: newBounds.getSouthWest(), ne: newBounds.getNorthEast() });
  }, []);

  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchFollows = async () => {
      if (!user) return;
      const { data } = await (supabase as any).from('follows').select('following_id').eq('follower_id', user.id);
      if (data) setFollowingIds(data.map((f: any) => f.following_id));
    };
    fetchFollows();
  }, [supabase, user]);

  const toggleFollow = useCallback(async (targetId: string) => {
    if (!user) return;
    const isFollowing = followingIds.includes(targetId);

    if (isFollowing) {
      const { error } = await (supabase as any).from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      if (!error) {
        setFollowingIds(prev => prev.filter(id => id !== targetId));
        mutateVents();
      }
    } else {
      const { error } = await (supabase as any).from('follows').insert({ follower_id: user.id, following_id: targetId });
      if (!error) {
        setFollowingIds(prev => [...prev, targetId]);
        mutateVents();
      }
    }
  }, [user, followingIds, supabase, mutateVents]);

  useEffect(() => {
    if (!isMounted) return;

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vents' }, () => {
        mutateVents();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies' }, () => {
        mutateVents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, view, isMounted, mutateVents]);


  const createBubbleIcon = useCallback((emotion: string, replyCount: number, intensity?: number) => {
    const colors = getEmotionColor(emotion);
    return L.divIcon({
      className: 'custom-bubble-icon',
      html: `
        <div class="relative group">
           <div class="w-12 h-12 rounded-[1.5rem] ${colors.bg} backdrop-blur-md ${colors.shadow} border ${colors.border} flex items-center justify-center animate-pulse">
              <div class="flex flex-col items-center">
                <span class="text-[10px] font-black ${colors.text} uppercase tracking-tighter leading-none">${emotion?.slice(0, 3) || 'POP'}</span>
                ${intensity ? `<span class="text-[7px] font-bold ${colors.text} opacity-70 mt-0.5">Lvl ${intensity}</span>` : ''}
              </div>
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
      <div className="h-full w-full bg-neutral-900 animate-pulse flex items-center justify-center">
        <p className="text-neutral-500 font-black uppercase tracking-[0.5em] italic">Initializing Grid...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex flex-col">
      <MapContainer
        key={view}
        center={[20, 0]}
        zoom={3}
        className="flex-1 w-full overflow-hidden border-none shadow-inner z-0"
        style={{ height: '100%', background: '#0a0a0a' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <MapEventsHandler 
          userLocation={userLocation} 
          onBoundsChange={(bounds) => onBoundsChange(bounds)} 
        />

        {vents?.map((vent, index) => {
          // Robust location extraction for different storage formats
          const rawLoc = vent.location;
          let lat: number | undefined;
          let lng: number | undefined;

          try {
            const locObj = typeof rawLoc === 'string' ? JSON.parse(rawLoc) : rawLoc;
            if (locObj) {
              const rawLat = locObj.latitude ?? locObj.lat;
              const rawLng = locObj.longitude ?? locObj.lng;
              if (rawLat !== undefined && rawLng !== undefined) {
                lat = Number(rawLat);
                lng = Number(rawLng);
              }
            }
          } catch (e) {
            console.error("Corrupt signal coordinates:", vent.id);
          }

          if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return null;
          
          // Workaround for overlapping vents: add a tiny random jitter based on index
          // if we detect potential collisions (simple check: any vents sharing same coords)
          const overlaps = vents.filter((v, i) => i !== index && 
            JSON.stringify(v.location) === JSON.stringify(vent.location)
          ).length;

          if (overlaps > 0) {
            // Apply a tiny offset to separate them
            const offset = 0.00015; // roughly 15-20 meters
            lat += (Math.cos(index * 1.5) * offset);
            lng += (Math.sin(index * 1.5) * offset);
          }
          
          const replyCount = vent.replies?.length || 0;
          const isOwn = vent.user_id === user?.id;
          const anonymousName = vent.user_id ? `Anonymous-${vent.user_id.slice(-4)}` : "Anonymous-0000";
          const displayName = view === "public" ? anonymousName : (vent.profiles?.username || 'known');

          return (
            <Marker 
              key={vent.id} 
              position={[lat, lng]}
              icon={createBubbleIcon(vent.emotion || 'Bubble', replyCount, (vent as any).intensity)}
            >
              <Popup className="premium-popup">
                <div className="p-6 bg-neutral-900 border border-white/5 text-white rounded-[2.5rem] min-w-[280px] shadow-3xl space-y-6 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-x-2">
                                <Link 
                                  href={view === "public" ? "#" : `/profile/${vent.user_id}`}
                                  className={twMerge(
                                    "text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none hover:text-emerald-400 transition-colors flex items-center gap-x-1.5",
                                    view === "public" && "pointer-events-none"
                                  )}
                                >
                                  <div className="w-5 h-5 rounded-md bg-neutral-800 flex items-center justify-center border border-white/5">
                                    <HiUserCircle size={14} className="text-emerald-500/70" />
                                  </div>
                                  @{displayName}
                                </Link>
                                {user && !isOwn && view !== "public" && (
                                    <button 
                                        onClick={() => toggleFollow(vent.user_id)}
                                        className={twMerge(
                                            "text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md transition-all",
                                            followingIds.includes(vent.user_id) 
                                                ? "bg-white/10 text-white hover:bg-red-500/20 hover:text-red-500" 
                                                : "bg-emerald-500 text-black hover:bg-emerald-400"
                                        )}
                                    >
                                        {followingIds.includes(vent.user_id) ? "Linked" : "Link"}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-x-2 mt-1.5">
                                <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter bg-white/5 px-1.5 py-0.5 rounded-sm">{view === "public" ? "Anonymized" : "Identified"}</span>
                                <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-x-1">
                                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                  {vent.followerCount} Links
                                </span>
                            </div>
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

      {/* UX overlay (map status) */}
      <div className="absolute top-8 right-8 z-[2000] pointer-events-none flex flex-col items-end gap-y-3">
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

      {/* Locate Me Button - Bottom Right */}
      <div className="absolute bottom-10 right-10 z-[2000] pointer-events-none">
        <button
          type="button"
          aria-label="Locate me"
          disabled={geoStatus === "loading"}
          onClick={handleLocateMe}
          className="pointer-events-auto bg-neutral-900/60 backdrop-blur-3xl p-4 rounded-[2rem] border border-white/10 shadow-3xl text-white hover:border-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center gap-x-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full group-hover:animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest">Locate me</span>
          </div>
        </button>
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
                    <span className="text-2xl font-black italic text-white drop-shadow-lg">{vents?.length || 0}</span>
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
