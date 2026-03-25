import { NextResponse } from 'next/server';
import { fetchGroupMessages, sendGroupMessage } from '@/services/groupMessagesService';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const data = await fetchGroupMessages(id, offset, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Error fetching messages', { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { content, user_id } = await request.json();

  if (!content || !user_id) {
    return new NextResponse('content and user_id are required', { status: 400 });
  }

  try {
    await sendGroupMessage(id, user_id, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating message:', error);
    return new NextResponse('Error creating message', { status: 500 });
  }
}
