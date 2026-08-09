"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  isCoarseOrSmallScreen,
  prefersReducedMotion,
  subscribeToFrames,
} from "@/lib/animation/ticker";

type SphereGridProps = {
  opacity?: number;
};

type Vec3 = [number, number, number];
type Edge = [number, number];

/**
 * Interior-of-a-sphere lattice (Xbox dashboard depth).
 *
 * Camera sits at the *center* of the sphere and projects by direction:
 *   screen = focal * (x / z, y / z)
 * so the mesh wraps around you. A flat “wallpaper slide” happens when the
 * mesh is treated as a surface floating in front of the camera instead.
 *
 * Latitudes stay fixed (the bowl). The kite lattice drifts in longitude only.
 *
 * See: https://ejosue.com/i-tried-recreating-the-xbox-startup-ui-on-ios-heres-what-i-learned/
 */

const DRIFT_PER_SECOND = 0.01;

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function mid(a: Vec3, b: Vec3): Vec3 {
  return normalize([
    (a[0] + b[0]) * 0.5,
    (a[1] + b[1]) * 0.5,
    (a[2] + b[2]) * 0.5,
  ]);
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(
    1,
    Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])
  );
  const omega = Math.acos(dot);
  if (omega < 1e-4) {
    return normalize([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ]);
  }
  const so = Math.sin(omega);
  const s0 = Math.sin((1 - t) * omega) / so;
  const s1 = Math.sin(t * omega) / so;
  return [
    a[0] * s0 + b[0] * s1,
    a[1] * s0 + b[1] * s1,
    a[2] * s0 + b[2] * s1,
  ];
}

function rotateY(v: Vec3, cosA: number, sinA: number): Vec3 {
  return [
    v[0] * cosA + v[2] * sinA,
    v[1],
    -v[0] * sinA + v[2] * cosA,
  ];
}

function edgeKey(i: number, j: number): string {
  return i < j ? `${i}_${j}` : `${j}_${i}`;
}

