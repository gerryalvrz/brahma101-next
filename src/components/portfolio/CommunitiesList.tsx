import type { CommunityItem } from "@/data/home";
import styles from "./portfolio.module.css";

interface CommunitiesListProps {
  title: string;
  items: CommunityItem[];
}

export function CommunitiesList({ title, items }: CommunitiesListProps) {
  return (
    <section className={styles.section} aria-labelledby="communities-heading">
      <h2 id="communities-heading" className={styles.sectionTitle}>
        {title}
      </h2>
      <ul className="columns-1 gap-x-10 text-sm sm:columns-2">
        {items.map((c) => (
          <li key={c.name} className="mb-3 break-inside-avoid">
            <span className="font-semibold text-white">{c.name}</span>
            <span className="text-white/55"> — {c.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
