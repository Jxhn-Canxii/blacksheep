import { SupabaseClient } from '@supabase/supabase-js';

import { Reaction } from '@/interfaces/types';

export const toggleFollow = async (
  supabase: SupabaseClient,
  userId: string,
  targetId: string
) => {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', targetId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    await supabase.from('follows').delete().eq('id', data.id);
  } else {
    await supabase.from('follows').insert({ follower_id: userId, following_id: targetId });
  }
};

export const toggleReaction = async (
  supabase: SupabaseClient,
  ventId: string,
  userId: string,
  type: string,
  existingReaction?: Reaction
) => {
  if (existingReaction && existingReaction.type === type) {
    await supabase.from('vent_reactions').delete().eq('id', existingReaction.id);
  } else {
    await supabase.from('vent_reactions').upsert({ vent_id: ventId, user_id: userId, type }, { onConflict: 'vent_id,user_id' });
  }
};
