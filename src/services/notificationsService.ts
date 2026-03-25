/**
 * notificationsService — server-side data access for notifications.
 * All Supabase calls are isolated here; API routes import from this module.
 */

import { createClient } from '@/libs/supabaseServer';

export interface NotificationActor {
  username: string;
  avatar_url: string | null;
}

export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  actor: NotificationActor | null;
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications')
    .select(`
      *,
      actor:actor_id (username, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Notification[]) ?? [];
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw new Error(error.message);
}

export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
