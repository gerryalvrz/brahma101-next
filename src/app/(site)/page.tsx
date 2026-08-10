"use client";

import dynamic from "next/dynamic";
import TypewriterText from "@/components/effects/TypewriterText";
import Footer from "@/components/layout/Footer";
import ContactBox from "@/components/home/ContactBox";
import DashboardChassis from "@/components/home/DashboardChassis";
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
const XboxOrb = dynamic(() => import("@/components/home/XboxOrb"), {
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
        <div className={styles.engineFrame} aria-hidden>
          <DashboardChassis />
        </div>

        <div className={styles.orbColumn}>
          <p className={styles.welcomeQuiet}>{h.welcome}</p>
          <div className={styles.orbStage}>
            <XboxOrb
              src="/images/brahma101.gif"
              alt="dark moon aesthetics"
              size={250}
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

      <ContactBox
        title={homeContent.contact.title}
        subtitle={homeContent.contact.subtitle}
        work={homeContent.work}
      />

      <Footer className={styles.footer} />
    </main>
  );
}
