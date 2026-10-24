import type { VjSketchSynth } from "./sketch";

/** Preview buffer: 32:9, moderate so four Hydra outputs stay light. */
export const VJ_PREVIEW_WIDTH = 1920;
export const VJ_PREVIEW_HEIGHT = 540;

export const vjPresets = [
  {
    id: "blend",
    label: "Blend",
    detail: "video + osc()",
    code: "src(s0).blend(osc(8, 0.08, 0.7), intensity).out()",
  },
  {
    id: "modulate",
    label: "Modulate",
    detail: "video + noise()",
    code: "src(s0).modulate(noise(3, 0.1), intensity * 0.4).out()",
  },
  {
    id: "kaleid",
    label: "Kaleidoscope",
    detail: "video + kaleid()",
    code: "src(s0).blend(src(s0).kaleid(4), intensity).out()",
  },
] as const;

export type VjPresetId = (typeof vjPresets)[number]["id"];

export type VjHydra = {
  synth: VjSketchSynth;
  tick: (dt: number) => void;
  hush: () => void;
  setResolution: (width: number, height: number) => void;
};
