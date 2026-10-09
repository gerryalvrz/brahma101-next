/**
 * Hydra background presets for /music — switch only, no editor.
 * Sketches read global `a.fft[n]` (fed from the set player, not the mic).
 */

export interface MusicVizPreset {
  id: string;
  label: string;
  blurb: string;
  code: string;
}

export const musicVizContent = {
  pickerLabel: "VIZ",
  offLabel: "off",
} as const;

/** Special id — hide Hydra canvas. */
export const MUSIC_VIZ_OFF = "off";

export const musicVizPresets: MusicVizPreset[] = [
  {
    id: "neon-bass",
    label: "neon.bass",
    blurb: "Green oscillator slammed by low bins.",
    code: `osc(() => 8 + a.fft[0] * 40, 0.05, () => a.fft[1] * 1.5)
  .color(0, 1, 0.2)
  .modulate(noise(() => 1 + a.fft[2] * 4), () => 0.08 + a.fft[0] * 0.4)
  .out()`,
  },
  {
    id: "kaleid-hit",
    label: "kaleid.hit",
    blurb: "Kaleidoscope that opens on transients.",
    code: `osc(6, 0.08, 1.1)
  .kaleid(() => 3 + Math.floor(a.fft[0] * 6))
  .rotate(() => time * 0.08 + a.fft[1])
  .color(0.15, 1, 0.55)
  .modulateScale(osc(3), () => 0.15 + a.fft[0] * 0.6)
  .out()`,
  },
  {
    id: "feedback-storm",
    label: "feedback.storm",
    blurb: "Self-eating buffer — bass feeds the loop.",
    code: `osc(12, 0.02, () => a.fft[3] * 2)
  .rotate(0.2, () => 0.05 + a.fft[0] * 0.2)
  .modulate(o0, () => 0.12 + a.fft[1] * 0.35)
  .blend(o0, 0.72)
  .color(0.05, 0.95, 0.35)
  .contrast(() => 1 + a.fft[0] * 0.8)
  .out()`,
  },
  {
    id: "vortex-gate",
    label: "vortex.gate",
    blurb: "Pixel spiral gated by mid energy.",
    code: `osc(() => 20 + a.fft[2] * 30, 0.01, 0.5)
  .rotate(1.57)
  .pixelate(() => 20 + a.fft[0] * 40, 16)
  .modulateRotate(osc(2), () => 0.2 + a.fft[1] * 0.8)
  .kaleid(4)
  .color(0, 0.95, 0.4)
  .out()`,
  },
  {
    id: "noise-bloom",
    label: "noise.bloom",
    blurb: "Violet noise field with neon bleed.",
    code: `noise(() => 2 + a.fft[0] * 5, 0.12)
  .color(0.45, 0.1, 0.95)
  .modulate(osc(4, 0.05, 0.5), () => 0.2 + a.fft[1] * 0.5)
  .blend(
    osc(18, 0.02, 0).color(0, 1, 0.25),
    () => 0.25 + a.fft[0] * 0.5
  )
  .out()`,
  },
  {
    id: "strip-radar",
    label: "strip.radar",
    blurb: "Hard stripes — classic hydra radar.",
    code: `osc(() => 4 + a.fft[0] * 25, 0.15, 0)
  .thresh(() => 0.4 - a.fft[1] * 0.3)
  .color(0, 1, 0.15)
  .rotate(() => a.fft[2] * 0.5)
  .modulate(noise(3), 0.05)
  .out()`,
  },
];

export function findMusicViz(id: string): MusicVizPreset | undefined {
  return musicVizPresets.find((p) => p.id === id);
}
