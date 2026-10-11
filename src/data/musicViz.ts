/**
 * Hydra background presets for /music — switch only, no editor.
 * Sketches read global `a.fft[n]` (fed from the set player, not the mic).
 *
 * Community sketches keep their original license headers (CC BY-NC-SA / public domain).
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
  /** Shown while random mode is active (click to disable). */
  randomOffLabel: "random off",
  /** Shown while random mode is idle (click to enable). */
  randomOnLabel: "random on",
} as const;

/** Special id — hide Hydra canvas. */
export const MUSIC_VIZ_OFF = "off";

/** Random switch delays (seconds) — short so the room keeps moving. */
export const MUSIC_VIZ_RANDOM_SECS = [2, 3, 4, 5, 6, 8] as const;

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
  {
    id: "flor-posterize",
    label: "flor.posterize",
    blurb: "Flor de Fuego — posterize rotate · CC BY-NC-SA 4.0",
    code: `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// Flor de Fuego — https://flordefuego.github.io/
osc(30,0.01,1)
.mult(osc(20,-0.1,1).modulate(noise(3,1)).rotate(0.7))
.posterize([3,10,2].fast(0.5).smooth(1))
.modulateRotate(o0,()=>mouse.x*0.003)
.out()`,
  },
  {
    id: "naoto-pixelate",
    label: "naoto.pixel",
    blurb: "@naoto_hieda — modulatePixelate stack · CC BY-NC-SA 4.0",
    code: `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// @naoto_hieda
osc(20, 0.1, 0).color(0, 1, 2).rotate(1.57/2).out(o1)
osc(30, 0.01, 0).color(2, 0.7, 1).modulate(o1, 0).add(o1,1).modulatePixelate(o1,1,10).out(o0)`,
  },
  {
    id: "flor-voronoi",
    label: "flor.voronoi",
    blurb: "Flor de Fuego — voronoi kaleid feedback · CC BY-NC-SA 4.0",
    code: `// licensed with CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
// Flor de Fuego — https://gist.github.com/flordefuego/c35b4114cc2defbe77152e18aa17598b
voronoi(8,1)
.mult(osc(10,0.1,()=>Math.sin(time)*3).saturate(3).kaleid(200))
.modulate(o0,0.5)
.add(o0,0.8)
.scrollY(-0.01)
.scale(0.99)
.modulate(voronoi(8,1),0.008)
.luma(0.3)
.out()
speed = 0.1`,
  },
  {
    id: "hydra-hue-kaleid",
    label: "hue.kaleid",
    blurb: "Hydra Book pattern — hue + kaleid warp · public domain",
    code: `// Hydra Book snippets — public domain https://hydra-book.glitches.me/
osc(40, 0.1, 1)
  .hue(-0.1)
  .modulate(noise(1, 0), 0.5)
  .modulateRotate(osc(12, 0).kaleid(100), 4)
  .blend(o0, 0.65)
  .modulateScale(noise(2), () => 0.1 + a.fft[0] * 0.35)
  .out()`,
  },
];

export function findMusicViz(id: string): MusicVizPreset | undefined {
  return musicVizPresets.find((p) => p.id === id);
}

export function randomMusicVizId(exclude?: string): string {
  const ids = musicVizPresets.map((p) => p.id);
  if (ids.length === 0) return MUSIC_VIZ_OFF;
  if (ids.length === 1) return ids[0]!;
  let next = ids[Math.floor(Math.random() * ids.length)]!;
  let guard = 0;
  while (next === exclude && guard < 8) {
    next = ids[Math.floor(Math.random() * ids.length)]!;
    guard += 1;
  }
  return next;
}

export function randomMusicVizDelayMs(): number {
  const secs =
    MUSIC_VIZ_RANDOM_SECS[
      Math.floor(Math.random() * MUSIC_VIZ_RANDOM_SECS.length)
    ] ?? 4;
  return secs * 1000;
}
