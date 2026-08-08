import type { WritingPlaceholder } from "@/data/home";
import Link from "next/link";
import styles from "./portfolio.module.css";

interface WritingStubProps {
  title: string;
  items: WritingPlaceholder[];
  writingHref: string;
}

export function WritingStub({ title, items, writingHref }: WritingStubProps) {
  return (
    <section className={styles.section} aria-labelledby="writing-heading">
      <h2 id="writing-heading" className={styles.sectionTitle}>
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className={`${styles.glass} p-5`}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-accent)]/75">
              Coming soon
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-base font-semibold text-white">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-white/60">{item.description}</p>
          </article>
        ))}
      </div>
      <p className="mt-6">
        <Link
          href={writingHref}
          className={`${styles.linkAccent} font-mono text-sm underline-offset-4`}
        >
          Writing index →
        </Link>
      </p>
    </section>
  );
}
