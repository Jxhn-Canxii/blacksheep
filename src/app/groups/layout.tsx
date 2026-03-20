import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Circles",
  description: "Join resonance groups to filter the global noise into meaningful dialogue.",
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
