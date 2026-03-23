import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Server-side auth check (Best Practice)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { emotion, intensity, note } = body;

    // Use the authenticated user's ID instead of trusting the body
    const user_id = user.id;

    if (!emotion) {
      return new NextResponse('Emotion is required', { status: 400 });
    }

    const { data, error } = await (supabase.from('emotional_ledger') as any)
      .insert([{ 
        user_id, 
        emotion, 
        intensity: intensity || 5, 
        note: note || "" 
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving emotional ledger:', error);
      return new NextResponse('Error saving emotional ledger', { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('LEDGER_API_ERROR', err);
    return new NextResponse('Invalid Request Body', { status: 400 });
  }
}
