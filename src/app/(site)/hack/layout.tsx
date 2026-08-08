import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hack",
  description: "Interactive hack experience.",
};

export default function HackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
