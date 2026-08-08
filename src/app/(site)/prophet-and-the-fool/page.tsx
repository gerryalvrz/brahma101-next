import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Prophet and the Fool",
  description: "Book project — premise and progress (stub).",
};

export default function ProphetPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white">
        The Prophet and the Fool
      </h1>
      <p className="mt-4 text-white/75">
        Landing stub for the book project — premise, sample chapters, and status
        will go here.
      </p>
      <p className="mt-6 text-sm text-purple-300/90">Status: in progress</p>
      <p className="mt-8">
        <Link href="/research" className="text-emerald-400 hover:underline">
          ← Research hub
        </Link>
      </p>
    </main>
  );
}
