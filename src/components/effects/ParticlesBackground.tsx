"use client";

import { useEffect, useRef } from "react";

export default function ParticlesBackground() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    import("particles.js").then(() => {
      (window as Window).particlesJS("particles-js", {
        particles: {
          number: { value: isMobile ? 100 : 200, density: { enable: true, value_area: 800 } },
          color: { value: "#00ff00" },
          shape: { type: "circle" },
          opacity: { value: 0.5, random: true },
          size: { value: 3, random: true },
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
            repulse: { distance: isMobile ? 100 : 150 },
            push: { particles_nb: isMobile ? 2 : 6 },
          },
        },
        retina_detect: true,
      });
    });
  }, []);

  return (
    <div
      id="particles-js"
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: -1 }}
    />
  );
}
