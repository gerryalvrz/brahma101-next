/** Raw TMDB API shapes used by the cinema feature. */

export type TmdbGenre = { id: number; name: string };

export type TmdbMovieListItem = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  genre_ids?: number[];
  origin_country?: string[];
  original_language?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult?: boolean;
};

export type TmdbDiscoverResponse = {
  page: number;
  results: TmdbMovieListItem[];
  total_pages: number;
  total_results: number;
};

export type TmdbCredits = {
  cast: {
    id: number;
    name: string;
    character: string;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
  }[];
};

export type TmdbKeywords = {
  keywords: { id: number; name: string }[];
};

export type TmdbMovieDetails = TmdbMovieListItem & {
  runtime: number | null;
  tagline: string | null;
  genres: TmdbGenre[];
  production_countries?: { iso_3166_1: string; name: string }[];
  credits?: TmdbCredits;
  keywords?: TmdbKeywords;
};

export type TmdbGenreListResponse = {
  genres: TmdbGenre[];
};

export type TmdbConfiguration = {
  images: {
    secure_base_url: string;
    poster_sizes: string[];
    backdrop_sizes: string[];
  };
};
