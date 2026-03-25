/**
 * groupService — server-side data access for groups functionality.
 * All Supabase calls are isolated here; API routes import from this module.
 */

import { createClient } from '@/libs/supabaseServer';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Fetch all groups
export async function fetchGroups(): Promise<Group[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Group[]) ?? [];
}

// Create a new group
export async function createGroup(
  name: string,
  description: string | null,
  createdBy: string
): Promise<Group> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('groups')
    .insert([{ name, description, created_by: createdBy }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Group;
}

// Get group by ID
export async function getGroupById(groupId: string): Promise<Group | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error) throw new Error(error.message);
  return data as Group;
}