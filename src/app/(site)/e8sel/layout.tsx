import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "E8 S.E.L.",
  description: "E8 Systems framework explorer.",
};

export default function E8SelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
