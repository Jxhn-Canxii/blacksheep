import LandingClient from "@/app/(pages)/landing/page";
import { createClient } from "@/libs/supabaseServer";
import HomeClient from "@/app/(pages)/home/page";
import { getCachedVents } from "@/libs/cachedQueries";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingClient />;
  }

  // Pre-fetch initial vents for faster LCP
  const initialVents = await getCachedVents(0, 5);

  return <HomeClient initialVents={initialVents} />;
}

