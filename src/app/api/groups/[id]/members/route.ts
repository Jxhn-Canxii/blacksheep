import { NextResponse } from 'next/server';
import { 
  getGroupMembers, 
  getPendingMembers, 
  addGroupMember, 
  requestJoinGroup, 
  approveGroupMember, 
  updateMemberRole, 
  removeGroupMember 
} from '@/services/groupMessagesService';

// GET /api/groups/[id]/members?status=pending
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'approved';

  try {
    const members = status === 'pending' 
      ? await getPendingMembers(id)
      : await getGroupMembers(id);
    
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching group members:', error);
    return new NextResponse('Error fetching group members', { status: 500 });
  }
}

// POST /api/groups/[id]/members
// Body: { user_id, action: 'add' | 'approve' | 'update_role', role?, status? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    user_id: string;
    action: 'add' | 'approve' | 'update_role' | 'request_join';
    role?: string;
  };

  const { user_id, action, role } = body;

  try {
    if (action === 'add') {
      await addGroupMember(id, user_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'request_join') {
      await requestJoinGroup(id, user_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'approve') {
      await approveGroupMember(id, user_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'update_role') {
      if (!role) return new NextResponse('role is required', { status: 400 });
      await updateMemberRole(id, user_id, role as 'admin' | 'moderator' | 'member');
      return NextResponse.json({ success: true });
    }

    return new NextResponse('Invalid action', { status: 400 });
  } catch (error: any) {
    console.error('Error in members API:', error);
    
    if (error.message?.includes('already in group')) {
      return new NextResponse('User already in group', { status: 409 });
    }
    
    return new NextResponse('Error processing request', { status: 500 });
  }
}

// DELETE /api/groups/[id]/members?user_id=
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) return new NextResponse('user_id required', { status: 400 });

  try {
    await removeGroupMember(id, user_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return new NextResponse('Error removing member', { status: 500 });
  }
}
