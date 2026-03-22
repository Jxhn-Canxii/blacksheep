import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { emotion, intensity, note, user_id } = await request.json();

  if (!user_id) {
    return new NextResponse('User ID is required', { status: 400 });
  }

  const { data, error } = await (supabase.from('emotional_ledger') as any)
    .insert([{ 
      user_id, 
      emotion, 
      intensity, 
      note 
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving emotional ledger:', error);
    return new NextResponse('Error saving emotional ledger', { status: 500 });
  }

  return NextResponse.json(data);
}
