import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Art",
  description: "Generative art — Hydra fork placeholder.",
};

export default function ArtPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white">
        Art
      </h1>
      <p className="mt-4 text-white/70">
        Stub for a future Hydra fork (
        <span className="font-mono text-xs text-purple-300">hydra.ojack.xyz</span>
        ). Nothing to run here yet.
      </p>
      <p className="mt-8">
        <Link href="/research" className="text-emerald-400 hover:underline">
          ← Research hub
        </Link>
      </p>
    </main>
  );
}