function buildIcosahedronMesh(freq: number): {
  vertices: Vec3[];
  faces: [number, number, number][];
} {
  const t = (1 + Math.sqrt(5)) / 2;
  let vertices: Vec3[] = (
    [
      [-1, t, 0],
      [1, t, 0],
      [-1, -t, 0],
      [1, -t, 0],
      [0, -1, t],
      [0, 1, t],
      [0, -1, -t],
      [0, 1, -t],
      [t, 0, -1],
      [t, 0, 1],
      [-t, 0, -1],
      [-t, 0, 1],
    ] as Vec3[]
  ).map(normalize);

  let faces: [number, number, number][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  for (let f = 0; f < freq; f++) {
    const mids = new Map<string, number>();
    const nextFaces: [number, number, number][] = [];

    const getMid = (i: number, j: number) => {
      const key = edgeKey(i, j);
      let idx = mids.get(key);
      if (idx === undefined) {
        idx = vertices.length;
        vertices.push(mid(vertices[i], vertices[j]));
        mids.set(key, idx);
      }
      return idx;
    };

    for (const [a, b, c] of faces) {
      const ab = getMid(a, b);
      const bc = getMid(b, c);
      const ca = getMid(c, a);
      nextFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nextFaces;
  }

  return { vertices, faces };
}

function buildKiteLattice(
  baseVerts: Vec3[],
  faces: [number, number, number][],
  structSegs: number,
  kiteSegs: number
): { vertices: Vec3[]; structural: Edge[]; kite: Edge[] } {
  const vertices = baseVerts.map((v): Vec3 => [v[0], v[1], v[2]]);
  const rawStruct: Edge[] = [];
  const rawKite: Edge[] = [];
  const seenStruct = new Set<string>();
  const edgeMid = new Map<string, number>();

  const getMidIdx = (i: number, j: number) => {
    const key = edgeKey(i, j);
    let idx = edgeMid.get(key);
    if (idx === undefined) {
      idx = vertices.length;
      vertices.push(mid(vertices[i], vertices[j]));
      edgeMid.set(key, idx);
    }
    return idx;
  };

  const pushStruct = (i: number, j: number) => {
    const key = edgeKey(i, j);
    if (seenStruct.has(key)) return;
    seenStruct.add(key);
    rawStruct.push(i < j ? [i, j] : [j, i]);
  };

  for (const [a, b, c] of faces) {
    pushStruct(a, b);
    pushStruct(b, c);
    pushStruct(c, a);

    const mab = getMidIdx(a, b);
    const mbc = getMidIdx(b, c);
    const mca = getMidIdx(c, a);
    const centerIdx = vertices.length;
    vertices.push(
      normalize([
        (vertices[a][0] + vertices[b][0] + vertices[c][0]) / 3,
        (vertices[a][1] + vertices[b][1] + vertices[c][1]) / 3,
        (vertices[a][2] + vertices[b][2] + vertices[c][2]) / 3,
      ])
    );
    rawKite.push([centerIdx, mab], [centerIdx, mbc], [centerIdx, mca]);
  }

  const subdivide = (list: Edge[], segments: number): Edge[] => {
    const out: Edge[] = [];
    for (const [i, j] of list) {
      let prev = i;
      for (let s = 1; s < segments; s++) {
        const idx = vertices.length;
        vertices.push(slerp(vertices[i], vertices[j], s / segments));
        out.push([prev, idx]);
        prev = idx;
      }
      out.push([prev, j]);
    }
    return out;
  };

  return {
    vertices,
    structural: structSegs > 1 ? subdivide(rawStruct, structSegs) : rawStruct,
    kite: kiteSegs > 1 ? subdivide(rawKite, kiteSegs) : rawKite,
  };
}

export default function SphereGrid({ opacity = 0.55 }: SphereGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const compact = isCoarseOrSmallScreen();
    const reducedMotion = prefersReducedMotion();

    // Slightly coarser than max density so tiles read larger when zoomed in.
    const geoFreq = compact ? 2 : 3;
    const latitudes = compact ? 8 : 11;
    const latSamples = compact ? 32 : 48;
    const fps = compact ? 24 : 28;

    // Horizon cut: keep a wide forward cone so walls wrap past the viewport.
    const Z_MIN = 0.12;

    const { vertices: baseVerts, faces } = buildIcosahedronMesh(geoFreq);
    const {
      vertices: latticeVerts,
      structural,
      kite,
    } = buildKiteLattice(baseVerts, faces, compact ? 2 : 3, 1);

    const projectedX = new Float32Array(latticeVerts.length);
    const projectedY = new Float32Array(latticeVerts.length);
    /** 1 = dead ahead, 0 = near horizon (peripheral). */
    const centerAmt = new Float32Array(latticeVerts.length);
    const front = new Uint8Array(latticeVerts.length);

    let phase = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let focal = 0;
    let cx = 0;
    let cy = 0;
    let latitudePath: Path2D | null = null;

    /**
     * Camera at sphere center. Unit direction (x,y,z) with +z forward.
     * screen = focal * (x/z, −y/z) → strong wrap at the limbs.
     */
    function projectDir(
      x: number,
      y: number,
      z: number
    ): { x: number; y: number; amt: number } | null {
      if (z < Z_MIN) return null;
      return {
        x: cx + focal * (x / z),
        y: cy - focal * (y / z),
        amt: Math.min(1, Math.max(0, (z - Z_MIN) / (1 - Z_MIN))),
      };
    }

    function projectSpherical(theta: number, phi: number) {
      const cosPhi = Math.cos(phi);
      return projectDir(
        cosPhi * Math.sin(theta),
        Math.sin(phi),
        cosPhi * Math.cos(theta)
      );
    }

    function buildLatitudes() {
      const path = new Path2D();
      for (let i = 0; i < latitudes; i++) {
        // Keep clear of the poles — they pin to infinity under x/z.
        const phi = -0.92 + ((i + 0.5) / latitudes) * 1.84;
        let drawing = false;
        for (let s = 0; s <= latSamples; s++) {
          const theta = -1.15 + (s / latSamples) * 2.3;
          const p = projectSpherical(theta, phi);
          if (!p) {
            drawing = false;
            continue;
          }
          if (drawing) path.lineTo(p.x, p.y);
          else {
            path.moveTo(p.x, p.y);
            drawing = true;
          }
        }
      }
      latitudePath = path;
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.lineJoin = "round";
      ctx!.lineCap = "round";

      // Larger focal → zoomed in (bigger tiles, less extreme fisheye).
      focal = Math.min(width, height) * (compact ? 0.52 : 0.5);
      cx = width * 0.38;
      cy = height * 0.48;

      buildLatitudes();
    }

    resize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }
    window.addEventListener("resize", onResize);

    function projectLattice(cosA: number, sinA: number) {
      for (let i = 0; i < latticeVerts.length; i++) {
        const r = rotateY(latticeVerts[i], cosA, sinA);
        const p = projectDir(r[0], r[1], r[2]);
        if (!p) {
          front[i] = 0;
          continue;
        }
        front[i] = 1;
        projectedX[i] = p.x;
        projectedY[i] = p.y;
        centerAmt[i] = p.amt;
      }
    }

    function buildDepthPaths(edgeList: Edge[]): [Path2D, Path2D, Path2D] {
      const near = new Path2D();
      const midP = new Path2D();
      const far = new Path2D();
      for (let e = 0; e < edgeList.length; e++) {
        const i = edgeList[e][0];
        const j = edgeList[e][1];
        if (!front[i] || !front[j]) continue;
        // Skip segments that jump across the view (horizon wrap artifacts).
        const dx = projectedX[i] - projectedX[j];
        const dy = projectedY[i] - projectedY[j];
        if (dx * dx + dy * dy > (Math.min(width, height) * 0.55) ** 2) continue;

        const a = (centerAmt[i] + centerAmt[j]) * 0.5;
        const path = a > 0.55 ? near : a > 0.28 ? midP : far;
        path.moveTo(projectedX[i], projectedY[i]);
        path.lineTo(projectedX[j], projectedY[j]);
      }
      return [near, midP, far];
    }

    function strokeLayer(
      path: Path2D,
      wide: number,
      wideA: number,
      thin: number,
      thinA: number
    ) {
      ctx!.lineWidth = wide;
      ctx!.strokeStyle = `rgba(60, 255, 90, ${wideA})`;
      ctx!.stroke(path);
      ctx!.lineWidth = thin;
      ctx!.strokeStyle = `rgba(145, 255, 155, ${thinA})`;
      ctx!.stroke(path);
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // Fixed latitude rings — stationary bowl around the viewer.
      if (latitudePath) {
        strokeLayer(
          latitudePath,
          compact ? 2 : 2.4,
          0.03,
          compact ? 0.6 : 0.75,
          0.12
        );
      }

      const angle = phase * Math.PI * 2;
      projectLattice(Math.cos(angle), Math.sin(angle));

      const [sNear, sMid, sFar] = buildDepthPaths(structural);
      strokeLayer(sFar, compact ? 1.8 : 2.2, 0.02, compact ? 0.55 : 0.65, 0.09);
      strokeLayer(sMid, compact ? 2.2 : 2.7, 0.04, compact ? 0.75 : 0.9, 0.2);
      strokeLayer(sNear, compact ? 2.6 : 3.2, 0.065, compact ? 0.95 : 1.1, 0.32);

      const [kNear, kMid, kFar] = buildDepthPaths(kite);
      strokeLayer(kFar, compact ? 1.5 : 1.8, 0.015, compact ? 0.45 : 0.55, 0.06);
      strokeLayer(kMid, compact ? 1.8 : 2.2, 0.03, compact ? 0.6 : 0.75, 0.14);
      strokeLayer(kNear, compact ? 2.1 : 2.6, 0.045, compact ? 0.75 : 0.9, 0.22);

      // Peripheral fade — you’re looking into the sphere, edges fall off.
      ctx!.save();
      ctx!.globalCompositeOperation = "destination-out";
      const veil = ctx!.createRadialGradient(
        cx,
        cy,
        Math.min(width, height) * 0.08,
        cx,
        cy,
        Math.hypot(width, height) * 0.72
      );
      veil.addColorStop(0, "rgba(0,0,0,0)");
      veil.addColorStop(0.4, "rgba(0,0,0,0)");
      veil.addColorStop(0.75, "rgba(0,0,0,0.35)");
      veil.addColorStop(1, "rgba(0,0,0,0.82)");
      ctx!.fillStyle = veil;
      ctx!.fillRect(0, 0, width, height);
      ctx!.restore();
    }

    if (reducedMotion) {
      draw();
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
      };
    }

    const unsubscribe = subscribeToFrames((_now, delta) => {
      phase = (phase + (DRIFT_PER_SECOND * delta) / 1000) % 1;
      draw();
    }, fps);

    return () => {
      unsubscribe();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      className="sphere-grid-canvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        opacity,
        pointerEvents: "none",
      }}
    />,
    document.body
  );
}
