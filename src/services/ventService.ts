/**
 * ventService — server-side data access for vents functionality.
 * All Supabase calls are isolated here; API routes import from this module.
 */

import { createClient } from '@/libs/supabaseServer';

export interface Vent {
  id: string;
  content: string;
  emotion: string;
  user_id: string;
  location: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

// Create a new vent
export async function createVent(
  content: string,
  emotion: string,
  userId: string,
  location: string | null
): Promise<Vent> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('vents')
    .insert([{ content, emotion, user_id: userId, location }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Vent;
}
