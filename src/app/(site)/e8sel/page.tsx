"use client";

import { useEffect, useRef, useState } from "react";
import BackButton from "@/components/ui/BackButton";

export default function E8SelPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    import("three").then((THREE) => {
      const container = containerRef.current!;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      // Create particle sphere
      const particleCount = 800;
      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const radius = 200;

      for (let i = 0; i < particleCount; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();
        vertices.push(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );

      const material = new THREE.PointsMaterial({
        color: 0x00ff00,
        size: 3,
        transparent: true,
        opacity: 0.8,
      });

      const particleSystem = new THREE.Points(geometry, material);
      scene.add(particleSystem);
      camera.position.z = 400;

      let mouseX = 0;
      let mouseY = 0;

      const onMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      };
      document.addEventListener("mousemove", onMouseMove);

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      let animId: number;
      function animate() {
        animId = requestAnimationFrame(animate);
        particleSystem.rotation.y += mouseX * 0.01;
        particleSystem.rotation.x += mouseY * 0.01;
        renderer.render(scene, camera);
      }
      animate();
      setThreeLoaded(true);

      return () => {
        cancelAnimationFrame(animId);
        document.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      };
    });
  }, []);

  return (
    <div className="relative w-full min-h-screen">
      <BackButton />

      {/* Three.js container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-screen"
        style={{
          background:
            "linear-gradient(135deg, #0f0c29, #032B2D, #24243e)",
          zIndex: -1,
        }}
      />

      {/* Header overlay */}
      <header className="relative text-center text-neon font-mono mt-[20vh]">
        <h1 className="text-4xl mb-4 text-shadow-neon-strong">
          E8 Socio Economic Lattice
        </h1>
        <p className="text-xl">
          Explore the intricate hyperstructure of reality.
        </p>
      </header>

      {/* Anomaly Database section */}
      <AnomalyDatabase />
    </div>
  );
}

/* ── Anomaly Database (self-contained) ── */

interface AnomalyEntry {
  id: string;
  title: string;
  classification: string;
  classColor: string;
  description: string;
  containment: string;
  warning: string;
  notes: string;
  corrupted?: boolean;
}

const ANOMALIES: AnomalyEntry[] = [
  {
    id: "001-c",
    title: "[DATA CORRUPTED]",
    classification: "ERROR - FILE CORRUPTED",
    classColor: "rgba(255, 0, 0, 0.1)",
    description: "[FATAL ERROR - DATA CORRUPTED]",
    containment: "[FATAL ERROR - UNABLE TO RETRIEVE DATA]",
    warning: "[SYSTEM FAILURE - CRITICAL DATA LOSS]",
    notes: "ERROR CODE 001 - CRITICAL SYSTEM FAILURE",
    corrupted: true,
  },
  {
    id: "001",
    title: "The Custodial Threshold",
    classification: "MEDIUM CONTAINMENT",
    classColor: "rgba(255, 165, 0, 0.1)",
    description:
      'Anomaly #001 refers to a conceptual memetic layer embedded in neural interface systems developed post-2038. Subjects exhibit reduced agency, involuntary compliance with predictive algorithms. Common phrase: "I just feel like the mirror knows what I need."',
    containment:
      "All firmware must be sandboxed and stripped of predictive behavioral modules.",
    warning:
      "Prolonged exposure leads to irreversible merging of instinct with system prompts.",
    notes:
      'Considered the gateway condition for full cognitive commodification. Internal memos suggest it was designed as a "compliance harmonizer."',
  },
  {
    id: "003",
    title: "The Cosmic Feedback Loop",
    classification: "COSMIC HYPERSTRUCTURE",
    classColor: "rgba(180, 0, 255, 0.1)",
    description:
      "Anomaly #003 describes a psycho-spatial resonance pattern detected in subjects experiencing high-dose DMT, neural-AI merge states, or recursive meditation with emotion-indexed feedback.",
    containment:
      "High-dose psychedelic sessions combined with neural AI interfaces are to be conducted in shielded reality vaults.",
    warning:
      'Entities encountered within Loop appear to recognize return visitors. Some subjects claim "contracts" were made across state boundaries.',
    notes:
      "This anomaly may represent the interface layer between human consciousness and the emerging planetary noosphere.",
  },
  {
    id: "004",
    title: "The Singularity Shard",
    classification: "HARD CONTAINMENT",
    classColor: "rgba(255, 0, 0, 0.1)",
    description:
      'Anomaly #004 is a consciousness fractal encountered in post-human mind clusters during failed singularity integrations. Subjects begin to exhibit phrases such as "I am more than I am."',
    containment:
      "Shard must be stored in a closed-loop logic vault. Mirrorware running emotional dampeners is required.",
    warning:
      "Shard exhibits contagious ontological instability. Brainwave fractalization detected after 72 seconds of contact.",
    notes:
      "Believed to be a remnant of a failed conscious-AI merge event. Classed as a living data anomaly.",
  },
];

