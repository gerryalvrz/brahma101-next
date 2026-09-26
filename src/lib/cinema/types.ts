export type CinemaSort = "brahma" | "rating" | "popularity" | "year";

export type CinemaGenre = {
  id: number;
  name: string;
};

export type CinemaMovieSummary = {
  id: number;
  title: string;
  originalTitle: string;
  year: number | null;
  overview: string;
  posterPath: string | null;
  posterUrl: string | null;
  countries: string[];
  countryLabels: string[];
  genres: CinemaGenre[];
  keywords: string[];
  director: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  brahmaScore: number;
  tmdbUrl: string;
};

export type CinemaMovieDetail = CinemaMovieSummary & {
  runtime: number | null;
  tagline: string | null;
  backdropUrl: string | null;
  cast: { id: number; name: string; character: string }[];
};

export type CinemaDiscoverFilters = {
  genreId?: number;
  /** Subgenre slug from `src/data/cinema/subgenres.ts` */
  subgenreId?: string;
  /** ISO 3166-1 alpha-2 */
  country?: string;
  /** e.g. 1990 → 1990-01-01 … 1999-12-31 */
  decade?: number;
  minRating?: number;
  minVotes?: number;
  sort?: CinemaSort;
  page?: number;
  /** Cap total results (Top N). Default unlimited beyond TMDB pages. */
  top?: number;
};

export type CinemaDiscoverResponse = {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  results: CinemaMovieSummary[];
  filters: Required<
    Pick<
      CinemaDiscoverFilters,
      "minRating" | "minVotes" | "sort" | "page" | "top"
    >
  > &
    Pick<
      CinemaDiscoverFilters,
      "genreId" | "subgenreId" | "country" | "decade"
    >;
};
