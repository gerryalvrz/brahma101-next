"use client";

import dynamic from "next/dynamic";
import GlowImage from "@/components/ui/GlowImage";
import TypewriterText from "@/components/effects/TypewriterText";
import Footer from "@/components/layout/Footer";
import ContactBox from "@/components/home/ContactBox";
import WorkLinks from "@/components/home/WorkLinks";
import { homeContent } from "@/data/home";
import styles from "./home.module.css";

const MatrixRain = dynamic(() => import("@/components/effects/MatrixRain"), {
  ssr: false,
});
const ParticlesBackground = dynamic(
  () => import("@/components/effects/ParticlesBackground"),
  { ssr: false }
);
const SphereGrid = dynamic(() => import("@/components/effects/SphereGrid"), {
  ssr: false,
});
const TerminalTyper = dynamic(() => import("@/components/effects/TerminalTyper"), {
  ssr: false,
});

export default function HomePage() {
  const h = homeContent.hero;
  return (
    <main className={styles.main}>
      <MatrixRain opacity={0.2} />
      <div className={styles.plasmaField} aria-hidden />
      <SphereGrid opacity={0.32} />
      <ParticlesBackground />

      <section className={styles.dashboard}>
        <div className={styles.orbColumn}>
          <p className={styles.welcomeQuiet}>{h.welcome}</p>
          <div className={styles.orbStage}>
            <div className={styles.plasma} aria-hidden />
            <GlowImage
              src="/images/brahma101.gif"
              alt="dark moon aesthetics"
              width={250}
              height={250}
              className={styles.orbImage}
            />
          </div>
          <h1 className={styles.name}>{h.brand}</h1>
          <p className={styles.tagline}>
            <span>The Art of&nbsp;</span>
            <TypewriterText words={h.artOfWords} />
          </p>
          <p className={styles.welcomeSub}>{h.welcomeSub}</p>
        </div>

        <div className={styles.menuColumn}>
          <WorkLinks work={homeContent.work} />
        </div>
      </section>

      <section className={styles.narrative}>
        <h2 className={styles.expectLine}>
          <span>expect&nbsp;</span>
          <TypewriterText words={h.expectWords} />
        </h2>
        <p>{h.narrative}</p>
      </section>

      <TerminalTyper
        className={styles.terminalBox}
        scanLineClassName={styles.scanLine}
      />

      <ContactBox
        title={homeContent.contact.title}
        subtitle={homeContent.contact.subtitle}
      />

      <Footer className={styles.footer} />
    </main>
  );
}
