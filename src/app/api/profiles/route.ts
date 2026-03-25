import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

// GET /api/profiles?search=&exclude_id=&exclude_following=&limit=
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') ?? '';
  const exclude_id = searchParams.get('exclude_id') ?? '';
  const exclude_following = searchParams.get('exclude_following') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '20');

  let query = supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      followers:follows!following_id(count),
      vents:vents!user_id(count)
    `)
    .limit(limit);

  if (search) {
    query = query.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  if (exclude_id) {
    query = query.neq('id', exclude_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching profiles:', error);
    return new NextResponse('Error fetching profiles', { status: 500 });
  }

  // Filter out users already followed (client passes their following list as comma-separated ids)
  const excludeSet = new Set(
    exclude_following ? exclude_following.split(',').filter(Boolean) : []
  );

  const profiles = (data ?? [])
    .filter((p: { id: string }) => !excludeSet.has(p.id))
    .map((p: {
      id: string;
      username: string;
      full_name: string | null;
      avatar_url: string | null;
      followers: { count: number }[];
      vents: { count: number }[];
    }) => ({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      followers_count: p.followers?.[0]?.count ?? 0,
      vents_count: p.vents?.[0]?.count ?? 0,
    }));

  return NextResponse.json(profiles);
}
