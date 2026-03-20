import Header from "@/components/Header";
import VentFeed from "@/components/VentFeed";
import VentForm from "@/components/VentForm";
import LandingClient from "@/components/LandingClient";
import { createClient } from "@/libs/supabaseServer";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingClient />;
  }

  return (
    <div className="bg-neutral-900 rounded-[2rem] h-full w-full overflow-y-auto relative border border-white/5 shadow-2xl glass-scroll">
      <Header className="bg-gradient-to-b from-emerald-900/60 to-black p-4 px-6 md:p-6 md:px-8">
        <div className="mb-4">
          <h1 className="text-white text-3xl lg:text-4xl font-black italic tracking-tighter uppercase drop-shadow-2xl">
            Stress <span className="text-emerald-500 underline decoration-emerald-500/20">Bubbles</span>
          </h1>
          <p className="text-neutral-300 mt-1.5 font-medium max-w-sm text-sm">
            Release your thoughts into the sky. They float as bubbles for the world to hear.
          </p>
        </div>
      </Header>
      
      <div className="p-4 px-6 md:p-8 relative z-10">
        <VentForm />
        <div className="mt-8">
          <div className="flex items-center gap-x-4 mb-4">
            <h2 className="text-xl font-bold text-white tracking-tight uppercase italic">Recent <span className="text-emerald-500">Releases</span></h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
          </div>
          <VentFeed />
        </div>
      </div>

      {/* Decorative background blurs */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
