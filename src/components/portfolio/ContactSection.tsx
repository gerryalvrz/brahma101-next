import type { ContactLink } from "@/data/home";
import styles from "./portfolio.module.css";

interface ContactSectionProps {
  id?: string;
  title: string;
  statusLine: string;
  links: ContactLink[];
}

export function ContactSection({
  id = "contact",
  title,
  statusLine,
  links,
}: ContactSectionProps) {
  return (
    <section
      id={id}
      className={styles.section}
      aria-labelledby="contact-heading"
    >
      <h2 id="contact-heading" className={styles.sectionTitle}>
        {title}
      </h2>
      <p className="mb-6 text-sm text-white/60">{statusLine}</p>
      <ul className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={
                link.href.startsWith("http") ? "_blank" : undefined
              }
              rel={
                link.href.startsWith("http") ? "noopener noreferrer" : undefined
              }
              className={`${styles.linkAccent} underline-offset-4`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
