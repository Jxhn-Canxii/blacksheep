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
      .select('*')
      .eq('id', user.id)
      .single();
    setUserDetails(userDetails as UserDetails | null);
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
