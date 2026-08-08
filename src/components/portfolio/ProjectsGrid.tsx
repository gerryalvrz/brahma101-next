import type { ProjectCard, ProjectStatus } from "@/data/home";
import styles from "./portfolio.module.css";

const statusStyles: Record<ProjectStatus, string> = {
  live:
    "border-[rgba(53,255,107,0.45)] bg-[rgba(53,255,107,0.1)] text-[color:var(--color-primary)]",
  active:
    "border-white/25 bg-white/[0.06] text-[color:var(--color-accent)]",
  dev: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  beta: "border-zinc-500/40 bg-zinc-950/50 text-zinc-300",
};

interface ProjectsGridProps {
  id?: string;
  title: string;
  projects: ProjectCard[];
}

export function ProjectsGrid({ id = "projects", title, projects }: ProjectsGridProps) {
  return (
    <section
      id={id}
      className={styles.section}
      aria-labelledby="projects-heading"
    >
      <h2 id="projects-heading" className={styles.sectionTitle}>
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <article key={p.name} className={`${styles.glass} flex flex-col p-5`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                {p.name}
              </h3>
              <span
                className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${statusStyles[p.status]}`}
              >
                {p.status}
              </span>
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-white/75">
              {p.description}
            </p>
            <a
              href={p.href}
              target={p.href.startsWith("http") ? "_blank" : undefined}
              rel={p.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`${styles.linkAccent} mt-4 inline-flex font-mono text-sm underline-offset-4`}
            >
              Open →
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
