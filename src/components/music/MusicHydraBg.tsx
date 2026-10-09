"use client";

import { useEffect, useRef, useState } from "react";
import type Hydra from "hydra-synth";
import {
  findMusicViz,
  musicVizPresets,
  type MusicVizPreset,
} from "@/data/musicViz";
import styles from "./MusicHydraBg.module.css";

async function runHydraCode(code: string) {
  await new Promise<void>((resolve, reject) => {
    try {
      const result: unknown = window.eval(`(async () => {\n${code}\n})()`);
      Promise.resolve(result).then(() => resolve()).catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

export default function MusicHydraBg({ presetId }: { presetId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydraRef = useRef<Hydra | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let hydra: Hydra | null = null;
    let onResize: (() => void) | null = null;

    void import("hydra-synth").then(async ({ default: HydraCtor }) => {
      if (cancelled || !canvasRef.current) return;

      hydra = new HydraCtor({
        canvas: canvasRef.current,
        width: window.innerWidth,
        height: window.innerHeight,
        detectAudio: false,
        enableStreamCapture: false,
        makeGlobal: true,
      });
      hydraRef.current = hydra;

      onResize = () => {
        hydra?.setResolution(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      try {
        hydra?.hush();
      } catch {
        /* ignore */
      }
      hydraRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready || !hydraRef.current) return;

    const preset: MusicVizPreset | undefined =
      findMusicViz(presetId) ?? musicVizPresets[0];
    if (!preset) return;

    let cancelled = false;
    void (async () => {
      try {
        hydraRef.current?.hush();
        if (window.a) window.a.setBins(6);
        await runHydraCode(preset.code);
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Hydra preset failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [presetId, ready]);

  return (
    <>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
      {error ? (
        <p className={styles.error} role="status">
          viz: {error}
        </p>
      ) : null}
    </>
  );
}
