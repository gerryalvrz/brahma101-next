import type { ParamFnDef } from "./param-types";

/** Strudel functions with numeric args — mirrors strudelAssistDocs. */
export const strudelParamCatalog: ParamFnDef[] = [
  // Timing
  {
    name: "setcps",
    kind: "call",
    category: "Timing",
    args: [{ name: "cps", min: 0.05, max: 4, step: 0.01 }],
  },
  {
    name: "setcpm",
    kind: "call",
    category: "Timing",
    args: [{ name: "cpm", min: 20, max: 200, step: 1 }],
  },

  // Transforms
  {
    name: "fast",
    kind: "method",
    category: "Transforms",
    args: [{ name: "n", min: 0.125, max: 16, step: 0.125 }],
  },
  {
    name: "slow",
    kind: "method",
    category: "Transforms",
    args: [{ name: "n", min: 0.125, max: 16, step: 0.125 }],
  },
  {
    name: "gain",
    kind: "method",
    category: "Dynamics",
    args: [{ name: "n", min: 0, max: 2, step: 0.01 }],
  },
  {
    name: "velocity",
    kind: "method",
    category: "Dynamics",
    args: [{ name: "n", min: 0, max: 2, step: 0.01 }],
  },
  {
    name: "pan",
    kind: "method",
    category: "Dynamics",
    args: [{ name: "n", min: 0, max: 1, step: 0.01 }],
  },

  // Filters / FX
  {
    name: "lpf",
    kind: "method",
    category: "Filters",
    args: [{ name: "hz", min: 20, max: 8000, step: 10 }],
  },
  {
    name: "hpf",
    kind: "method",
    category: "Filters",
    args: [{ name: "hz", min: 20, max: 8000, step: 10 }],
  },
  {
    name: "bpf",
    kind: "method",
    category: "Filters",
    args: [{ name: "hz", min: 20, max: 8000, step: 10 }],
  },
  {
    name: "lpq",
    kind: "method",
    category: "Filters",
    args: [{ name: "q", min: 0.1, max: 20, step: 0.1 }],
  },
  {
    name: "room",
    kind: "method",
    category: "FX",
    args: [{ name: "n", min: 0, max: 1, step: 0.01 }],
  },
  {
    name: "delay",
    kind: "method",
    category: "FX",
    args: [{ name: "n", min: 0, max: 1, step: 0.01 }],
  },
  {
    name: "delaytime",
    kind: "method",
    category: "FX",
    args: [{ name: "n", min: 0.01, max: 2, step: 0.01 }],
  },
  {
    name: "delayfeedback",
    kind: "method",
    category: "FX",
    args: [{ name: "n", min: 0, max: 0.95, step: 0.01 }],
  },
  {
    name: "chop",
    kind: "method",
    category: "FX",
    args: [{ name: "n", min: 1, max: 32, step: 1 }],
  },
  {
    name: "crush",
    kind: "method",
    category: "FX",
    args: [{ name: "n", min: 1, max: 16, step: 0.5 }],
  },
  {
    name: "coarse",
    kind: "method",
    category: "FX",
    args: [{ name: "n", min: 1, max: 32, step: 1 }],
  },
  {
    name: "every",
    kind: "method",
    category: "Transforms",
    args: [
      { name: "n", min: 1, max: 16, step: 1 },
      { name: "fn", min: 0, max: 1, step: 0.01, skip: true },
    ],
  },
];
