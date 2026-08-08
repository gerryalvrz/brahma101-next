import type { HeroContent } from "@/data/home";
import styles from "./portfolio.module.css";

export function Hero({
  brand,
  name,
  role,
  positioning,
  pills = [],
  primaryCta,
  secondaryCta,
}: HeroContent) {
  return (
    <section className={styles.section} aria-labelledby="hero-name">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-primary)]/90 sm:text-xs">
        {brand}
      </p>
      <h1
        id="hero-name"
        className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--color-primary)] sm:text-5xl md:text-6xl"
        style={{ textShadow: "0 0 15px #0f0" }}
      >
        {name}
      </h1>
      {role ? (
        <p className="mt-2 font-mono text-lg font-medium text-[color:var(--color-primary)] sm:text-xl">
          {role}
        </p>
      ) : null}
      {positioning ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--color-primary)]/85 sm:text-lg">
          {positioning}
        </p>
      ) : null}
      {pills.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Focus areas">
          {pills.map((pill) => (
            <li key={pill}>
              <span className="rounded-sm border border-[#0f0]/60 bg-black/60 px-3 py-1 font-mono text-xs text-[#0f0]">
                {pill}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {(primaryCta || secondaryCta) && (
        <div className="mt-8 flex flex-wrap gap-3">
          {primaryCta ? (
            <a
              href={primaryCta.href}
              className="inline-flex items-center justify-center rounded-[5px] border-2 border-[#0f0] bg-transparent px-5 py-2.5 font-vt323 text-lg text-[#0f0] transition hover:bg-[#0f0] hover:text-black"
            >
              {primaryCta.label}
            </a>
          ) : null}
          {secondaryCta ? (
            <a
              href={secondaryCta.href}
              className="inline-flex items-center justify-center rounded-[5px] border-2 border-[#0f0] bg-transparent px-5 py-2.5 font-vt323 text-lg text-[#0f0] transition hover:bg-[#0f0] hover:text-black"
            >
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}
