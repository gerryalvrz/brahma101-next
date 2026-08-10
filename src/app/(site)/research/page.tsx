import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Brahma101 deeper layer — music, cognition, E8, and side quests.",
};

const links = [
  { href: "/music", label: "Metacognitive Music" },
  { href: "/locognitive", label: "Locognitive" },
  { href: "/e8sel", label: "E8 S.E.L." },
  { href: "/hack", label: "Hack" },
  { href: "/art", label: "Generative art · Hydra" },
  {
    href: "/prophet-and-the-fool",
    label: "The Prophet and the Fool (book)",
  },
] as const;

export default function ResearchPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-purple-200">
        Brahma101 · Research
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-white/75">
        Not promoted from the hero — for curious visitors who want the mystical /
        technical rabbit holes.
      </p>
      <ul className="mt-10 space-y-3 font-mono text-sm">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-emerald-400 underline-offset-4 hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-12">
        <Link href="/" className="text-sm text-white/50 hover:text-white/80">
          ← Operator homepage
        </Link>
      </p>
    </main>
  );
}
