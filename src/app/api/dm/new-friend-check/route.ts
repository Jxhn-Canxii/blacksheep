import { NextResponse } from 'next/server';
import { checkIsNewFriend } from '@/services/dmService';

// GET /api/dm/new-friend-check?user_id=&target_id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  const target_id = searchParams.get('target_id');

  if (!user_id || !target_id) {
    return new NextResponse('user_id and target_id are required', { status: 400 });
  }

  try {
    const isNewFriend = await checkIsNewFriend(user_id, target_id);
    return NextResponse.json({ isNewFriend });
  } catch (err) {
    console.error('Error checking new friend status:', err);
    return new NextResponse('Error checking new friend status', { status: 500 });
  }
}
