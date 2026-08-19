import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

/** Site-wide defaults; route segments under `src/app/(site)/` set title/description via `layout.tsx`. */
export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={vt323.variable}>
      <body className="min-h-screen overflow-y-auto bg-[var(--color-bg-1)]">
        {children}
      </body>
    </html>
  );
}
