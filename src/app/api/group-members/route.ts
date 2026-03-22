import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { group_id, user_id } = (await request.json()) as { group_id: string; user_id: string };

  const { data, error } = await (supabase.from('group_members') as any)
    .insert([{ group_id, user_id }])
    .select()
    .single();

  if (error) {
    console.error('Error joining group:', error);
    return new NextResponse('Error joining group', { status: 500 });
  }

  return NextResponse.json(data);
}
