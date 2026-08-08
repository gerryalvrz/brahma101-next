import type { HackathonItem } from "@/data/home";
import styles from "./portfolio.module.css";

interface HackathonsListProps {
  title: string;
  items: HackathonItem[];
}

export function HackathonsList({ title, items }: HackathonsListProps) {
  return (
    <section className={styles.section} aria-labelledby="hackathons-heading">
      <h2 id="hackathons-heading" className={styles.sectionTitle}>
        {title}
      </h2>
      <ul className={`${styles.glass} divide-y divide-[rgba(53,255,107,0.12)]`}>
        {items.map((item) => (
          <li key={item.title} className="px-5 py-4 sm:px-6">
            <p className="font-mono text-sm font-semibold text-white">
              {item.title}
            </p>
            {item.detail ? (
              <p className="mt-1 text-sm text-white/65">{item.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
