import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Essays on agentic infrastructure, LATAM ecosystems, and the Brahma101 thesis.",
};

export default function WritingPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white">
        Writing
      </h1>
      <p className="mt-4 text-white/70">
        MDX-backed posts will live here (Phase C). For now, placeholders match the
        homepage cards — update copy in{" "}
        <code className="rounded bg-black/50 px-1 font-mono text-emerald-300/90">
          src/data/home.ts
        </code>
        .
      </p>
      <p className="mt-8">
        <Link
          href="/"
          className="font-mono text-sm text-emerald-400 underline-offset-4 hover:underline"
        >
          ← Back home
        </Link>
      </p>
    </main>
  );
}
