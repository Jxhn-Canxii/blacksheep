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
 * Cached fetch for global vents (Paginated)
 * Revalidates every 30 seconds for relative freshness
 */
export const getCachedVents = (pageNum = 0, itemsPerPage = 5) => unstable_cache(
  async () => {
    const supabase = await createAdminClient();
    const from = pageNum * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error } = await supabase
      .from('vents')
      .select(`
        *,
        profiles (
          username,
          follower_count:follows!following_id(count)
        ),
        vent_reactions (id, user_id, type),
        pulse_shares (id, user_id)
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return [];
    return data;
  },
  [`vents-page-${pageNum}`],
  { revalidate: 30, tags: ['vents'] }
)();

/**
 * Cached fetch for all neural clusters (Groups)
 */
export const getCachedGroups = unstable_cache(
  async () => {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members (
          user_id,
          status,
          profiles (
            username,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  },
  ['all-groups'],
  { revalidate: 300, tags: ['groups'] }
);

