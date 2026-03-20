import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('vents')
    .select('*, profiles (username)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vents:', error);
    return new NextResponse('Error fetching vents', { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { content, emotion, user_id, location } = await request.json();

  const { data, error } = await supabase
    .from('vents')
    .insert([{ content, emotion, user_id, location }])
    .select()
    .single();

  if (error) {
    console.error('Error creating vent:', error);
    return new NextResponse('Error creating vent', { status: 500 });
  }

  return NextResponse.json(data);
}
