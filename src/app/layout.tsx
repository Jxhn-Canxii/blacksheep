import type { Metadata, Viewport } from "next";
import "./globals.css";

import SupabaseProvider from "@/providers/SupabaseProvider";
import UserProvider from "@/providers/UserProvider";
import ModalProvider from "@/providers/ModalProvider";
import ToasterProvider from "@/providers/ToasterProvider";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import PageTransition from "@/components/PageTransition";
import NavigationLoader from "@/components/NavigationLoader";
import ConnectionStatus from "@/components/ConnectionStatus";
import BlackSheepAssistant from "@/components/BlackSheepAssistant";
import { createClient } from "@/libs/supabaseServer";
import { getCachedTrendingFeelings } from "@/libs/cachedQueries";

export const metadata: Metadata = {
  title: {
    default: "Black Sheep",
    template: "%s | Black Sheep"
  },
  description: "A safe space for the black sheep of the family.",
  applicationName: "Black Sheep",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Black Sheep",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
  viewportFit: "cover",
};



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Optimized server-side fetch for common layout data
  let recentGroups: any[] = [];
  let trendingData: any[] = [];
  
  // Parallel fetch for better performance
  const [groupsRes, trendingRes] = await Promise.all([
    user ? supabase
      .from('group_members')
      .select('groups (id, name)')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .limit(5) : Promise.resolve({ data: null }),
    getCachedTrendingFeelings()
  ]);

  if (groupsRes.data) {
    recentGroups = groupsRes.data.map((item: any) => item.groups);
  }
  trendingData = trendingRes;

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-black text-white">
        <SupabaseProvider>
          <NavigationLoader />
          <ConnectionStatus />
          <ToasterProvider />
          <UserProvider>
            <ModalProvider />
            {user ? (
              <>
                <Sidebar initialRecentGroups={recentGroups} initialTrendingData={trendingData}>
                  <PageTransition>
                    {children}
                  </PageTransition>
                </Sidebar>
                <MobileNav />
                <BlackSheepAssistant vents={trendingData} />
              </>
            ) : (
              <PageTransition>
                <div className="min-h-screen bg-black">
                  {children}
                </div>
              </PageTransition>
            )}
          </UserProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
