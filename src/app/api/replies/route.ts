import { NextResponse } from 'next/server';
import { fetchReplies, createReply } from '@/services/replyService';

// GET /api/replies?vent_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vent_id = searchParams.get('vent_id');

  if (!vent_id) {
    return new NextResponse('vent_id is required', { status: 400 });
  }

  try {
    const data = await fetchReplies(vent_id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching replies:', error);
    return new NextResponse('Error fetching replies', { status: 500 });
  }
}

export async function POST(request: Request) {
  const { content, user_id, vent_id } = await request.json();

  if (!content || !user_id || !vent_id) {
    return new NextResponse('content, user_id, and vent_id are required', { status: 400 });
  }

  try {
    const data = await createReply(content, user_id, vent_id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating reply:', error);
    return new NextResponse('Error creating reply', { status: 500 });
  }
}
