"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  prefersReducedMotion,
  subscribeToFrames,
} from "@/lib/animation/ticker";
import styles from "./XboxOrb.module.css";

type XboxOrbProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
};

/** Ambient spin rates (deg/sec) — matches the old 48s / 36s / 64s / 22s periods. */
const AMBIENT = [360 / 48, -360 / 36, 360 / 64, -360 / 22] as const;

/** Collar tick ring — slower ambient, strong scroll reverse. */
const COLLAR_AMBIENT = 360 / 56;
const COLLAR_PHASE0 = -18;

/**
 * Per-layer chaos: atom-like shells with phase offsets, eccentric wobble, and
 * off-center pivot points — so nothing lines up like a constellation diagram.
 */
const LAYER_CHAOS = [
  { phase0: 22, ecc: 6.5, eccRate: 28, tilt: -8 },
  { phase0: -51, ecc: 9.5, eccRate: -41, tilt: 14 },
  { phase0: 77, ecc: 5.0, eccRate: 19, tilt: -11 },
  { phase0: -118, ecc: 11.0, eccRate: -53, tilt: 17 },
] as const;

/** How hard scroll yanks each layer against its ambient direction. */
const SCROLL_KICK = 0.28;
/** Scroll energy decay per second when the wheel is idle. */
const SCROLL_DECAY = 1.8;
/** Cap so a trackpad fling can't send layers into a blender. */
const SCROLL_MAX = 900;

/**
 * Multi-layer Xbox-dashboard orb. Layers keep a slow ambient spin; scrolling
 * adds an opposite-direction kick that fades out when you stop, so motion
 * resumes on its own.
 */
