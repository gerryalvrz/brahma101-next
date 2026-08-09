"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

const FULLSCREEN: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  // Above gradient background, below .main (z-index: 1). z-index: -1 hides under opaque html/body bg.
  zIndex: 0,
  pointerEvents: "auto",
  touchAction: "manipulation",
};

type ParticlesBackgroundProps = {
  /** Quieter field so sphere grid / plasma can read */
  quiet?: boolean;
};

export default function ParticlesBackground({
  quiet = false,
}: ParticlesBackgroundProps) {
  const initialized = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || initialized.current) return;
    initialized.current = true;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const container = document.getElementById("particles-js");
    if (!container) return;

    // Match legacy CSS: force full viewport before particles.js reads offsetWidth/Height
    Object.assign(container.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      opacity: quiet ? "0.45" : "0.38",
      pointerEvents: quiet ? "none" : "auto",
    });

    let cancelled = false;

    import("particles.js").then(() => {
      if (cancelled) return;

      (window as Window).particlesJS("particles-js", {
        particles: {
          number: {
            value: quiet
              ? isMobile
                ? 14
                : 28
              : isMobile
                ? 36
                : 64,
            density: { enable: true, value_area: 800 },
          },
          color: { value: "#00ff00" },
          shape: {
            type: "circle",
            stroke: { width: 0, color: "#000000" },
          },
          opacity: {
            value: quiet ? 0.28 : 0.32,
            random: true,
            anim: { enable: false },
          },
          size: {
            value: quiet ? 2 : 2.5,
            random: true,
            anim: { enable: false },
          },
          line_linked: {
            // Linking is an O(n^2) distance check every frame, and the lines
            // just compete with the sphere grid. Quiet mode = drifting motes.
            enable: !quiet,
            distance: 150,
            color: "#00ff00",
            opacity: 0.22,
            width: 1,
          },
          move: {
            enable: !reducedMotion,
            speed: quiet ? (isMobile ? 0.4 : 0.8) : isMobile ? 1 : 3,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: { enable: false },
          },
        },
        interactivity: {
          detect_on: "window",
          events: {
            onhover: { enable: !quiet, mode: "repulse" },
            onclick: { enable: !quiet, mode: "push" },
            resize: true,
          },
          modes: {
            grab: { distance: 400, line_linked: { opacity: 1 } },
            bubble: {
              distance: 200,
              size: 4,
              duration: 2,
              opacity: 8,
              speed: 3,
            },
            repulse: { distance: isMobile ? 100 : 150 },
            push: { particles_nb: isMobile ? 2 : 6 },
            remove: { particles_nb: 2 },
          },
        },
        // Rendering the motes at 2x device pixels doubles fill cost for a layer
        // nobody looks at directly.
        retina_detect: !quiet,
      });

      // particles.js sizes from offsetWidth; nudge a resize so density spans the viewport
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    });

    return () => {
      cancelled = true;
    };
  }, [mounted, quiet]);

  if (!mounted) return null;

  // Portal to body like the original HTML (sibling of content, not nested in flex main)
  return createPortal(
    <div
      id="particles-js"
      style={{
        ...FULLSCREEN,
        opacity: quiet ? 0.45 : 0.38,
        pointerEvents: quiet ? "none" : "auto",
      }}
      aria-hidden
    />,
    document.body
  );
}
