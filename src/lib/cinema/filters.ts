import { z } from "zod";
import type { CinemaDiscoverFilters, CinemaSort } from "@/lib/cinema/types";

export const CINEMA_PAGE_SIZE = 20;
export const CINEMA_DEFAULT_MIN_VOTES = 50;
export const CINEMA_DEFAULT_MIN_RATING = 0;
export const CINEMA_DEFAULT_SORT: CinemaSort = "brahma";
export const CINEMA_DEFAULT_TOP = 100;

const sortSchema = z.enum(["brahma", "rating", "popularity", "year"]);

export const cinemaDiscoverQuerySchema = z.object({
  genreId: z.coerce.number().int().positive().optional(),
  subgenreId: z.string().min(1).max(64).optional(),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  decade: z.coerce
    .number()
    .int()
    .min(1920)
    .max(2020)
    .refine((n) => n % 10 === 0, "decade must be a multiple of 10")
    .optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  minVotes: z.coerce.number().int().min(0).max(50_000).optional(),
  sort: sortSchema.optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  top: z.coerce.number().int().min(1).max(500).optional(),
});

export type CinemaDiscoverQuery = z.infer<typeof cinemaDiscoverQuerySchema>;

export function normalizeDiscoverFilters(
  raw: CinemaDiscoverQuery
): Required<
  Pick<
    CinemaDiscoverFilters,
    "minRating" | "minVotes" | "sort" | "page" | "top"
  >
> &
  Pick<
    CinemaDiscoverFilters,
    "genreId" | "subgenreId" | "country" | "decade"
  > {
  return {
    genreId: raw.genreId,
    subgenreId: raw.subgenreId,
    country: raw.country,
    decade: raw.decade,
    minRating: raw.minRating ?? CINEMA_DEFAULT_MIN_RATING,
    minVotes: raw.minVotes ?? CINEMA_DEFAULT_MIN_VOTES,
    sort: raw.sort ?? CINEMA_DEFAULT_SORT,
    page: raw.page ?? 1,
    top: raw.top ?? CINEMA_DEFAULT_TOP,
  };
}

export const cinemaDecades: number[] = [
  2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950, 1940, 1930, 1920,
];

/** Preset floors for the Min votes filter (select, not free number). */
export const cinemaMinVoteOptions: number[] = [
  0, 50, 100, 200, 500, 1000, 2500, 5000,
];

/** Preset caps for Top N. */
export const cinemaTopOptions: number[] = [20, 50, 100, 200];

export function decadeRange(decade: number): {
  gte: string;
  lte: string;
} {
  return {
    gte: `${decade}-01-01`,
    lte: `${decade + 9}-12-31`,
  };
}
