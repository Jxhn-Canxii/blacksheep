import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles (username)')
    .is('group_id', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Error fetching messages', { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { content, user_id } = await request.json();

  const { data, error } = await (supabase.from('messages') as any)
    .insert([{ content, user_id, group_id: null }])
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    return new NextResponse('Error creating message', { status: 500 });
  }

  return NextResponse.json(data);
}
