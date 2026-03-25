"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

import { useSupabase } from '@/hooks/useSupabase';
import { UserDetails } from '@/interfaces/types';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { apiPost } from '@/utils/logger';

type UserContextType = {
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  setIsLoggingIn: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
};

import { useIdle } from '@/hooks/useIdle';

export const UserContext = createContext<UserContextType | undefined>(undefined);

export default function UserProvider({ children }: { children: React.ReactNode }) {
  const { supabase, session } = useSupabase();
  const user = session?.user ?? null;
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleIdle = useCallback(async () => {
    // Only log out if we actually have an active user.
    if (!user) return;
    await supabase.auth.signOut();
    router.replace('/login');
  }, [supabase, router, user]);

  useIdle(3600000, handleIdle);

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

  useLayoutEffect(() => {
    if (session) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [session]);

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

  // Background Location & Presence Update (Optimized)
  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      // Only update if the tab is active to save requests
      if (document.visibilityState !== 'visible') return;

      const { data: location } = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ data: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } }),
          () => resolve({ data: null }),
          { timeout: 10000 }
        );
      }) as any;

      await apiPost('/api/profiles/me', {
        last_seen: new Date().toISOString(),
        last_location: location || null,
      });
    };

    // Update every 10 minutes instead of 5 to reduce load
    const interval = setInterval(updatePresence, 10 * 60 * 1000);
    
    // Also update on visibility change (debounced)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    updatePresence(); // Initial update

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      <LoadingOverlay isVisible={isLoading || isLoggingIn} message={isLoggingIn ? "Establishing Neural Link..." : "Loading User Profile..."} />
      {!isLoading && children}
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

