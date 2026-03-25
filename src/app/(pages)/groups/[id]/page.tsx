import GroupChatClient from "./GroupChatClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/groups/${id}`, { cache: 'no-store' });
  const json = res.ok ? await res.json() : null;
  const group = json?.group ?? null;

  return {
    title: group?.name || "Group Circle",
    description: `Join the conversation in ${group?.name || "this group"} on Black Sheep.`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupChatClient groupId={id} />;
}
