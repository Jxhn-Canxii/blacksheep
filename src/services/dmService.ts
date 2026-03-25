/**
 * dmService — server-side data access for the DM (direct messages) feature.
 * All Supabase calls are isolated here; API routes import from this module.
 */

import { createClient } from '@/libs/supabaseServer';

export interface Message {
  id: string;
  created_at: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  unread_count: number;
  has_conversation: boolean;
}

// Fetch paginated DMs between two users
export async function fetchDirectMessages(
  userId: string,
  targetUserId: string,
  offset: number,
  limit: number
): Promise<{ data: Message[]; hasMore: boolean }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from('direct_messages')
    .select('*, profiles:sender_id (username, avatar_url)')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const reversed = ((data as Message[]) ?? []).reverse();
  return { data: reversed, hasMore: (data?.length ?? 0) >= limit };
}

// Send a DM
export async function sendDirectMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('direct_messages')
    .insert([{ content, sender_id: senderId, receiver_id: receiverId }]);

  if (error) throw new Error(error.message);
}

// Get follow status (does userId follow targetId?)
export async function getFollowStatus(userId: string, targetId: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('follows')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', targetId)
    .maybeSingle();

  return !!data;
}

// Toggle follow
export async function toggleFollowDm(
  followerId: string,
  followingId: string
): Promise<{ action: 'followed' | 'unfollowed' }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing } = await db
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (existing) {
    const { error } = await db.from('follows').delete().eq('id', existing.id);
    if (error) throw new Error(error.message);
    return { action: 'unfollowed' };
  }

  const { error } = await db.from('follows').insert([{ follower_id: followerId, following_id: followingId }]);
  if (error) throw new Error(error.message);
  return { action: 'followed' };
}

// Get target profile
export async function getProfile(
  userId: string
): Promise<{ username: string; avatar_url: string | null } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as { username: string; avatar_url: string | null };
}

// Get friends list (mutual follows) and requests
export async function getFriendsAndRequests(
  userId: string
): Promise<{ friends: Friend[]; requests: Friend[] }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [{ data: following }, { data: followers }] = await Promise.all([
    db
      .from('follows')
      .select('following_id, created_at, profiles:following_id(username, avatar_url)')
      .eq('follower_id', userId),
    db
      .from('follows')
      .select('follower_id, created_at, profiles:follower_id(username, avatar_url)')
      .eq('following_id', userId),
  ]);

  const followingList: any[] = following ?? [];
  const followerList: any[] = followers ?? [];

  const followingIds = new Set(followingList.map((f) => f.following_id));
  const followerIds = new Set(followerList.map((f) => f.follower_id));

  // Fetch message data for unread counts and conversation status
  const { data: messageData } = await supabase
    .from('direct_messages')
    .select('sender_id, receiver_id, is_read')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  const msgs: any[] = messageData ?? [];

  // Find users who sent messages but aren't in follows/following
  const messageUserIds = new Set(msgs.flatMap((m) => [m.sender_id, m.receiver_id]));
  messageUserIds.delete(userId);
  const extraUserIds = Array.from(messageUserIds).filter(
    (id) => !followingIds.has(id) && !followerIds.has(id)
  );

  let extraProfiles: any[] = [];
  if (extraUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', extraUserIds);
    extraProfiles = profiles ?? [];
  }

  const getStats = (otherUserId: string) => {
    const conversation = msgs.filter(
      (m) =>
        (m.sender_id === userId && m.receiver_id === otherUserId) ||
        (m.sender_id === otherUserId && m.receiver_id === userId)
    );
    const unread = conversation.filter((m) => m.receiver_id === userId && !m.is_read).length;
    return { unread, hasConversation: conversation.length > 0 };
  };

  const friends: Friend[] = followingList
    .filter((f) => followerIds.has(f.following_id))
    .map((f) => {
      const stats = getStats(f.following_id);
      return {
        id: f.following_id,
        username: f.profiles.username,
        avatar_url: f.profiles.avatar_url,
        created_at: f.created_at,
        unread_count: stats.unread,
        has_conversation: stats.hasConversation,
      };
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const followRequests: Friend[] = followerList
    .filter((f) => !followingIds.has(f.follower_id))
    .map((f) => {
      const stats = getStats(f.follower_id);
      return {
        id: f.follower_id,
        username: f.profiles.username,
        avatar_url: f.profiles.avatar_url,
        created_at: f.created_at,
        unread_count: stats.unread,
        has_conversation: stats.hasConversation,
      };
    });

  const messageRequests: Friend[] = extraProfiles.map((p) => {
    const stats = getStats(p.id);
    return {
      id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      created_at: new Date(0).toISOString(),
      unread_count: stats.unread,
      has_conversation: stats.hasConversation,
    };
  });

  const requests: Friend[] = [...followRequests, ...messageRequests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { friends, requests };
}

// Check if a follow was created < 24h ago AND there are 0 messages between the two users
export async function checkIsNewFriend(userId: string, targetId: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: follow } = await db
    .from('follows')
    .select('created_at')
    .eq('follower_id', userId)
    .eq('following_id', targetId)
    .maybeSingle();

  if (!follow) return false;

  const created = new Date(follow.created_at).getTime();
  const now = Date.now();
  if (now - created >= 86400000) return false;

  const { count } = await db
    .from('direct_messages')
    .select('*', { count: 'exact', head: true })
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${userId})`
    );

  return (count ?? 0) === 0;
}
