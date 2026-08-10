import { artLessons, artSketches, type ArtSketch } from "@/data/art";

export const allArtSnippets: ArtSketch[] = [...artLessons, ...artSketches];

/** Hydra-compatible sketch encoding (base64 of encodeURIComponent). */
export function encodeSketch(code: string): string {
  return btoa(encodeURIComponent(code));
}

export function decodeSketch(encoded: string): string | null {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    try {
      return new TextDecoder().decode(
        Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
      );
    } catch {
      return null;
    }
  }
}

export function buildShareUrl(code: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("code", encodeSketch(code));
  return url.toString();
}

export function readCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const encoded = new URLSearchParams(window.location.search).get("code");
  if (!encoded) return null;
  return decodeSketch(encoded);
}

/** Mutate numeric literals — hydra “dice” style. */
export function diceMutate(code: string): string {
  const matches = [...code.matchAll(/-?\d+\.?\d*/g)];
  if (matches.length === 0) return code;

  const targets = new Set<number>();
  const count = Math.min(3, matches.length);
  while (targets.size < count) {
    targets.add(Math.floor(Math.random() * matches.length));
  }

  let i = 0;
  return code.replace(/-?\d+\.?\d*/g, (raw) => {
    const idx = i++;
    if (!targets.has(idx)) return raw;
    const value = Number(raw);
    if (!Number.isFinite(value)) return raw;
    const factor = 0.45 + Math.random() * 1.1;
    const next = value * factor;
    if (!raw.includes(".") && Number.isInteger(value)) {
      return String(Math.max(0, Math.round(next)));
    }
    return (Math.round(next * 100) / 100).toFixed(2);
  });
}

export function pickRandomSnippet(): ArtSketch {
  return allArtSnippets[Math.floor(Math.random() * allArtSnippets.length)];
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function stamp(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
    "-",
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0"),
  ].join("");
}
