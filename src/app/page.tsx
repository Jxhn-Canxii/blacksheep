import LandingClient from "@/components/LandingClient";
import { createClient } from "@/libs/supabaseServer";
import HomeClient from "@/components/HomeClient";
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
