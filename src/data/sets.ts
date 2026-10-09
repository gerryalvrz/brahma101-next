/**
 * Self-hosted DJ sets / recordings for /music.
 * Audio lives on Cloudflare R2. Covers can be local (/public) or R2.
 */

export interface MusicSet {
  id: string;
  title: string;
  artist: string;
  date: string; // YYYY-MM-DD
  durationSec: number;
  /** Public R2 URL — omit until the set is uploaded */
  audioUrl?: string;
  /** Cover / vibe image */
  coverUrl?: string;
  category?: string;
  label?: string;
  blurb?: string;
}

const R2_PUBLIC =
  "https://pub-6541e7ac56104137814cf8b35968fc3c.r2.dev";

/** Shared flyer until per-set covers land on R2 */
const COVER_HIDDEN_TRANSMISSIONS =
  "/music/covers/hidden-transmissions.jpg";

export const setsContent = {
  title: "Metacognitive Music",
  lede: "Self-hosted sets. Hover a row — click to play.",
  archiveLabel: "archive",
  archiveHref: "/music/archive",
  backLabel: "← home",
  location: "19.43° N, 99.13° W",
  timeZone: "America/Mexico_City",
} as const;

export const musicSets: MusicSet[] = [
  {
    id: "tdj2-2026-10-09",
    title: "TDJ2 Recording",
    artist: "Locognitive",
    date: "2026-10-09",
    durationSec: 6715,
    audioUrl: `${R2_PUBLIC}/tdj2-2026-10-09.mp3`,
    coverUrl: COVER_HIDDEN_TRANSMISSIONS,
    category: "LIVE SET",
    label: "SELF HOSTED",
    blurb: "Live session · 00:50–02:42",
  },
  {
    id: "radioshow-1-hidden-transmissions",
    title: "Hidden Transmissions",
    artist: "RadioShow #1",
    date: "2026-01-01",
    durationSec: 0,
    coverUrl: COVER_HIDDEN_TRANSMISSIONS,
    category: "DJ SET",
    label: "SELF HOSTED",
    blurb: "Metacognitive Music Radioshow #1",
  },
];

export function setYear(set: MusicSet): string {
  return set.date.slice(0, 4);
}
