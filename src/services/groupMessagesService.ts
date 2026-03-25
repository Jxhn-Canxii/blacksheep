/**
 * groupMessagesService — server-side data access for group messages functionality.
 * All Supabase calls are isolated here; API routes import from this module.
 */

import { createClient } from '@/libs/supabaseServer';

export interface GroupMessage {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  group_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export interface GroupMember {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  status: string;
}

// Fetch group messages
export async function fetchGroupMessages(
  groupId: string,
  offset: number = 0,
  limit: number = 50
): Promise<GroupMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('group_messages')
    .select('*, profiles(username, avatar_url)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return ((data as GroupMessage[]) ?? []).reverse();
}

// Send a group message
export async function sendGroupMessage(
  groupId: string,
  userId: string,
  content: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from('group_messages')
    .insert([{ content, user_id: userId, group_id: groupId }]);

  if (error) throw new Error(error.message);
}

// Get group members
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('group_members')
    .select('profiles(id, username, avatar_url), status, role')
    .eq('group_id', groupId)
    .eq('status', 'approved');

  if (error) throw new Error(error.message);
  return (data as any[])?.map((m: any) => ({
    id: m.profiles.id,
    username: m.profiles.username,
    avatar_url: m.profiles.avatar_url,
    role: m.role,
    status: m.status
  })) ?? [];
}

// Get pending members
export async function getPendingMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('group_members')
    .select('profiles(id, username, avatar_url)')
    .eq('group_id', groupId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
  return (data as any[])?.map((m: any) => ({
    id: m.profiles.id,
    username: m.profiles.username,
    avatar_url: m.profiles.avatar_url,
    role: 'member',
    status: 'pending'
  })) ?? [];
}

// Request to join group
export async function requestJoinGroup(groupId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from('group_members')
    .insert([{ group_id: groupId, user_id: userId, status: 'pending' }]);

  if (error) throw new Error(error.message);
}

// Approve member
export async function approveGroupMember(groupId: string, targetUserId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from('group_members')
    .update({ status: 'approved' })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);

  if (error) throw new Error(error.message);
}

// Update member role
export async function updateMemberRole(
  groupId: string, 
  targetUserId: string, 
  newRole: 'admin' | 'moderator' | 'member'
): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from('group_members')
    .update({ role: newRole })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);

  if (error) throw new Error(error.message);
}

// Remove member
export async function removeGroupMember(groupId: string, targetUserId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);

  if (error) throw new Error(error.message);
}

// Add member directly
export async function addGroupMember(groupId: string, targetUserId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from('group_members')
    .insert([{ group_id: groupId, user_id: targetUserId, status: 'approved' }]);

  if (error) throw new Error(error.message);
}

// Search users
export async function searchUsers(query: string): Promise<{ id: string; username: string }[]> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, username')
    .ilike('username', `%${query}%`)
    .limit(5);

  if (error) throw new Error(error.message);
  return (data as { id: string; username: string }[]) ?? [];
}
