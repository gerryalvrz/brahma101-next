import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locognitive",
  description: "Locognitive — ASCII and AI imagery.",
};

export default function LocognitiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
