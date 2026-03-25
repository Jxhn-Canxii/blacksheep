"use client";

import { useUser } from "@/hooks/useUser";
import ProfileClient from "../profiles/[id]/ProfileClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * ProfilePage Component
 * 
 * Main profile page for the authenticated user.
 * Redirects to home if not logged in.
 * Reuses the ProfileClient component for consistent UI.
 */
export default function ProfilePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="bg-neutral-900 rounded-[3rem] h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 shadow-2xl"></div>
      </div>
    );
  }

  return <ProfileClient profileId={user.id} />;
}