export default function XboxOrb({
  src,
  alt,
  size = 250,
  className,
}: XboxOrbProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringsARef = useRef<SVGSVGElement>(null);
  const ringsBRef = useRef<SVGSVGElement>(null);
  const shellsRef = useRef<SVGSVGElement>(null);
  const shardsRef = useRef<SVGSVGElement>(null);
  const plasmaRef = useRef<HTMLCanvasElement>(null);
  const collarTicksRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const layers = [ringsARef, ringsBRef, shellsRef, shardsRef];
    const root = rootRef.current;
    const plasma = plasmaRef.current;
    const collarTicks = collarTicksRef.current;
    if (layers.some((r) => !r.current) || !root || !plasma || !collarTicks)
      return;

    const ctx = plasma.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;

    const angles: number[] = LAYER_CHAOS.map((c) => c.phase0);
    let collarAngle = COLLAR_PHASE0;
    let scrollEnergy = 0;
    let lastScrollAt = 0;
    let parallaxY = 0;
    let lastScrollY = window.scrollY;

    function resizePlasma() {
      const rect = root!.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      plasma!.width = Math.floor(width * dpr);
      plasma!.height = Math.floor(height * dpr);
      plasma!.style.width = `${width}px`;
      plasma!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.lineJoin = "round";
      ctx!.lineCap = "round";
    }

    /**
     * Xbox-style plasma membranes: overlapping translucent shells + bright
     * caustic ridges where they fold. Additive blend makes intersections glow.
     */
    function drawPlasma(t: number) {
      const w = width;
      const h = height;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = Math.min(w, h) * 0.48;

      ctx!.clearRect(0, 0, w, h);
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx!.clip();

      ctx!.globalCompositeOperation = "lighter";

      // Soft volumetric fog near the core → shell transition
      const fog = ctx!.createRadialGradient(
        cx - radius * 0.12,
        cy - radius * 0.08,
        radius * 0.08,
        cx,
        cy,
        radius
      );
      fog.addColorStop(0, "rgba(230, 255, 140, 0.14)");
      fog.addColorStop(0.35, "rgba(120, 220, 70, 0.07)");
      fog.addColorStop(0.7, "rgba(40, 140, 50, 0.04)");
      fog.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx!.fillStyle = fog;
      ctx!.fillRect(0, 0, w, h);

      const membranes = [
        {
          cx: 0.46,
          cy: 0.44,
          rx: 0.92,
          ry: 0.5,
          rot: t * 0.22,
          phase: 0.4,
          warp: 3,
          thick: 10,
        },
        {
          cx: 0.56,
          cy: 0.52,
          rx: 0.74,
          ry: 0.66,
          rot: -t * 0.31,
          phase: 1.7,
          warp: 4,
          thick: 8,
        },
        {
          cx: 0.48,
          cy: 0.58,
          rx: 0.68,
          ry: 0.9,
          rot: t * 0.17,
          phase: 2.9,
          warp: 5,
          thick: 7,
        },
        {
          cx: 0.54,
          cy: 0.4,
          rx: 0.96,
          ry: 0.38,
          rot: -t * 0.26 + 1.1,
          phase: 0.9,
          warp: 3,
          thick: 6,
        },
        {
          cx: 0.42,
          cy: 0.5,
          rx: 0.58,
          ry: 0.78,
          rot: t * 0.39,
          phase: 3.4,
          warp: 6,
          thick: 5,
        },
      ];

      for (const m of membranes) {
        const mx = w * m.cx;
        const my = h * m.cy;
        const samples = 72;
        ctx!.beginPath();
        for (let s = 0; s <= samples; s++) {
          const a = (s / samples) * Math.PI * 2;
          const wobble =
            1 +
            0.09 * Math.sin(m.warp * a + t * 1.4 + m.phase) +
            0.05 * Math.sin((m.warp + 2) * a - t * 1.1);
          const x = mx + Math.cos(a + m.rot) * radius * m.rx * wobble;
          const y = my + Math.sin(a + m.rot) * radius * m.ry * wobble;
          if (s === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.closePath();
        ctx!.strokeStyle = "rgba(90, 220, 80, 0.11)";
        ctx!.lineWidth = m.thick;
        ctx!.stroke();
        ctx!.strokeStyle = "rgba(200, 255, 120, 0.22)";
        ctx!.lineWidth = Math.max(1.1, m.thick * 0.22);
        ctx!.stroke();
      }

      // Sharp caustic filaments — off-center “electron” flares
      for (let f = 0; f < 7; f++) {
        const base = (f / 7) * Math.PI * 2 + t * (0.35 + f * 0.04) + 0.35;
        const span = 0.55 + 0.12 * Math.sin(t * 0.8 + f);
        const ox = cx + Math.cos(base * 0.7) * radius * 0.08;
        const oy = cy + Math.sin(base * 1.1) * radius * 0.1;
        ctx!.beginPath();
        const steps = 28;
        for (let s = 0; s <= steps; s++) {
          const u = s / steps;
          const a = base + (u - 0.5) * span;
          const flare =
            0.42 +
            0.48 *
              Math.sin(u * Math.PI) *
              (1 + 0.15 * Math.sin(t * 2.2 + f * 1.7));
          const twist = 0.14 * Math.sin(u * 6 + t * 1.5 + f);
          const x = ox + Math.cos(a + twist) * radius * flare;
          const y = oy + Math.sin(a + twist * 1.3) * radius * flare * 0.92;
          if (s === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.strokeStyle = `rgba(210, 255, 90, ${0.16 + (f % 3) * 0.04})`;
        ctx!.lineWidth = 1.35;
        ctx!.stroke();
        ctx!.strokeStyle = "rgba(255, 255, 180, 0.1)";
        ctx!.lineWidth = 0.6;
        ctx!.stroke();
      }

      // Fresnel shell: keep plasma strongest near the rim, quieter over the gif
      ctx!.globalCompositeOperation = "destination-in";
      const veil = ctx!.createRadialGradient(cx, cy, radius * 0.28, cx, cy, radius);
      veil.addColorStop(0, "rgba(0,0,0,0.08)");
      veil.addColorStop(0.45, "rgba(0,0,0,0.55)");
      veil.addColorStop(0.78, "rgba(0,0,0,0.95)");
      veil.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx!.fillStyle = veil;
      ctx!.fillRect(0, 0, w, h);

      ctx!.restore();
    }

    resizePlasma();
    drawPlasma(0);

    if (reduced) {
      const onResize = () => {
        resizePlasma();
        drawPlasma(0);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScrollY;
      lastScrollY = y;
      if (dy === 0) return;

      scrollEnergy += dy * SCROLL_KICK;
      if (scrollEnergy > SCROLL_MAX) scrollEnergy = SCROLL_MAX;
      if (scrollEnergy < -SCROLL_MAX) scrollEnergy = -SCROLL_MAX;
      lastScrollAt = performance.now();
      parallaxY = Math.min(56, y * 0.09);
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizePlasma, 120);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const unsubscribe = subscribeToFrames((_now, delta) => {
      const dt = delta / 1000;
      const idle = performance.now() - lastScrollAt > 120;

      if (idle && scrollEnergy !== 0) {
        const damp = Math.exp(-SCROLL_DECAY * dt);
        scrollEnergy *= damp;
        if (Math.abs(scrollEnergy) < 0.4) scrollEnergy = 0;
      }

      // Scroll also stirs the plasma slightly (opposite ambient feel).
      time += dt * (1 + Math.min(2.2, Math.abs(scrollEnergy) * 0.004));

      for (let i = 0; i < 4; i++) {
        const ambient = AMBIENT[i];
        const chaos = LAYER_CHAOS[i];
        const against = -Math.sign(ambient || 1) * scrollEnergy * 1.65;
        angles[i] = (angles[i] + (ambient + against) * dt) % 360;

        // Eccentric wobble — each shell orbits a slightly different nucleus.
        const eccAngle = ((time * chaos.eccRate + chaos.phase0) * Math.PI) / 180;
        const ex = Math.cos(eccAngle) * chaos.ecc;
        const ey = Math.sin(eccAngle * 1.17) * chaos.ecc * 0.82;
        const el = layers[i].current;
        if (el) {
          el.style.transform = `translate(${ex.toFixed(2)}px, ${ey.toFixed(2)}px) rotate(${chaos.tilt + angles[i]}deg)`;
        }
      }

      // Irregular collar ticks — ambient drift + reverse kick on scroll.
      const collarAgainst =
        -Math.sign(COLLAR_AMBIENT) * scrollEnergy * 2.1;
      collarAngle =
        (collarAngle + (COLLAR_AMBIENT + collarAgainst) * dt) % 360;
      collarTicks.setAttribute(
        "transform",
        `rotate(${collarAngle} 100 100)`
      );

      drawPlasma(time);

      if (root) {
        const target = idle ? parallaxY * 0.45 : parallaxY;
        root.style.translate = `0 ${target.toFixed(2)}px`;
      }
    }, 30);

    return () => {
      unsubscribe();
      clearTimeout(resizeTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={rootRef} className={`${styles.root} ${className ?? ""}`}>
      <div className={styles.aura} aria-hidden />
      <div className={styles.halo} aria-hidden />

      <svg
        ref={ringsARef}
        className={`${styles.layer} ${styles.ringsA}`}
        viewBox="0 0 200 200"
        aria-hidden
      >
        <defs>
          <linearGradient id="orbRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(180,255,120,0.05)" />
            <stop offset="45%" stopColor="rgba(120,255,90,0.85)" />
            <stop offset="100%" stopColor="rgba(60,200,80,0.1)" />
          </linearGradient>
          <filter id="orbGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse
          cx="94"
          cy="106"
          rx="88"
          ry="42"
          fill="none"
          stroke="url(#orbRingGrad)"
          strokeWidth="1.1"
          filter="url(#orbGlow)"
          transform="rotate(-34 94 106)"
        />
        <ellipse
          cx="108"
          cy="92"
          rx="78"
          ry="34"
          fill="none"
          stroke="rgba(140,255,130,0.35)"
          strokeWidth="0.7"
          strokeDasharray="3 5"
          transform="rotate(26 108 92)"
        />
      </svg>

      <svg
        ref={ringsBRef}
        className={`${styles.layer} ${styles.ringsB}`}
        viewBox="0 0 200 200"
        aria-hidden
      >
        <ellipse
          cx="112"
          cy="104"
          rx="86"
          ry="38"
          fill="none"
          stroke="rgba(200,255,140,0.55)"
          strokeWidth="0.9"
          transform="rotate(48 112 104)"
        />
        <ellipse
          cx="96"
          cy="98"
          rx="70"
          ry="66"
          fill="none"
          stroke="rgba(100,255,120,0.22)"
          strokeWidth="0.6"
        />
        <circle
          cx="104"
          cy="108"
          r="58"
          fill="none"
          stroke="rgba(160,255,100,0.28)"
          strokeWidth="0.5"
          strokeDasharray="2 7"
        />
      </svg>

      <svg
        ref={shellsRef}
        className={`${styles.layer} ${styles.shells}`}
        viewBox="0 0 200 200"
        aria-hidden
      >
        <defs>
          <radialGradient id="shardFill" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="rgba(180,255,120,0.38)" />
            <stop offset="55%" stopColor="rgba(40,160,60,0.16)" />
            <stop offset="100%" stopColor="rgba(0,40,20,0.02)" />
          </radialGradient>
          <radialGradient id="shardFill2" cx="60%" cy="70%" r="65%">
            <stop offset="0%" stopColor="rgba(210,255,140,0.3)" />
            <stop offset="60%" stopColor="rgba(30,120,50,0.12)" />
            <stop offset="100%" stopColor="rgba(0,20,10,0)" />
          </radialGradient>
        </defs>
        <path
          d="M42 78 C48 42, 78 28, 108 34 C96 48, 78 62, 58 88 C50 86, 44 82, 42 78 Z"
          fill="url(#shardFill)"
          stroke="rgba(170,255,130,0.55)"
          strokeWidth="0.8"
        />
        <path
          d="M148 56 C168 72, 174 108, 158 138 C142 128, 132 108, 130 86 C136 74, 142 64, 148 56 Z"
          fill="url(#shardFill2)"
          stroke="rgba(150,255,120,0.45)"
          strokeWidth="0.7"
        />
        <path
          d="M58 142 C78 158, 118 164, 146 148 C132 138, 108 134, 82 128 C70 132, 62 138, 58 142 Z"
          fill="url(#shardFill)"
          stroke="rgba(120,255,100,0.4)"
          strokeWidth="0.7"
          opacity="0.85"
        />
        <path
          d="M72 44 C92 28, 128 30, 146 48 C130 52, 110 50, 90 54 C82 50, 76 46, 72 44 Z"
          fill="rgba(160,255,130,0.18)"
          stroke="rgba(200,255,150,0.5)"
          strokeWidth="0.6"
        />
        <path
          d="M64 96 C76 70, 110 62, 134 78"
          fill="none"
          stroke="rgba(180,255,140,0.4)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <path
          d="M70 118 C88 132, 120 134, 140 112"
          fill="none"
          stroke="rgba(140,255,120,0.32)"
          strokeWidth="0.75"
          strokeLinecap="round"
        />
      </svg>

      <svg
        ref={shardsRef}
        className={`${styles.layer} ${styles.shardsSpin}`}
        viewBox="0 0 200 200"
        aria-hidden
      >
        {/* Irregular shell chips — not chevrons/arrows */}
        <path
          d="M88 22 C96 18, 112 20, 118 28 C110 34, 102 38, 94 36 C90 32, 86 28, 88 22 Z"
          fill="rgba(200,255,140,0.5)"
        />
        <path
          d="M168 78 C176 86, 178 102, 170 114 C160 108, 154 98, 156 88 C160 82, 164 78, 168 78 Z"
          fill="rgba(160,255,120,0.38)"
        />
        <path
          d="M72 162 C84 170, 104 172, 118 164 C110 154, 96 150, 82 154 C76 156, 72 160, 72 162 Z"
          fill="rgba(180,255,130,0.42)"
        />
        <path
          d="M28 86 C34 74, 48 68, 58 74 C52 84, 44 94, 34 98 C28 94, 26 90, 28 86 Z"
          fill="rgba(140,255,110,0.34)"
        />
        <path
          d="M142 148 C150 142, 158 146, 156 156 C148 158, 140 154, 142 148 Z"
          fill="rgba(190,255,130,0.36)"
        />
        <circle cx="128" cy="52" r="1.6" fill="rgba(240,255,200,0.9)" />
        <circle cx="156" cy="118" r="1.2" fill="rgba(220,255,180,0.7)" />
        <circle cx="64" cy="148" r="1.3" fill="rgba(200,255,160,0.75)" />
      </svg>

      {/* Micro plasma membranes / caustic ridges — additive veil over shells */}
      <canvas
        ref={plasmaRef}
        className={styles.plasmaVeil}
        aria-hidden
      />

      <div className={styles.corePlasma} aria-hidden />
      <div className={styles.coreDisc} aria-hidden />

      {/* Mechanical collar — grips the gif so it reads as engine core, not a sticker */}
      <svg className={styles.collar} viewBox="0 0 200 200" aria-hidden>
        <defs>
          <linearGradient id="collarMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(200,255,140,0.55)" />
            <stop offset="50%" stopColor="rgba(80,160,70,0.25)" />
            <stop offset="100%" stopColor="rgba(160,255,120,0.45)" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="url(#collarMetal)"
          strokeWidth="3.2"
        />
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="rgba(40,100,50,0.55)"
          strokeWidth="5"
        />
        <g ref={collarTicksRef}>
          {(
            [
              0.04, 0.11, 0.19, 0.28, 0.31, 0.42, 0.51, 0.58, 0.67, 0.79, 0.88,
              0.96,
            ] as const
          ).map((frac, i) => {
            const a = frac * Math.PI * 2;
            const r0 = 78;
            const r1 = i % 3 === 0 ? 87 : i % 2 === 0 ? 84 : 81.5;
            return (
              <line
                key={frac}
                x1={100 + Math.cos(a) * r0}
                y1={100 + Math.sin(a) * r0}
                x2={100 + Math.cos(a) * r1}
                y2={100 + Math.sin(a) * r1}
                stroke="rgba(180,255,130,0.55)"
                strokeWidth={i % 4 === 0 ? 2.2 : 1.1}
                strokeLinecap="round"
              />
            );
          })}
        </g>
        {/* Docking port facing the menu chassis — stays fixed */}
        <path
          d="M168 92 L186 92 L190 100 L186 108 L168 108 Z"
          fill="rgba(30,80,40,0.55)"
          stroke="rgba(180,255,130,0.7)"
          strokeWidth="1.2"
        />
        <circle cx="178" cy="100" r="2.2" fill="rgba(220,255,140,0.85)" />
      </svg>

      <div className={styles.media}>
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          priority
          className={styles.gif}
        />
        <div className={styles.mediaSheen} aria-hidden />
      </div>

      <div className={styles.rim} aria-hidden />
      <div className={styles.rimHighlight} aria-hidden />

      <div className={styles.satellite} aria-hidden>
        <span className={styles.satRing} />
        <span className={styles.satShell} />
        <span className={styles.satCore} />
      </div>
    </div>
  );
}
