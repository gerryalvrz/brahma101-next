"use client";

import { useState, useEffect, useRef } from "react";
import BackButton from "@/components/ui/BackButton";

export default function HackPage() {
  const [target, setTarget] = useState("");
  const [hacking, setHacking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showData, setShowData] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Create 3D cubes on mount
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    for (let i = 0; i < 20; i++) {
      const cube = document.createElement("div");
      cube.className = "absolute w-[100px] h-[100px]";
      cube.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;transform:translateZ(${-Math.random() * 1000}px);transform-style:preserve-3d;`;
      ["front", "back", "left", "right", "top", "bottom"].forEach((face) => {
        const el = document.createElement("div");
        el.className =
          "absolute w-full h-full bg-[rgba(0,255,0,0.1)] border border-neon flex justify-center items-center text-2xl";
        const transforms: Record<string, string> = {
          front: "rotateY(0deg) translateZ(50px)",
          right: "rotateY(90deg) translateZ(50px)",
          back: "rotateY(180deg) translateZ(50px)",
          left: "rotateY(-90deg) translateZ(50px)",
          top: "rotateX(90deg) translateZ(50px)",
          bottom: "rotateX(-90deg) translateZ(50px)",
        };
        el.style.transform = transforms[face];
        el.textContent = "brahma";
        cube.appendChild(el);
      });
      scene.appendChild(cube);
    }
  }, []);

  function initiateHack() {
    if (!target) return;
    setHacking(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / 90;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowData(true);
            setTimeout(() => setShowComplete(true), 2000);
          }, 1000);
          return 100;
        }
        return next;
      });
    }, 500);
  }

  const TECH_DATA = [
    "Encrypted Files:",
    "user_data.enc",
    "financial_records.enc",
    "server_logs.enc",
    "",
    "Network Vulnerabilities:",
    "SQL Injection: High",
    "XSS: Medium",
    "CSRF: Low",
    "",
    "System Information:",
    "OS: Linux 5.4.0-42-generic",
    "Kernel: x86_64 GNU/Linux",
    "CPU: Intel(R) Xeon(R) CPU E5-2680 v3 @ 2.50GHz",
    "RAM: 64GB DDR4",
    "",
    "Open Ports:",
    "22 - SSH",
    "80 - HTTP",
    "443 - HTTPS",
    "3306 - MySQL",
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-neon font-mono">
      <BackButton />

      {/* 3D scene */}
      <div
        ref={sceneRef}
        className="w-full h-full"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          animation: "rotate 20s infinite linear",
        }}
      />

      {/* Matrix columns bg */}
      {hacking && (
        <div className="absolute inset-0 overflow-hidden opacity-100 transition-opacity duration-1000 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-xl text-center"
              style={{
                left: `${i * 2}%`,
                top: "-100%",
                width: "20px",
                animation: `fall 10s ${Math.random() * 10}s infinite linear`,
              }}
            >
              {Array.from({ length: 50 }).map((_, j) => (
                <div key={j}>
                  {String.fromCharCode(33 + Math.floor(Math.random() * 94))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] flex flex-col items-center">
        <input
          type="text"
          value={hacking ? `Hacking ${target}...` : target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && initiateHack()}
          disabled={hacking}
          placeholder="Enter target website to hack"
          className="w-[300px] p-2.5 text-base bg-black/70 border border-neon text-neon text-center mb-2.5"
        />
        <button
          onClick={initiateHack}
          disabled={hacking}
          className="px-5 py-2.5 text-base bg-[rgba(0,255,0,0.2)] border border-neon text-neon cursor-pointer transition-colors hover:bg-[rgba(0,255,0,0.4)]"
        >
          Initiate Hack
        </button>

        {hacking && (
          <div className="w-[300px] h-5 bg-black/70 border border-neon mt-2.5">
            <div
              className="h-full bg-neon transition-[width] duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Data window */}
      {showData && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-black/90 border-2 border-neon p-5 overflow-auto z-[1001]">
          {TECH_DATA.map((line, i) => (
            <div key={i}>{line || <br />}</div>
          ))}
        </div>
      )}

      {/* Completion modal */}
      {showComplete && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 border-2 border-neon p-5 text-center z-[1002]">
          <p>Hacking complete. Data downloading.</p>
          <p>Insert USB device to store data.</p>
        </div>
      )}

      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }
        @keyframes fall {
          to {
            transform: translateY(200vh);
          }
        }
      `}</style>
    </div>
  );
}
