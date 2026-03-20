import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neural Search",
  description: "Find specific stress bubbles and neural signals on the Black Sheep network.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
