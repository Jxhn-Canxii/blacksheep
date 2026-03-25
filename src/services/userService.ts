import { createClient } from '@/libs/supabaseServer';

/**
 * Fetch the current user's profile with followers count.
 */
export async function getMyProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      followers:follows!following_id(count)
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    ...(data as Record<string, unknown>),
    followers_count: (data as any).followers?.[0]?.count ?? 0,
  };
}

/**
 * Update presence fields (last_seen, optionally last_location) for a user.
 */
export async function updatePresence(
  userId: string,
  lastSeen: string,
  lastLocation?: { latitude: number; longitude: number } | null
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      last_seen: lastSeen,
      ...(lastLocation !== undefined ? { last_location: lastLocation } : {}),
    })
    .eq('id', userId);

  if (error) throw error;
}
