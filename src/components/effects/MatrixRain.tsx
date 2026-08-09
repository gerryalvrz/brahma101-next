"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  isCoarseOrSmallScreen,
  prefersReducedMotion,
  subscribeToFrames,
} from "@/lib/animation/ticker";

const MATRIX_CHARS =
  "AB0℥1ℌCD亜愛01安EℌFGHIJ以位因01KℑLMN虚居記O♈︎P01QRわをんS10TUVW1♑︎0XY歌会10時思Z12♅34567水火木891♃0@#$%☿^&*()♆*&^%";

/** Rain reads as intentionally steppy, so it does not need 60fps. */
const FPS = 20;

export default function MatrixRain({ opacity = 0.4 }: { opacity?: number }) {
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
    const fontSize = compact ? 18 : 16;
    // Rain is a texture, not a subject: half-res on mobile is invisible here.
    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5);

    let width = 0;
    let height = 0;
    let drops: Float32Array = new Float32Array(0);
    let speeds: Float32Array = new Float32Array(0);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.font = `${fontSize}px monospace`;
      ctx!.textBaseline = "top";

      const columns = Math.ceil(width / fontSize);
      drops = new Float32Array(columns);
      speeds = new Float32Array(columns);
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * (height / fontSize);
        speeds[i] = 0.75 + Math.random() * 0.75;
      }
    }

    resize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }
    window.addEventListener("resize", onResize);

    function draw(_now: number, delta: number) {
      // Trail fade, scaled to elapsed time so the tail length is stable
      // whether we render at 20fps or drop to 10.
      const fade = Math.min(0.28, 0.1 * (delta / (1000 / FPS)));
      ctx!.fillStyle = `rgba(0, 0, 0, ${fade})`;
      ctx!.fillRect(0, 0, width, height);

      ctx!.fillStyle = "rgba(0, 255, 0, 0.6)";
      const step = delta / (1000 / FPS);

      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * fontSize;
        const char =
          MATRIX_CHARS[(Math.random() * MATRIX_CHARS.length) | 0];
        ctx!.fillText(char, i * fontSize, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speeds[i] * step;
      }
    }

    if (prefersReducedMotion()) {
      // A single pass leaves a static field of glyphs — atmosphere, no motion.
      draw(0, 1000 / FPS);
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
      };
    }

    const unsubscribe = subscribeToFrames(draw, FPS);

    return () => {
      unsubscribe();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [mounted]);

  if (!mounted) return null;

  // Above the html/body gradient, below page content (z-index: 1)
  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
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
