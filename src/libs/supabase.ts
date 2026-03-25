import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/types_db';

/**
 * Browser client for client-side operations
 */
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
