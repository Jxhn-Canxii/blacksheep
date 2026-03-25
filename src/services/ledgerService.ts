/**
 * ledgerService — server-side data access for emotional ledger functionality.
 * All Supabase calls are isolated here; API routes import from this module.
 */

import { createClient } from '@/libs/supabaseServer';

export interface EmotionalLedger {
  id: string;
  user_id: string;
  emotion: string;
  intensity: number;
  note: string;
  created_at: string;
  updated_at: string;
}

// Create an emotional ledger entry
export async function createLedgerEntry(
  userId: string,
  emotion: string,
  intensity: number = 5,
  note: string = ''
): Promise<EmotionalLedger> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('emotional_ledger')
    .insert([{ user_id: userId, emotion, intensity, note }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as EmotionalLedger;
}