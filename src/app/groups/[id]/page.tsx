import GroupChatClient from "./GroupChatClient";
import { createClient } from "@/libs/supabaseServer";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: group } = await (supabase.from('groups') as any).select('name').eq('id', id).single();

  return {
    title: group?.name || "Group Circle",
    description: `Join the conversation in ${group?.name || "this group"} on Black Sheep.`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupChatClient groupId={id} />;
}
