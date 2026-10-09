import { musicSets, type MusicSet } from "@/data/sets";

const KEY = "brahma-music-playback";

export type PlaybackSnapshot = {
  setId: string;
  position: number;
  updatedAt: number;
};

export function readPlayback(): PlaybackSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaybackSnapshot;
    if (!parsed?.setId || typeof parsed.position !== "number") return null;
    return {
      setId: parsed.setId,
      position: Math.max(0, parsed.position),
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    return null;
  }
}

export function writePlayback(snap: Omit<PlaybackSnapshot, "updatedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: PlaybackSnapshot = {
      setId: snap.setId,
      position: Math.max(0, snap.position),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearPlayback() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function resolveSet(setId: string | null | undefined): MusicSet | null {
  if (!setId) return null;
  return musicSets.find((s) => s.id === setId) ?? null;
}

export function defaultSet(): MusicSet | null {
  return musicSets.find((s) => s.audioUrl) ?? musicSets[0] ?? null;
}
