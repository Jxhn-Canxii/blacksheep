/**
 * messagesService — HTTP-based data access for the global chat page.
 * All calls go through Next.js API routes and are instrumented via apiGet/apiPost.
 */

import { apiGet, apiPost } from '@/utils/logger';

export interface ChatMessage {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface MessagesResponse {
  data: ChatMessage[];
  hasMore: boolean;
}

export async function fetchMessages(
  offset: number,
  limit: number
): Promise<{ data: ChatMessage[]; hasMore: boolean }> {
  return apiGet<MessagesResponse>('/api/messages', {
    params: { offset, limit },
  });
}

export async function sendMessage(content: string, userId: string): Promise<void> {
  await apiPost('/api/messages', { content, user_id: userId });
}

export async function fetchFollowingIds(userId: string): Promise<Set<string>> {
  const ids = await apiGet<string[]>('/api/follows', {
    params: { follower_id: userId },
  });
  return new Set(ids);
}

export async function toggleFollowHttp(
  followerId: string,
  followingId: string
): Promise<void> {
  await apiPost('/api/follows', { follower_id: followerId, following_id: followingId });
}
