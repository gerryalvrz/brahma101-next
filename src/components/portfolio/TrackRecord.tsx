import type { MetricCard } from "@/data/home";
import styles from "./portfolio.module.css";

interface TrackRecordProps {
  title: string;
  metrics: MetricCard[];
}

export function TrackRecord({ title, metrics }: TrackRecordProps) {
  return (
    <section className={styles.section} aria-labelledby="track-record-heading">
      <h2 id="track-record-heading" className={styles.sectionTitle}>
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {metrics.map((card) => (
          <article
            key={card.id}
            className={`${styles.glass} p-5 sm:p-6`}
          >
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[color:var(--color-primary)]">
              {card.title}
            </h3>
            <ul className="mt-4 space-y-2 font-mono text-sm leading-relaxed text-white/88">
              {card.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
