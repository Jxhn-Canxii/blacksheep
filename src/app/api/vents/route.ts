import { NextResponse } from 'next/server';
import { getCachedVents } from '@/libs/cachedQueries';
import { createVent } from '@/services/ventService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '5');

  try {
    const data = await getCachedVents(page, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching vents:', error);
    return new NextResponse('Error fetching vents', { status: 500 });
  }
}

export async function POST(request: Request) {
  const { content, emotion, user_id, location } = await request.json();

  if (!content || !emotion || !user_id) {
    return new NextResponse('content, emotion, and user_id are required', { status: 400 });
  }

  try {
    const data = await createVent(content, emotion, user_id, location);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating vent:', error);
    return new NextResponse('Error creating vent', { status: 500 });
  }
}
