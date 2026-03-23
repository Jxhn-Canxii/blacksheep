import ProfileClient from "./ProfileClient";
import { createClient } from "@/libs/supabaseServer";
import { Metadata } from "next";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfileClient profileId={id} />;
}
