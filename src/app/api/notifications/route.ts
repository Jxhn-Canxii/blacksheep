import { NextResponse } from 'next/server';
import { fetchNotifications, markAllAsRead, markAsRead } from '@/services/notificationsService';

// GET /api/notifications?user_id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return new NextResponse('Missing user_id', { status: 400 });
  }

  try {
    const data = await fetchNotifications(user_id);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return new NextResponse('Error fetching notifications', { status: 500 });
  }
}

// POST /api/notifications — body: { user_id, action: 'mark_all_read' }
export async function POST(request: Request) {
  const body = await request.json();
  const { user_id, action } = body;

  if (!user_id) {
    return new NextResponse('Missing user_id', { status: 400 });
  }

  if (action === 'mark_read') {
    const { notification_id } = body;
    if (!notification_id) {
      return new NextResponse('Missing notification_id', { status: 400 });
    }
    try {
      await markAsRead(notification_id);
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return new NextResponse('Error updating notification', { status: 500 });
    }
  }

  if (action === 'mark_all_read') {
    try {
      await markAllAsRead(user_id);
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      return new NextResponse('Error updating notifications', { status: 500 });
    }
  }

  return new NextResponse('Unknown action', { status: 400 });
}
