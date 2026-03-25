import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';
import { createLedgerEntry } from '@/services/ledgerService';

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

    if (!emotion) {
      return new NextResponse('Emotion is required', { status: 400 });
    }

    try {
      const data = await createLedgerEntry(user.id, emotion, intensity, note);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error saving emotional ledger:', error);
      return new NextResponse('Error saving emotional ledger', { status: 500 });
    }
  } catch (err: any) {
    console.error('LEDGER_API_ERROR', err);
    return new NextResponse('Invalid Request Body', { status: 400 });
  }
}
