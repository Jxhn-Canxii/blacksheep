import { NextResponse } from 'next/server';
import { fetchDirectMessages, sendDirectMessage } from '@/services/dmService';

// GET /api/dm?user_id=&target_id=&offset=&limit=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  const target_id = searchParams.get('target_id');
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  if (!user_id || !target_id) {
    return new NextResponse('user_id and target_id are required', { status: 400 });
  }

  try {
    const result = await fetchDirectMessages(user_id, target_id, offset, limit);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Error fetching DMs:', err);
    return new NextResponse('Error fetching messages', { status: 500 });
  }
}

// POST /api/dm  { sender_id, receiver_id, content }
export async function POST(request: Request) {
  const body = await request.json() as { sender_id?: string; receiver_id?: string; content?: string };
  const { sender_id, receiver_id, content } = body;

  if (!sender_id || !receiver_id || !content) {
    return new NextResponse('sender_id, receiver_id, and content are required', { status: 400 });
  }

  try {
    await sendDirectMessage(sender_id, receiver_id, content);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error sending DM:', err);
    return new NextResponse('Error sending message', { status: 500 });
  }
}
