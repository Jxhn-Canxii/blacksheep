import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles (username)')
    .eq('group_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Error fetching messages', { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { content, user_id } = await request.json();

  const { data, error } = await supabase
    .from('messages')
    .insert([{ content, user_id, group_id: id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating message:', error);
    return new NextResponse('Error creating message', { status: 500 });
  }

  return NextResponse.json(data);
}
