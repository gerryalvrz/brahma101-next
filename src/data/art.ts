/**
 * Generative art for /art — Hydra livecoding language.
 * Engine: hydra-synth (https://github.com/hydra-synth/hydra-synth)
 * Lessons follow: https://hydra.ojack.xyz/docs/docs/learning/getting-started/
 */

export interface ArtSketch {
  id: string;
  label: string;
  blurb: string;
  code: string;
}

export const artContent = {
  title: "ART",
  subtitle: "Livecoded visuals · hydra-synth",
  lessonsTitle: "getting started",
  sketchesTitle: "brahma",
  credit: {
    label: "hydra-synth by Olivia Jack",
    href: "https://hydra.ojack.xyz",
  },
  docsHref: "https://hydra.ojack.xyz/docs/docs/learning/getting-started/",
  editorHint: "Edit · Ctrl/⌘+Enter to run",
} as const;

/** Progressive examples from Hydra’s getting-started tutorial. */
export const artLessons: ArtSketch[] = [
  {
    id: "osc",
    label: "osc()",
    blurb: "First line — a visual oscillator (scrolling stripes).",
    code: `osc().out()`,
  },
  {
    id: "osc-freq",
    label: "osc(10)",
    blurb: "Same oscillator with frequency set to 10.",
    code: `osc(10).out()`,
  },
  {
    id: "osc-params",
    label: "osc(freq, sync, offset)",
    blurb: "Frequency, sync, and color offset.",
    code: `osc(20, 0.1, 0.8).out()`,
  },
  {
    id: "rotate",
    label: ".rotate()",
    blurb: "Chain a geometry transform after the source.",
    code: `osc(20, 0.1, 0.8)
  .rotate(0.8)
  .out()`,
  },
  {
    id: "chain",
    label: ".pixelate()",
    blurb: "Keep chaining — rotate then pixelate.",
    code: `osc(20, 0.1, 0.8)
  .rotate(0.8)
  .pixelate(20, 30)
  .out()`,
  },
  {
    id: "webcam",
    label: "initCam()",
    blurb: "Activate the webcam and draw it to the screen.",
    code: `s0.initCam()
src(s0).out()`,
  },
  {
    id: "webcam-kaleid",
    label: "cam.kaleid()",
    blurb: "Webcam through a kaleidoscope.",
    code: `s0.initCam()
src(s0)
  .kaleid(4)
  .out()`,
  },
  {
    id: "multi-out",
    label: "render()",
    blurb: "Four output buffers at once — o0…o3.",
    code: `osc(40, 0.1, 1).out(o0)
osc(40, 0.1, 1).rotate(0.5).out(o1)
osc(40, 0.1, 1).rotate(1.0).out(o2)
osc(40, 0.1, 1).rotate(1.5).out(o3)
render()`,
  },
  {
    id: "blend",
    label: ".blend()",
    blurb: "Blend two buffers into a third, then show it.",
    code: `osc(10).out(o0)
osc(20).rotate(0.1).out(o1)
src(o0).blend(o1, 0.5).out(o2)
render(o2)`,
  },
  {
    id: "modulate",
    label: ".modulate()",
    blurb: "Warp the webcam with an oscillator.",
    code: `s0.initCam()
src(s0)
  .modulate(osc(10, 0.1, 0.5), 0.5)
  .out()`,
  },
  {
    id: "chain-blend",
    label: ".diff()",
    blurb: "Blend sources in one chain — no extra buffers needed.",
    code: `osc(10)
  .rotate(0.5)
  .diff(osc(200))
  .out()`,
  },
];

export const artSketches: ArtSketch[] = [
  {
    id: "matrix-pulse",
    label: "matrix.pulse",
    blurb: "Neon oscillator — the house frequency.",
    code: `osc(18, 0.08, 0)
  .color(0, 1, 0.15)
  .modulate(noise(2.5), 0.12)
  .out()`,
  },
  {
    id: "lattice",
    label: "e8.lattice",
    blurb: "Kaleidoscopic lattice under slow spin.",
    code: `osc(6, 0.1, 1.2)
  .kaleid(5)
  .rotate(() => time * 0.05)
  .color(0.2, 1, 0.55)
  .modulateScale(osc(3, 0.05), 0.2)
  .out()`,
  },
  {
    id: "feedback",
    label: "feedback.loop",
    blurb: "Self-modulating buffer — recursive eye.",
    code: `osc(12, 0.03, 0.8)
  .rotate(0.2, 0.1)
  .modulate(o0, () => 0.1 + Math.sin(time) * 0.05)
  .blend(o0, 0.7)
  .color(0.1, 0.9, 0.4)
  .out()`,
  },
  {
    id: "nebula",
    label: "nebula.drift",
    blurb: "Soft noise field with violet bleed.",
    code: `noise(3, 0.1)
  .color(0.4, 0.1, 0.9)
  .modulate(osc(4, 0.05, 0.5), 0.3)
  .blend(
    osc(20, 0.02, 0).color(0, 1, 0.2),
    0.35
  )
  .out()`,
  },
  {
    id: "vortex",
    label: "vortex.gate",
    blurb: "Pixelated spiral — portal static.",
    code: `osc(30, 0.01, 0.5)
  .rotate(1.57)
  .pixelate(40, 20)
  .modulateRotate(osc(2), 0.4)
  .kaleid(4)
  .color(0, 0.95, 0.35)
  .out()`,
  },
];

export function findArtSnippet(id: string): ArtSketch | undefined {
  return (
    artLessons.find((s) => s.id === id) ?? artSketches.find((s) => s.id === id)
  );
}
