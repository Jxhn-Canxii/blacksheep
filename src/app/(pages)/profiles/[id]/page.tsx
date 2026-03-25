import ProfileClient from "./ProfileClient";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/profiles/${id}`, {
    cache: 'no-store',
  });
  const profile = res.ok ? (await res.json()).profile : null;

  return {
    title: profile?.username ? `@${profile.username}` : "Profile",
    description: `View ${profile?.username || "this user"}'s profile on Black Sheep.`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfileClient profileId={id} />;
}
