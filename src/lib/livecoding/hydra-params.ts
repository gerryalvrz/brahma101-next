import type { ParamFnDef } from "./param-types";

/** Hydra functions with numeric args — mirrors hydraAssistDocs. */
export const hydraParamCatalog: ParamFnDef[] = [
  // Sources
  {
    name: "osc",
    kind: "call",
    category: "Sources",
    args: [
      { name: "frequency", min: 0.1, max: 200, step: 0.1 },
      { name: "sync", min: 0, max: 2, step: 0.01 },
      { name: "offset", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    name: "noise",
    kind: "call",
    category: "Sources",
    args: [
      { name: "scale", min: 0.1, max: 40, step: 0.1 },
      { name: "offset", min: 0, max: 2, step: 0.01 },
    ],
  },
  {
    name: "shape",
    kind: "call",
    category: "Sources",
    args: [
      { name: "sides", min: 2, max: 16, step: 1 },
      { name: "radius", min: 0.05, max: 1, step: 0.01 },
      { name: "smoothing", min: 0, max: 0.2, step: 0.001 },
    ],
  },
  {
    name: "gradient",
    kind: "call",
    category: "Sources",
    args: [{ name: "speed", min: 0, max: 5, step: 0.01 }],
  },
  {
    name: "solid",
    kind: "call",
    category: "Sources",
    args: [
      { name: "r", min: 0, max: 1, step: 0.01 },
      { name: "g", min: 0, max: 1, step: 0.01 },
      { name: "b", min: 0, max: 1, step: 0.01 },
      { name: "a", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    name: "voronoi",
    kind: "call",
    category: "Sources",
    args: [
      { name: "scale", min: 0.1, max: 40, step: 0.1 },
      { name: "speed", min: 0, max: 5, step: 0.01 },
      { name: "blending", min: 0, max: 1, step: 0.01 },
    ],
  },

  // Geometry
  {
    name: "rotate",
    kind: "method",
    category: "Geometry",
    args: [
      { name: "angle", min: -6.28, max: 6.28, step: 0.01 },
      { name: "speed", min: -2, max: 2, step: 0.01 },
    ],
  },
  {
    name: "scale",
    kind: "method",
    category: "Geometry",
    args: [
      { name: "size", min: 0.1, max: 10, step: 0.01 },
      { name: "xMult", min: 0.1, max: 10, step: 0.01 },
      { name: "yMult", min: 0.1, max: 10, step: 0.01 },
    ],
  },
  {
    name: "pixelate",
    kind: "method",
    category: "Geometry",
    args: [
      { name: "x", min: 1, max: 200, step: 1 },
      { name: "y", min: 1, max: 200, step: 1 },
    ],
  },
  {
    name: "repeat",
    kind: "method",
    category: "Geometry",
    args: [
      { name: "x", min: 1, max: 20, step: 0.1 },
      { name: "y", min: 1, max: 20, step: 0.1 },
    ],
  },
  {
    name: "kaleid",
    kind: "method",
    category: "Geometry",
    args: [{ name: "n", min: 1, max: 16, step: 1 }],
  },
  {
    name: "scrollX",
    kind: "method",
    category: "Geometry",
    args: [
      { name: "amount", min: -2, max: 2, step: 0.01 },
      { name: "speed", min: -2, max: 2, step: 0.01 },
    ],
  },
  {
    name: "scrollY",
    kind: "method",
    category: "Geometry",
    args: [
      { name: "amount", min: -2, max: 2, step: 0.01 },
      { name: "speed", min: -2, max: 2, step: 0.01 },
    ],
  },

  // Color
  {
    name: "color",
    kind: "method",
    category: "Color",
    args: [
      { name: "r", min: 0, max: 2, step: 0.01 },
      { name: "g", min: 0, max: 2, step: 0.01 },
      { name: "b", min: 0, max: 2, step: 0.01 },
    ],
  },
  {
    name: "invert",
    kind: "method",
    category: "Color",
    args: [{ name: "amount", min: 0, max: 1, step: 0.01 }],
  },
  {
    name: "contrast",
    kind: "method",
    category: "Color",
    args: [{ name: "amount", min: 0, max: 4, step: 0.01 }],
  },
  {
    name: "brightness",
    kind: "method",
    category: "Color",
    args: [{ name: "amount", min: -1, max: 1, step: 0.01 }],
  },
  {
    name: "saturate",
    kind: "method",
    category: "Color",
    args: [{ name: "amount", min: 0, max: 4, step: 0.01 }],
  },
  {
    name: "hue",
    kind: "method",
    category: "Color",
    args: [{ name: "amount", min: 0, max: 1, step: 0.01 }],
  },

  // Blending (texture args skipped)
  {
    name: "add",
    kind: "method",
    category: "Blend",
    args: [
      { name: "texture", min: 0, max: 1, step: 0.01, skip: true },
      { name: "amount", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    name: "mult",
    kind: "method",
    category: "Blend",
    args: [
      { name: "texture", min: 0, max: 1, step: 0.01, skip: true },
      { name: "amount", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    name: "blend",
    kind: "method",
    category: "Blend",
    args: [
      { name: "texture", min: 0, max: 1, step: 0.01, skip: true },
      { name: "amount", min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    name: "diff",
    kind: "method",
    category: "Blend",
    args: [{ name: "texture", min: 0, max: 1, step: 0.01, skip: true }],
  },
  {
    name: "mask",
    kind: "method",
    category: "Blend",
    args: [{ name: "texture", min: 0, max: 1, step: 0.01, skip: true }],
  },

  // Modulation
  {
    name: "modulate",
    kind: "method",
    category: "Modulate",
    args: [
      { name: "texture", min: 0, max: 1, step: 0.01, skip: true },
      { name: "amount", min: 0, max: 2, step: 0.01 },
    ],
  },
  {
    name: "modulateRotate",
    kind: "method",
    category: "Modulate",
    args: [
      { name: "texture", min: 0, max: 1, step: 0.01, skip: true },
      { name: "amount", min: 0, max: 2, step: 0.01 },
    ],
  },
  {
    name: "modulateScale",
    kind: "method",
    category: "Modulate",
    args: [
      { name: "texture", min: 0, max: 1, step: 0.01, skip: true },
      { name: "amount", min: 0, max: 2, step: 0.01 },
    ],
  },
  {
    name: "modulateScrollX",
    kind: "method",
    category: "Modulate",
    args: [
      { name: "texture", min: 0, max: 1, step: 0.01, skip: true },
      { name: "amount", min: 0, max: 2, step: 0.01 },
    ],
  },
];
