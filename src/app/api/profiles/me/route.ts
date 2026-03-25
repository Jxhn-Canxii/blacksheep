import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

// PATCH /api/profiles/me  body: { last_seen, last_location }
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const { last_seen, last_location } = body as {
    last_seen: string;
    last_location: { latitude: number; longitude: number } | null;
  };

  const { error } = await supabase
    .from('profiles')
    .update({ last_seen, last_location })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating presence:', error);
    return new NextResponse('Error updating presence', { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
