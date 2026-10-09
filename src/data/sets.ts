/**
 * Self-hosted DJ sets / recordings for /music.
 * Audio lives on Cloudflare R2. Covers can be local (/public) or R2.
 *
 * List pattern (all sets):
 *   resting artist → "Locognitive"
 *   hover scramble → hoverArtist (e.g. "RadioShow #1")
 *   category → "DJ SET"
 *   label → "Metacognitive Music"
 */

export interface MusicSet {
  id: string;
  title: string;
  /** Resting list label — always Locognitive for the brand row. */
  artist: string;
  /** Revealed on hover scramble (e.g. RadioShow #1). */
  hoverArtist: string;
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

const COVER_HIDDEN_TRANSMISSIONS =
  "/music/covers/hidden-transmissions.jpg";

/** Defaults applied to every set row. */
export const SET_ROW_DEFAULTS = {
  artist: "Locognitive",
  category: "DJ SET",
  label: "Metacognitive Music",
} as const;

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
    id: "radioshow-1-hidden-transmissions",
    title: "Hidden Transmissions",
    artist: SET_ROW_DEFAULTS.artist,
    hoverArtist: "RadioShow #1",
    date: "2026-10-09",
    durationSec: 6715,
    audioUrl: `${R2_PUBLIC}/tdj2-2026-10-09.mp3`,
    coverUrl: COVER_HIDDEN_TRANSMISSIONS,
    category: SET_ROW_DEFAULTS.category,
    label: SET_ROW_DEFAULTS.label,
    blurb: "Radioshow #1 · live session",
  },
];

export function setYear(set: MusicSet): string {
  return set.date.slice(0, 4);
}
