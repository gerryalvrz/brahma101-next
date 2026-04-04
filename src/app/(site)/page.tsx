"use client";

import dynamic from "next/dynamic";
import NeonButton from "@/components/ui/NeonButton";
import GlowImage from "@/components/ui/GlowImage";
import Footer from "@/components/layout/Footer";

const MatrixRain = dynamic(() => import("@/components/effects/MatrixRain"), {
  ssr: false,
});
const ParticlesBackground = dynamic(
  () => import("@/components/effects/ParticlesBackground"),
  { ssr: false }
);
const TerminalTyper = dynamic(
  () => import("@/components/effects/TerminalTyper"),
  { ssr: false }
);
const TypewriterText = dynamic(
  () => import("@/components/effects/TypewriterText"),
  { ssr: false }
);

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen p-5 relative">
      <MatrixRain opacity={0.4} />
      <ParticlesBackground />

      {/* Terminal Box */}
      <TerminalTyper />

      {/* Main content */}
      <div className="mt-8 text-center">
        <h1 className="font-vt323 text-4xl text-neon text-shadow-neon-strong">
          Welcome to the dance of Dimensions
        </h1>
        <p className="mb-5">No one to hold accountable, but yourself.</p>

        <GlowImage
          src="/images/brahma101.gif"
          alt="dark moon aesthetics"
          width={250}
          height={250}
        />

        <header className="mt-8">
          <h1 className="font-vt323 text-5xl text-neon text-shadow-neon-strong text-center">
            brahma101.eth
          </h1>
          <p className="flex items-baseline justify-center text-xl my-2.5">
            <span>The Art of&nbsp;</span>
            <TypewriterText words={["(r)evolution", "creation"]} />
          </p>
        </header>

        {/* Navigation buttons */}
        <div className="my-8 flex flex-wrap justify-center">
          <NeonButton href="https://www.motusdao.org" external>
            MotusDAO
          </NeonButton>
          <NeonButton href="https://www.refimexico.org" external>
            ReFiMexico
          </NeonButton>
          <NeonButton href="https://www.celomexico.org" external>
            CeloMexico
          </NeonButton>
          <NeonButton href="/music">Metacognitive Music</NeonButton>
          <NeonButton href="/locognitive">Locognitive</NeonButton>
          <NeonButton href="/e8sel">E8 S.E.L.</NeonButton>
          <NeonButton href="https://imm-jet.vercel.app/" external>
            Impact Market Maker
          </NeonButton>
        </div>

        {/* Narrative section */}
        <section className="my-12">
          <h2 className="flex items-baseline justify-center font-vt323 text-2xl">
            <span>expect&nbsp;</span>
            <TypewriterText words={["chaos", "(r)evolution"]} />
          </h2>
          <p className="mt-4">
            Weaving the unseen threads of reality into manifested forms.
          </p>
        </section>

        <Footer />
      </div>
    </main>
  );
}
