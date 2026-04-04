"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import BackButton from "@/components/ui/BackButton";
import NeonButton from "@/components/ui/NeonButton";

const MatrixRain = dynamic(() => import("@/components/effects/MatrixRain"), {
  ssr: false,
});

const ASCII_CHARS = ["☥", "ℑ", "☸︎", "♅", " ", "♁", ".", "☿", "+"];

function generateAscii(width: number, height: number): string {
  const textLines = "Locognitive".split("\n");
  let art = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      art += ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)];
    }
    art += "\n";
  }
  // Overlay text
  const rows = art.split("\n");
  const startY = Math.floor(height / 2 - textLines.length / 2);
  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i]
      .padStart(Math.floor((width + textLines[i].length) / 2), " ")
      .padEnd(width, " ");
    if (rows[startY + i]) rows[startY + i] = line;
  }
  return rows.join("\n");
}

export default function LocognitivePage() {
  const [loading, setLoading] = useState(true);
  const [ascii, setAscii] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAscii(generateAscii(80, 20));
    }, 200);

    const timer = setTimeout(() => {
      clearInterval(intervalRef.current);
      setLoading(false);
    }, 3000);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-10">
        <pre className="text-neon text-xs leading-3 whitespace-pre font-mono">
          {ascii}
        </pre>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <BackButton />
      <MatrixRain opacity={0.3} />

      <div
        className="grid gap-5 p-5 min-h-screen items-center"
        style={{ gridTemplateColumns: "0.8fr 1.2fr 0.8fr" }}
      >
        {/* Left — AI Generated Images */}
        <div className="relative p-4 rounded-[15px] text-center bg-black/40 shadow-neon flex flex-col items-center justify-start gap-4">
          <h1 className="font-vt323 text-2xl text-neon">AI Generated Images</h1>
          <div className="flex flex-col gap-2.5 items-center w-full">
            <NeonButton href="#">Collection I</NeonButton>
            <NeonButton href="#">Collection II</NeonButton>
          </div>
        </div>

        {/* Center — DES */}
        <div className="relative p-4 rounded-[15px] text-center bg-black/40 shadow-neon flex flex-col items-center justify-start gap-4">
          <h1 className="font-vt323 text-2xl text-neon">
            Dimension Explorer Service (D.E.S.)
          </h1>
          <div className="max-h-[60vh] overflow-y-auto w-[60%] max-w-[400px] p-4 border-2 border-neon bg-black/80 rounded-[10px]">
            <div className="flex flex-col gap-2.5 items-center w-full">
              {[
                "Fractality",
                "Tipper Mind Hatch",
                "Jazzdimension",
                "Psychoactive Entropy",
                "Iterate Reality",
                "Cosmic Spaces",
                "Quantum Shaggy",
                "Glitchy message",
                "Neuroreality",
                "Psyched ride",
                "Soft ripples",
                "Planet E",
                "Mario",
              ].map((name) => (
                <NeonButton key={name} href="#">
                  {name}
                </NeonButton>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Digital Samsaras */}
        <div className="relative p-4 rounded-[15px] text-center bg-black/40 shadow-neon flex flex-col items-center justify-start gap-4">
          <h3 className="font-vt323 text-xl text-neon">Digital Samsaras</h3>
          <div className="p-4 bg-black/50 border-2 border-neon shadow-neon w-full">
            <iframe
              src="https://drive.google.com/file/d/1rpa77ZHDyOwN5h4tx2UpOQiaYwgZ2xI4/preview"
              width="100%"
              height="200"
              allow="autoplay"
              allowFullScreen
              className="border-2 border-neon"
            />
          </div>
          <div className="p-4 bg-black/50 border-2 border-neon shadow-neon w-full">
            <h3 className="font-vt323 text-lg text-neon text-shadow-neon">
              Sounds sculptured in space
            </h3>
            <iframe
              width="100%"
              height="100"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/63156685&color=%2300ff00&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false"
              className="border-2 border-neon"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full text-center text-base text-neon bg-black/70 py-2.5 shadow-[0_-2px_10px_rgba(0,255,0,0.6)] z-[100]">
        <span className="text-neon cursor-pointer hover:text-neon-hover">
          Locognitive
        </span>
      </footer>
    </div>
  );
}
