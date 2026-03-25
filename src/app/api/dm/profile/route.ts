import { NextResponse } from 'next/server';
import { getProfile } from '@/services/dmService';

// GET /api/dm/profile?user_id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return new NextResponse('user_id is required', { status: 400 });
  }

  try {
    const profile = await getProfile(user_id);
    if (!profile) {
      return new NextResponse('Profile not found', { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    return new NextResponse('Error fetching profile', { status: 500 });
  }
}
