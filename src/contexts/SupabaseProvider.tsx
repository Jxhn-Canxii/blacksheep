"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Session, SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@/types/types_db';

type SupabaseContext = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
};

export const SupabaseContext = createContext<SupabaseContext | undefined>(undefined);

// Ensure the client is a singleton outside the component lifecycle
// to prevent orphaned auth locks in React Strict Mode.
let clientInstance: SupabaseClient<Database> | undefined;

function getSupabaseClient() {
  if (clientInstance) return clientInstance;
  
  clientInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return clientInstance;
}

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => getSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(() => ({
    supabase,
    session
  }), [supabase, session]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider');
  }

  return context;
};

