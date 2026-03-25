import type { Metadata, Viewport } from "next";
import "./globals.css";

import SupabaseProvider from "@/contexts/SupabaseProvider";
import UserProvider from "@/contexts/UserProvider";
import ModalProvider from "@/providers/ModalProvider";
import ToasterProvider from "@/providers/ToasterProvider";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import PageTransition from "@/components/layout/PageTransition";
import NavigationLoader from "@/components/layout/NavigationLoader";
import ConnectionStatus from "@/components/home/ConnectionStatus";
import BlackSheepAssistant from "@/components/chat/BlackSheepAssistant";
import { createClient } from "@/libs/supabaseServer";
import { getCachedTrendingFeelings } from "@/libs/cachedQueries";

interface Group {
  id: string;
  name: string;
}

interface TrendingFeeling {
  emotion: string;
  count: number;
}

interface GroupMemberRow {
  groups: Group | null;
}

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
  let recentGroups: Group[] = [];
  let trendingData: TrendingFeeling[] = [];
  
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
    recentGroups = (groupsRes.data as GroupMemberRow[])
      .map((item) => item.groups)
      .filter((g): g is Group => g !== null);
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

