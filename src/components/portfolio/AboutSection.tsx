import type { AboutContent } from "@/data/home";
import Link from "next/link";
import styles from "./portfolio.module.css";

interface AboutSectionProps {
  content: AboutContent;
}

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="about-heading">
      <h2 id="about-heading" className={styles.sectionTitle}>
        About
      </h2>
      <div className={`${styles.glass} max-w-3xl space-y-4 p-6 sm:p-8`}>
        {content.paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-sm leading-relaxed text-white/82 sm:text-base"
          >
            {p}
          </p>
        ))}
        <p className="pt-2">
          <Link
            href={content.researchHref}
            className={`${styles.linkAccent} font-mono text-sm`}
          >
            {content.researchCta}
          </Link>
        </p>
      </div>
    </section>
  );
}
