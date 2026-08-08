import type { MediaPlaceholder } from "@/data/home";
import styles from "./portfolio.module.css";

interface MediaCardsProps {
  title: string;
  note: string;
  items: MediaPlaceholder[];
}

export function MediaCards({ title, note, items }: MediaCardsProps) {
  return (
    <section className={styles.section} aria-labelledby="media-heading">
      <h2 id="media-heading" className={styles.sectionTitle}>
        {title}
      </h2>
      <p className={styles.note}>{note}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.description}
            className={`${styles.glass} overflow-hidden`}
          >
            <div className="flex aspect-video items-center justify-center bg-black/60 font-mono text-xs uppercase tracking-widest text-[color:var(--color-primary)]/55">
              {item.title}
            </div>
            <p className="p-4 text-sm leading-relaxed text-white/75">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
