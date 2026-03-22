"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';

import { useSupabase } from '@/providers/SupabaseProvider';
import { UserDetails } from '@/types';
import LoadingOverlay from '@/components/LoadingOverlay';

type UserContextType = {
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  setIsLoggingIn: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const { supabase, session } = useSupabase();
  const user = session?.user ?? null;
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data: userDetails } = await supabase
      .from('profiles')
      .select(`
        *,
        followers:follows!following_id(count)
      `)
      .eq('id', user.id)
      .single();
    
    if (userDetails) {
      const formattedDetails: UserDetails = {
        ...(userDetails as any),
        followers_count: (userDetails as any).followers?.[0]?.count || 0
      };
      setUserDetails(formattedDetails);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      refreshProfile().finally(() => {
        setIsLoading(false);
        setIsLoggingIn(false);
      });
    } else {
      setUserDetails(null);
      setIsLoading(false);
      setIsLoggingIn(false);
    }
  }, [user, refreshProfile]);

  // Background Location & Presence Service
  useEffect(() => {
    if (!user) return;

    const updatePresence = () => {
      // Avoid re-rendering or background work when away from browser (Task 14 in TODO)
      if (document.visibilityState === 'hidden') return;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          await (supabase.from('profiles') as any)
            .update({ 
              last_location: { latitude, longitude },
              last_seen: new Date().toISOString()
            })
            .eq('id', user.id);
        }, (err) => {
          console.warn("Location synchronization paused: Geolocation unavailable or denied.");
        }, {
          enableHighAccuracy: false, // Optimized first mentality
          timeout: 10000,
          maximumAge: 60000
        });
      }
    };

    // Initial sycn
    updatePresence();
    
    // Timely update every 5 minutes (Task 8 in TODO)
    const interval = setInterval(updatePresence, 300000); 
    
    // Tab visibility change listener to avoid irrelevant background work
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') updatePresence();
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, supabase]);

  const value = useMemo(() => ({
    user,
    userDetails,
    isLoading,
    isLoggingIn,
    setIsLoggingIn,
    refreshProfile,
  }), [user, userDetails, isLoading, isLoggingIn, refreshProfile]);

  return (
    <UserContext.Provider value={value}>
      <LoadingOverlay isVisible={isLoggingIn} message="Establishing Neural Link..." />
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider.');
  }
  return context;
};
