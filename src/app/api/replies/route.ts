import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { content, user_id, vent_id } = await request.json();

  const { data, error } = await (supabase.from('replies') as any)
    .insert([{ content, user_id, vent_id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating reply:', error);
    return new NextResponse('Error creating reply', { status: 500 });
  }

  return NextResponse.json(data);
}
