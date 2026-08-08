import type { Metadata } from "next";

const description =
  "Building agentic systems and ecosystems at the intersection of AI, Web3, and human consciousness. Based in Mexico City.";

export const metadata: Metadata = {
  metadataBase: new URL("https://brahma101.cyou"),
  title: {
    default: "Gerry Alvarez · Builder & Ecosystem Lead",
    template: "%s · brahma101.cyou",
  },
  description,
  openGraph: {
    title: "Gerry Alvarez · Builder & Ecosystem Lead",
    description,
    url: "https://brahma101.cyou",
    siteName: "brahma101.cyou",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gerry Alvarez · Builder & Ecosystem Lead",
    description,
  },
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
