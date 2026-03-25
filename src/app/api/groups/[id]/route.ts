import { NextResponse } from 'next/server';
import { getGroupById } from '@/services/groupService';
import { getGroupMembers } from '@/services/groupMessagesService';
import { createClient } from '@/libs/supabaseServer';

// GET /api/groups/[id]?user_id=
// Returns { group, membership, members }
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id') ?? '';

  try {
    const [group, members] = await Promise.all([
      getGroupById(id),
      getGroupMembers(id)
    ]);

    if (!group) {
      return new NextResponse('Group not found', { status: 404 });
    }

    let membership = null;
    if (user_id) {
      const supabase = await createClient();
      const { data } = await supabase
        .from('group_members')
        .select('id, status, role')
        .eq('group_id', id)
        .eq('user_id', user_id)
        .maybeSingle();
      membership = data;
    }

    return NextResponse.json({
      group,
      membership,
      members
    });
  } catch (error) {
    console.error('Error fetching group details:', error);
    return new NextResponse('Error fetching group details', { status: 500 });
  }
}
