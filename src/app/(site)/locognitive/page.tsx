"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { locognitiveContent } from "@/data/locognitive";
import styles from "./locognitive.module.css";

const LocognitiveMatrix = dynamic(
  () => import("@/components/effects/LocognitiveMatrix"),
  { ssr: false }
);

const ASCII_CHARS = ["☥", "ℑ", "☸︎", "♅", " ", "♁", ".", "☿", "+"];

function generateAscii(width: number, height: number): string {
  const rows: string[] = [];

  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      row += ASCII_CHARS[(Math.random() * ASCII_CHARS.length) | 0];
    }
    rows.push(row);
  }

  // Overlay "Locognitive" like the original HTML
  const label = "Locognitive";
  const rowIndex = (height / 2) | 0;
  const start = Math.max(0, ((width - label.length) / 2) | 0);
  const base = rows[rowIndex] ?? "".padEnd(width, " ");
  rows[rowIndex] =
    base.slice(0, start) + label + base.slice(start + label.length);

  return rows.join("\n");
}

export default function LocognitivePage() {
  const [loading, setLoading] = useState(true);
  // Empty until mount — Math.random() in generateAscii would mismatch SSR/client
  const [ascii, setAscii] = useState("");
  const c = locognitiveContent;
  // Survive React Strict Mode double-mount in dev
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlBg = html.style.background;
    const prevBodyBg = body.style.background;
    const prevHtmlImage = html.style.backgroundImage;
    const prevBodyImage = body.style.backgroundImage;
    html.style.background = "#000";
    html.style.backgroundImage = "none";
    body.style.background = "#000";
    body.style.backgroundImage = "none";

    if (startedAt.current === null) {
      startedAt.current = Date.now();
    }

    setAscii(generateAscii(120, 30));
    const tick = window.setInterval(() => {
      setAscii(generateAscii(120, 30));
    }, 200);

    const remaining = Math.max(0, 3000 - (Date.now() - startedAt.current));
    const timer = window.setTimeout(() => {
      window.clearInterval(tick);
      setLoading(false);
    }, remaining);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timer);
      html.style.background = prevHtmlBg;
      html.style.backgroundImage = prevHtmlImage;
      body.style.background = prevBodyBg;
      body.style.backgroundImage = prevBodyImage;
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.loader}>
        <pre className={styles.ascii}>{ascii}</pre>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <a href="/" className={styles.backLink}>
        ← Back to Menu
      </a>

      <LocognitiveMatrix />

      <div className={styles.mainContent}>
        <div className={styles.grid}>
          <div className={styles.section}>
            <h1>AI Generated Images</h1>
            <div className={styles.buttonList}>
              {c.collections.map((link) => (
                <a key={link.label} href={link.href} className={styles.button}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h1>{c.desTitle}</h1>
            <div className={styles.scrollable}>
              <div className={styles.buttonList}>
                {c.desLinks.map((link) => (
                  <a key={link.label} href={link.href} className={styles.button}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Digital Samsaras</h3>
            <div className={styles.box}>
              <iframe
                src={c.drivePreview}
                width="100%"
                height="100%"
                allow="autoplay"
                allowFullScreen
                title="Digital Samsaras"
                style={{ minHeight: 180 }}
              />
            </div>
            <div className={styles.box}>
              <h3>Sounds sculptured in space</h3>
              <iframe
                width="100%"
                height={100}
                scrolling="no"
                frameBorder={0}
                allow="autoplay"
                src={c.soundCloudEmbed}
                title="Sounds sculptured in space"
              />
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <a href={c.footerLink.href} className={styles.footerLink}>
          {c.footerLink.label}
        </a>
      </footer>
    </div>
  );
}
