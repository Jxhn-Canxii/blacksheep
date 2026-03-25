import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

// GET /api/profiles/[id]?page=0&limit=10&current_user_id=
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') ?? '0');
  const limit = parseInt(searchParams.get('limit') ?? '10');
  const current_user_id = searchParams.get('current_user_id') ?? '';
  const rangeEnd = (page + 1) * limit - 1;

  const [
    profileRes,
    ventsRes,
    sharedRes,
    groupsRes,
    followRes,
  ] = await Promise.all([
    db.from('profiles').select('*').eq('id', id).single(),
    db
      .from('vents')
      .select('*, profiles(username, avatar_url, is_verified, show_verified_badge), vent_reactions(id, user_id, type)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(0, rangeEnd),
    db
      .from('pulse_shares')
      .select('vents(*, profiles(username, avatar_url, is_verified, show_verified_badge), vent_reactions(id, user_id, type))')
      .eq('user_id', id)
      .order('created_at', { ascending: false, foreignTable: 'vents' })
      .range(0, rangeEnd),
    db
      .from('group_members')
      .select('groups(*)')
      .eq('user_id', id),
    current_user_id
      ? db
          .from('follows')
          .select('id')
          .eq('follower_id', current_user_id)
          .eq('following_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (profileRes.error) {
    return new NextResponse('Profile not found', { status: 404 });
  }

  const vents = ventsRes.data ?? [];
  const sharedVents = (sharedRes.data ?? [])
    .map((s: any) => s.vents)
    .filter(Boolean);
  const groups = (groupsRes.data ?? []).map((g: any) => g.groups);
  const isFollowing = !!followRes.data;

  return NextResponse.json({
    profile: profileRes.data,
    vents,
    sharedVents,
    groups,
    isFollowing,
  });
}
