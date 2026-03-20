import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resonance Map",
  description: "Visualize global emotions and spatial echoes on the Black Sheep neural grid.",
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
