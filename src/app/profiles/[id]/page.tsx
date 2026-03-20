import ProfileClient from "./ProfileClient";
import { createClient } from "@/libs/supabaseServer";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', id).single();

  return {
    title: profile?.username ? `@${profile.username}` : "Profile",
    description: `View ${profile?.username || "this user"}'s profile on Black Sheep.`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfileClient profileId={id} />;
}
