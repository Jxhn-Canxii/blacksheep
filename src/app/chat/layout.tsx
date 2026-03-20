import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neural Link",
  description: "Private and global real-time dialogue channels for Black Sheep.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
