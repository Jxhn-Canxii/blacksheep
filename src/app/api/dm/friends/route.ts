import { NextResponse } from 'next/server';
import { getFriendsAndRequests } from '@/services/dmService';

// GET /api/dm/friends?user_id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return new NextResponse('user_id is required', { status: 400 });
  }

  try {
    const result = await getFriendsAndRequests(user_id);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error fetching friends:', err);
    return new NextResponse('Error fetching friends', { status: 500 });
  }
}
