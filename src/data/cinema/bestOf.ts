import type { CinemaSubgenre } from "@/data/cinema/subgenres";
import type { CinemaGenre, CinemaSort } from "@/lib/cinema/types";

/** One-click filter packs (featured or generated Best-of). */
export type CinemaPreset = {
  id: string;
  /** Short chip label */
  label: string;
  /** Full trail shown in the chip / aria */
  trail: string;
  description: string;
  filters: {
    subgenreId?: string;
    country?: string;
    decade?: number;
    genreId?: number;
    minRating?: number;
    minVotes?: number;
    sort?: CinemaSort;
    /** Cap results (Top N) */
    top?: number;
  };
};

const BEST_OF_TOP = 100;

/** Featured one-click charts (kept short — browse generates the rest). */
export const featuredCinemaPresets: CinemaPreset[] = [
  {
    id: "worldwide-top-100",
    label: "Worldwide → Top 100",
    trail: "Worldwide → Top 100",
    description: "Global films ranked by Brahma Score — no Hollywood boost.",
    filters: {
      sort: "brahma",
      minVotes: 50,
      minRating: 0,
      top: BEST_OF_TOP,
    },
  },
  {
    id: "dark-fantasy-worldwide-top-100",
    label: "Dark Fantasy → Worldwide → Top 100",
    trail: "Dark Fantasy → Worldwide → Top 100",
    description: "Dark fantasy worldwide, Brahma Score Top 100.",
    filters: {
      subgenreId: "dark-fantasy",
      sort: "brahma",
      minVotes: 50,
      minRating: 0,
      top: BEST_OF_TOP,
    },
  },
];

export const defaultCinemaPresetId = "worldwide-top-100";

/** Build a Best-of chart for any TMDB genre on the fly. */
export function bestOfGenre(genre: CinemaGenre): CinemaPreset {
  return {
    id: `best-of-genre-${genre.id}`,
    label: `Best of ${genre.name}`,
    trail: `${genre.name} → Worldwide → Top ${BEST_OF_TOP}`,
    description: `Top ${BEST_OF_TOP} ${genre.name} films worldwide by Brahma Score.`,
    filters: {
      genreId: genre.id,
      sort: "brahma",
      minVotes: 150,
      minRating: 0,
      top: BEST_OF_TOP,
    },
  };
}

/** Build a Best-of chart for any configured subgenre on the fly. */
export function bestOfSubgenre(sub: CinemaSubgenre): CinemaPreset {
  return {
    id: `best-of-subgenre-${sub.id}`,
    label: `Best of ${sub.label}`,
    trail: `${sub.label} → Worldwide → Top ${BEST_OF_TOP}`,
    description: sub.description,
    filters: {
      subgenreId: sub.id,
      sort: "brahma",
      minVotes: sub.defaultMinVotes ?? 50,
      minRating: 0,
      top: BEST_OF_TOP,
    },
  };
}
