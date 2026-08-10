/**
 * Livecoding music for /create-music — Strudel pattern language.
 * Engine: @strudel/web (https://strudel.cc)
 * Lessons follow: https://strudel.cc/workshop/first-sounds/
 */

export interface MusicPattern {
  id: string;
  label: string;
  blurb: string;
  code: string;
}

export const musicContent = {
  title: "CREATE MUSIC",
  subtitle: "Livecoded patterns · strudel",
  lessonsTitle: "getting started",
  sketchesTitle: "brahma",
  credit: {
    label: "Strudel by tidalcycles / uzu",
    href: "https://strudel.cc",
  },
  docsHref: "https://strudel.cc/workshop/first-sounds/",
  editorHint: "Edit · Ctrl/⌘+Enter play · Ctrl/⌘+. stop",
  toastShare: "Share link copied",
  toastDice: "Values mutated",
  toastPlay: "Playing",
  toastStop: "Stopped",
  toastSamples: "Dirt samples loaded",
  toastSamplesFail: "Samples failed — synth patterns still work",
} as const;

/** Progressive examples from Strudel’s first-sounds workshop + synths. */
export const musicLessons: MusicPattern[] = [
  {
    id: "note",
    label: "note()",
    blurb: "First line — a melodic pattern (synth).",
    code: `note("c a f e")`,
  },
  {
    id: "euclid",
    label: "euclid (3,8)",
    blurb: "Euclidean rhythm on the same notes, mirrored left/right.",
    code: `note("<c a f e>(3,8)").jux(rev)`,
  },
  {
    id: "scale",
    label: "scale + sawtooth",
    blurb: "Scale degrees through a sawtooth synth.",
    code: `n("0 2 4 7 4 2")
  .scale("C:minor")
  .s("sawtooth")
  .lpf(1200)`,
  },
  {
    id: "drums",
    label: "sound(bd sd)",
    blurb: "Classic Dirt drums — needs samples (loaded on boot).",
    code: `sound("bd sd hh cp")`,
  },
  {
    id: "drums-rest",
    label: "rests · ~",
    blurb: "Leave space with ~ or -.",
    code: `sound("bd hh ~ rim ~ bd hh rim")`,
  },
  {
    id: "subseq",
    label: "[sub] *speed",
    blurb: "Sub-sequences and multipliers.",
    code: `sound("bd [hh hh] sd [hh*2 bd] bd ~ [hh sd] cp")`,
  },
  {
    id: "parallel",
    label: "parallel ,",
    blurb: "Layers in one cycle — comma = parallel.",
    code: `sound("bd*2, hh*8, ~ cp ~ cp")`,
  },
  {
    id: "setcpm",
    label: "setcpm()",
    blurb: "Tempo as cycles per minute (≈ bpm/4 in 4/4).",
    code: `setcpm(100/4)
sound("[bd sd]*2, hh*8")`,
  },
  {
    id: "stack-fx",
    label: "stack · room",
    blurb: "Stack melody + drums with space.",
    code: `setcpm(90/4)
stack(
  sound("bd*4, [~ cp]*2, hh*8"),
  note("<c3 eb3 g3 bb3>*4")
    .s("triangle")
    .lpf(sine.range(400, 2400).slow(8))
    .room(1.2)
    .gain(0.55)
)`,
  },
  {
    id: "chord-pad",
    label: "voicing pad",
    blurb: "Slow chord stabs with filter drift.",
    code: `n("<0 2 4 6>")
  .scale("A:minor")
  .s("sawtooth")
  .slow(2)
  .room(2)
  .lpf(perlin.range(300, 2000).slow(4))
  .gain(0.45)`,
  },
];

export const musicSketches: MusicPattern[] = [
  {
    id: "matrix-pulse",
    label: "matrix.pulse",
    blurb: "Neon pulse — house kick grid + acid line.",
    code: `setcpm(124/4)
stack(
  sound("bd*4, [~ cp]*2, [~ hh]*4").gain(0.9),
  note("c2 [eb2 g2] c2 [bb1 g2]")
    .s("sawtooth")
    .lpf(sine.range(200, 1800).slow(4))
    .lpq(8)
    .room(0.8)
    .gain(0.5)
)`,
  },
  {
    id: "lattice",
    label: "e8.lattice",
    blurb: "Lattice of fifths under a soft hat rain.",
    code: `setcpm(96/4)
stack(
  sound("hh*16").gain(0.25),
  n("<0 4 7 11 7 4>*2")
    .scale("E:dorian")
    .s("triangle")
    .jux(rev)
    .room(1.5)
    .delay(0.25)
    .delaytime(0.33)
    .gain(0.4)
)`,
  },
  {
    id: "feedback",
    label: "feedback.loop",
    blurb: "Euclid kick vs delayed bells.",
    code: `setcpm(110/4)
stack(
  sound("bd(3,8), cp(5,16)").gain(0.85),
  note("<a4 c5 e5 g5>(5,8)")
    .s("sine")
    .delay(0.4)
    .delaytime(0.25)
    .delayfeedback(0.55)
    .room(2)
    .gain(0.35)
)`,
  },
  {
    id: "nebula",
    label: "nebula.drift",
    blurb: "Sparse tones in a wide room.",
    code: `setcpm(60/4)
note("<c3 ~ eb3 ~ g3 ~ bb2 ~>*2")
  .s("triangle")
  .slow(2)
  .room(3)
  .lpf(perlin.range(200, 1200).slow(8))
  .gain(0.5)`,
  },
  {
    id: "vortex",
    label: "vortex.gate",
    blurb: "Gated noise stabs over a rolling break.",
    code: `setcpm(140/4)
stack(
  sound("bd sd [bd bd] sd, hh*8").gain(0.8),
  note("c1*8")
    .s("square")
    .lpf(800)
    .lpq(12)
    .gain(sine.range(0.1, 0.45).fast(4))
)`,
  },
];

export function findMusicPattern(id: string): MusicPattern | undefined {
  return (
    musicLessons.find((p) => p.id === id) ??
    musicSketches.find((p) => p.id === id)
  );
}
