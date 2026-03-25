import { NextResponse } from 'next/server';
import { searchUsers } from '@/services/groupMessagesService';

// GET /api/users/search?q=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return new NextResponse('Query parameter q is required', { status: 400 });
  }

  try {
    const users = await searchUsers(query.trim());
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return new NextResponse('Error searching users', { status: 500 });
  }
}
