"use client";

import { useEffect, useRef } from "react";

/** Exact character set + draw loop from pages/locognitive.html */
const CHARACTERS = '℔℥ℨΩµℌℑℳ∮⨕⨔⋔⩚⩛⩓⩔⫙⫚⫛⟒♈︎♉︎♊︎♋︎♌︎♍︎♎︎♏︎♐︎♑︎♒︎♓︎☉☿♀︎♁♂︎♃♄♅⛢♆⚦⚧⚨⚩☥☨⚕︎⚘☸︎⚔︎';

export default function LocognitiveMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 16;
    let drops: number[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      const columns = Math.floor(canvas!.width / fontSize);
      drops = Array.from({ length: columns }, () => 1);
    }

    resize();
    window.addEventListener("resize", resize);

    const interval = setInterval(() => {
      // Lighter trail than homepage rain → denser persistent field
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);

      ctx.fillStyle = "#0f0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = CHARACTERS.charAt(
          Math.floor(Math.random() * CHARACTERS.length)
        );
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas!.height && Math.random() > 0.95) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="matrix-bg"
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