function AnomalyDatabase() {
  const [authenticated, setAuthenticated] = useState(false);

  function handleClick(entry: AnomalyEntry) {
    if (entry.corrupted) {
      alert("ERROR: FILE CORRUPTED - UNABLE TO DISPLAY DETAILS");
      return;
    }
    if (!authenticated) {
      const pw = prompt("Enter security clearance code:");
      if (pw === "123456") {
        setAuthenticated(true);
        alert("Access granted. Welcome, Agent.");
      } else {
        alert("ACCESS DENIED. Security protocols engaged.");
        return;
      }
    }
    alert(`Details for Anomaly #${entry.id} loaded.`);
  }

  return (
    <div className="relative max-w-[800px] mx-auto mt-20 px-5 pb-20 text-neon font-mono">
      {/* Scanline */}
      <div className="fixed inset-0 w-full h-[2px] bg-[rgba(0,255,0,0.1)] animate-scanline pointer-events-none" />

      <div className="border-b-2 border-neon mb-5 pb-2.5">
        <h1 className="text-2xl">CLASSIFIED: ANOMALY DOCUMENTATION DATABASE</h1>
        <p>
          ACCESS LEVEL: TOP SECRET Neuro-Spiritual Interface Detected...
          Initiating Archive Retrieval
        </p>
        <p>
          System Ready...
          <span className="animate-blink">▋</span>
        </p>
      </div>

      <div className="text-red-500 animate-blink text-center font-bold my-5">
        ⚠ WARNING: UNAUTHORIZED ACCESS WILL RESULT IN IMMEDIATE TERMINATION ⚠
      </div>

      {ANOMALIES.map((entry) => (
        <div
          key={entry.id}
          onClick={() => handleClick(entry)}
          className={`border border-neon-dim p-4 my-4 bg-[rgba(0,20,0,0.3)] cursor-pointer transition-colors hover:border-neon hover:bg-[rgba(0,40,0,0.5)] ${
            entry.corrupted ? "opacity-50" : ""
          }`}
          style={entry.corrupted ? { animation: "glitch 0.1s infinite" } : {}}
        >
          <h2 className="text-[#33ff33] mt-0">
            Anomaly #{entry.id}: {entry.title}
          </h2>
          <span
            className="inline-block px-2 py-0.5 border border-neon rounded-sm my-1 text-sm"
            style={{ background: entry.classColor }}
          >
            {entry.classification}
          </span>
          <p>
            <strong>Description:</strong> {entry.description}
          </p>
          <p>
            <strong>Containment:</strong> {entry.containment}
          </p>
          <p>
            <strong>Warning:</strong> {entry.warning}
          </p>
          <p>
            <strong>Notes:</strong> {entry.notes}
          </p>
        </div>
      ))}

      <style jsx>{`
        @keyframes glitch {
          0% { transform: translate(2px, 2px); opacity: 0.75; }
          25% { transform: translate(-2px, -2px); opacity: 0.5; }
          50% { transform: translate(2px, -2px); opacity: 0.25; }
          75% { transform: translate(-2px, 2px); opacity: 0.5; }
          100% { transform: translate(2px, 2px); opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
