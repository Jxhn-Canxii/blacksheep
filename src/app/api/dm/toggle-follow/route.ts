import { NextResponse } from 'next/server';
import { toggleFollowDm } from '@/services/dmService';

// POST /api/dm/toggle-follow { follower_id, following_id }
export async function POST(request: Request) {
  const body = await request.json() as { follower_id?: string; following_id?: string };
  const { follower_id, following_id } = body;

  if (!follower_id || !following_id) {
    return new NextResponse('follower_id and following_id are required', { status: 400 });
  }

  try {
    const result = await toggleFollowDm(follower_id, following_id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error toggling follow:', err);
    return new NextResponse('Error toggling follow', { status: 500 });
  }
}
