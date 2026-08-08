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

export default function ParticlesBackground() {
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

    const container = document.getElementById("particles-js");
    if (!container) return;

    // Match legacy CSS: force full viewport before particles.js reads offsetWidth/Height
    Object.assign(container.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
    });

    let cancelled = false;

    import("particles.js").then(() => {
      if (cancelled) return;

      (window as Window).particlesJS("particles-js", {
        particles: {
          number: {
            value: isMobile ? 100 : 200,
            density: { enable: true, value_area: 800 },
          },
          color: { value: "#00ff00" },
          shape: {
            type: "circle",
            stroke: { width: 0, color: "#000000" },
          },
          opacity: {
            value: 0.5,
            random: true,
            anim: { enable: false },
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: false },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#00ff00",
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: isMobile ? 1 : 3,
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
            onhover: { enable: true, mode: "repulse" },
            onclick: { enable: true, mode: "push" },
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
        retina_detect: true,
      });

      // particles.js sizes from offsetWidth; nudge a resize so density spans the viewport
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    });

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  if (!mounted) return null;

  // Portal to body like the original HTML (sibling of content, not nested in flex main)
  return createPortal(
    <div id="particles-js" style={FULLSCREEN} aria-hidden />,
    document.body
  );
}
