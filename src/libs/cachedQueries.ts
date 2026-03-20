import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/libs/supabaseServer';

/**
 * Cached fetch for trending feelings (24h window)
 * Revalidates every 10 minutes (600 seconds)
 */
export const getCachedTrendingFeelings = unstable_cache(
  async () => {
    const supabase = await createAdminClient();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('vents')
      .select('emotion')
      .gte('created_at', yesterday);

    if (error || !data) return [];

    const counts: { [key: string]: number } = {};
    data.forEach(v => {
      if ((v as { emotion: string }).emotion) {
        counts[(v as { emotion: string }).emotion] = (counts[(v as { emotion: string }).emotion] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  },
  ['trending-feelings'],
  { revalidate: 600, tags: ['trending-feelings'] }
);

/**
 * Cached fetch for group metadata
 */
export const getCachedGroupDetails = (groupId: string) => unstable_cache(
  async () => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) return null;
    return data;
  },
  [`group-${groupId}`],
  { revalidate: 3600, tags: [`group-${groupId}`] }
)();
