import { NextResponse } from 'next/server';
import { createClient } from '@/libs/supabaseServer';

export interface TrendingEmotion {
  emotion: string;
  count: number;
}

// GET /api/vents/trending — returns top 5 emotions from the last 24h
export async function GET() {
  const supabase = await createClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('vents')
    .select('emotion')
    .gte('created_at', yesterday);

  if (error) {
    console.error('Error fetching trending emotions:', error);
    return new NextResponse('Error fetching trending emotions', { status: 500 });
  }

  const counts: Record<string, number> = {};
  ((data as { emotion: string }[]) ?? []).forEach(v => {
    if (v.emotion) {
      counts[v.emotion] = (counts[v.emotion] || 0) + 1;
    }
  });

  const trending: TrendingEmotion[] = Object.entries(counts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json(trending);
}
