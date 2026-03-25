import { NextResponse } from 'next/server';
import { getFollowStatus } from '@/services/dmService';

// GET /api/dm/follow-status?user_id=&target_id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  const target_id = searchParams.get('target_id');

  if (!user_id || !target_id) {
    return new NextResponse('user_id and target_id are required', { status: 400 });
  }

  try {
    const isFollowing = await getFollowStatus(user_id, target_id);
    return NextResponse.json({ isFollowing });
  } catch (err) {
    console.error('Error fetching follow status:', err);
    return new NextResponse('Error fetching follow status', { status: 500 });
  }
}
