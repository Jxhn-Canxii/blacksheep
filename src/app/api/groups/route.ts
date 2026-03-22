import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching groups:', error);
    return new NextResponse('Error fetching groups', { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { name, description, created_by } = await request.json();

  const { data, error } = await (supabase.from('groups') as any)
    .insert([{ name, description, created_by }])
    .select()
    .single();

  if (error) {
    console.error('Error creating group:', error);
    return new NextResponse('Error creating group', { status: 500 });
  }

  return NextResponse.json(data);
}
