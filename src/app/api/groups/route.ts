import { NextResponse } from 'next/server';
import { fetchGroups, createGroup } from '@/services/groupService';

export async function GET() {
  try {
    const data = await fetchGroups();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return new NextResponse('Error fetching groups', { status: 500 });
  }
}

export async function POST(request: Request) {
  const { name, description, created_by } = await request.json();

  if (!name || !created_by) {
    return new NextResponse('name and created_by are required', { status: 400 });
  }

  try {
    const data = await createGroup(name, description, created_by);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating group:', error);
    return new NextResponse('Error creating group', { status: 500 });
  }
}
