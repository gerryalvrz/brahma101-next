"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MATRIX_CHARS =
  "AB0℥1ℌCD亜愛01安EℌFGHIJ以位因01KℑLMN虚居記O♈︎P01QRわをんS10TUVW1♑︎0XY歌会10時思Z12♅34567水火木891♃0@#$%☿^&*()♆*&^%";

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 16;
    let columns: number;
    let drops: number[];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      columns = Math.floor(canvas!.width / fontSize);
      drops = Array(columns).fill(1);
    }

    resize();
    window.addEventListener("resize", resize);

    const interval = setInterval(() => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);
      ctx.fillStyle = "rgba(0, 255, 0, 0.6)";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text =
          MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
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
