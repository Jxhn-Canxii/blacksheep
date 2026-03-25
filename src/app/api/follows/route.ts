import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';
import type { Database } from '@/types/types_db';

type FollowRow = Database['public']['Tables']['follows']['Row'];
type FollowInsert = Database['public']['Tables']['follows']['Insert'];

// GET /api/follows?follower_id=xxx  → returns array of following_id strings
export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const follower_id = searchParams.get('follower_id');

  if (!follower_id) {
    return new NextResponse('follower_id is required', { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('follows')
    .select('following_id')
    .eq('follower_id', follower_id);

  if (error) {
    console.error('Error fetching follows:', error);
    return new NextResponse('Error fetching follows', { status: 500 });
  }

  const ids = (data as Pick<FollowRow, 'following_id'>[] ?? []).map((r) => r.following_id);
  return NextResponse.json(ids);
}

// POST /api/follows  { follower_id, following_id } → toggle follow
export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json() as { follower_id?: string; following_id?: string };
  const { follower_id, following_id } = body;

  if (!follower_id || !following_id) {
    return new NextResponse('follower_id and following_id are required', { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing } = await db
    .from('follows')
    .select('id')
    .eq('follower_id', follower_id)
    .eq('following_id', following_id)
    .maybeSingle();

  if (existing) {
    const row = existing as Pick<FollowRow, 'id'>;
    const { error } = await db.from('follows').delete().eq('id', row.id);
    if (error) {
      console.error('Error unfollowing:', error);
      return new NextResponse('Error unfollowing', { status: 500 });
    }
    return NextResponse.json({ action: 'unfollowed' });
  }

  const insert: FollowInsert = { follower_id, following_id };
  const { error } = await db.from('follows').insert(insert);
  if (error) {
    console.error('Error following:', error);
    return new NextResponse('Error following', { status: 500 });
  }
  return NextResponse.json({ action: 'followed' });
}
