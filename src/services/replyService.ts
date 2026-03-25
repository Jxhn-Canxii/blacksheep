/**
 * replyService — server-side data access for replies functionality.
 * All Supabase calls are isolated here; API routes import from this module.
 */

import { createClient } from '@/libs/supabaseServer';

export interface Reply {
  id: string;
  content: string;
  user_id: string;
  vent_id: string;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
  reply_reactions: Array<{
    id: string;
    user_id: string;
    type: string;
  }>;
}

// Fetch replies for a vent
export async function fetchReplies(ventId: string): Promise<Reply[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('replies')
    .select('*, profiles(username, avatar_url), reply_reactions(id, user_id, type)')
    .eq('vent_id', ventId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Reply[]) ?? [];
}

// Create a new reply
export async function createReply(
  content: string,
  userId: string,
  ventId: string
): Promise<Reply> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('replies')
    .insert([{ content, user_id: userId, vent_id: ventId }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Reply;
}
