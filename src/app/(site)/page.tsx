"use client";

import dynamic from "next/dynamic";
import GlowImage from "@/components/ui/GlowImage";
import TypewriterText from "@/components/effects/TypewriterText";
import Footer from "@/components/layout/Footer";
import { homeContent } from "@/data/home";
import styles from "./home.module.css";

const MatrixRain = dynamic(() => import("@/components/effects/MatrixRain"), {
  ssr: false,
});
const ParticlesBackground = dynamic(
  () => import("@/components/effects/ParticlesBackground"),
  { ssr: false }
);
const TerminalTyper = dynamic(() => import("@/components/effects/TerminalTyper"), {
  ssr: false,
});

export default function HomePage() {
  const h = homeContent.hero;
  return (
    <main className={styles.main}>
      <MatrixRain opacity={0.4} />
      <ParticlesBackground />

      <TerminalTyper className={styles.terminalBox} scanLineClassName={styles.scanLine} />

      <section className={styles.hero}>
        <h2 className={styles.welcome}>{h.welcome}</h2>
        <p className={styles.tag}>{h.welcomeSub}</p>
        <div className={styles.visual}>
          <GlowImage
            src="/images/brahma101.gif"
            alt="dark moon aesthetics"
            width={250}
            height={250}
          />
        </div>
        <h1 className={styles.name}>{h.brand}</h1>
        <p className={styles.tagline}>
          <span>The Art of&nbsp;</span>
          <TypewriterText words={h.artOfWords} />
        </p>
        <div className={styles.buttonRow}>
          {h.quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={styles.button}
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <section className={styles.narrative}>
        <h2>
          <span>expect&nbsp;</span>
          <TypewriterText words={h.expectWords} />
        </h2>
        <p>{h.narrative}</p>
      </section>

      <Footer className={styles.footer} />
    </main>
  );
}
