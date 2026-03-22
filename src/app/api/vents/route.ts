import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';
import { getCachedVents } from '@/libs/cachedQueries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '5');

  const data = await getCachedVents(page, limit);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { content, emotion, user_id, location } = await request.json();

  const { data, error } = await (supabase.from('vents') as any)
    .insert([{ content, emotion, user_id, location }])
    .select()
    .single();

  if (error) {
    console.error('Error creating vent:', error);
    return new NextResponse('Error creating vent', { status: 500 });
  }

  return NextResponse.json(data);
}
