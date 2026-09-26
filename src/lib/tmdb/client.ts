import type {
  TmdbConfiguration,
  TmdbDiscoverResponse,
  TmdbGenreListResponse,
  TmdbMovieDetails,
} from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const DEFAULT_REVALIDATE = 60 * 60 * 6; // 6 hours

export class TmdbError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

export function getTmdbApiKey(): string | null {
  const key = process.env.TMDB_API_KEY?.trim();
  return key || null;
}

export function requireTmdbApiKey(): string {
  const key = getTmdbApiKey();
  if (!key) {
    throw new TmdbError(
      "TMDB_API_KEY is not set. Add it to .env.local and restart the dev server.",
      503
    );
  }
  return key;
}

type TmdbFetchOptions = {
  searchParams?: Record<string, string | number | boolean | undefined | null>;
  revalidate?: number | false;
};

export async function tmdbFetch<T>(
  path: string,
  options: TmdbFetchOptions = {}
): Promise<T> {
  const apiKey = requireTmdbApiKey();
  const url = new URL(`${TMDB_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("api_key", apiKey);

  const params = options.searchParams ?? {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const revalidate = options.revalidate ?? DEFAULT_REVALIDATE;
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next:
      revalidate === false
        ? { revalidate: 0 }
        : { revalidate },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { status_message?: string };
      if (body.status_message) detail = body.status_message;
    } catch {
      /* ignore */
    }
    throw new TmdbError(`TMDB ${path}: ${detail}`, res.status);
  }

  return (await res.json()) as T;
}

export async function tmdbDiscoverMovie(
  searchParams: Record<string, string | number | boolean | undefined | null>,
  revalidate?: number | false
): Promise<TmdbDiscoverResponse> {
  return tmdbFetch<TmdbDiscoverResponse>("/discover/movie", {
    searchParams: {
      include_adult: false,
      include_video: false,
      language: "en-US",
      ...searchParams,
    },
    revalidate,
  });
}

export async function tmdbMovieDetails(
  id: number,
  append: string[] = ["credits", "keywords"]
): Promise<TmdbMovieDetails> {
  return tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, {
    searchParams: {
      language: "en-US",
      append_to_response: append.join(","),
    },
  });
}

export async function tmdbGenreList(): Promise<TmdbGenreListResponse> {
  return tmdbFetch<TmdbGenreListResponse>("/genre/movie/list", {
    searchParams: { language: "en-US" },
    revalidate: 60 * 60 * 24 * 7,
  });
}

let cachedImageBase: string | null = null;

export async function tmdbImageBaseUrl(): Promise<string> {
  if (cachedImageBase) return cachedImageBase;
  try {
    const config = await tmdbFetch<TmdbConfiguration>("/configuration", {
      revalidate: 60 * 60 * 24 * 7,
    });
    cachedImageBase = config.images.secure_base_url;
  } catch {
    cachedImageBase = "https://image.tmdb.org/t/p/";
  }
  return cachedImageBase;
}

export function posterUrl(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" = "w342",
  base = "https://image.tmdb.org/t/p/"
): string | null {
  if (!path) return null;
  return `${base}${size}${path}`;
}

export function backdropUrl(
  path: string | null | undefined,
  size: "w780" | "w1280" = "w1280",
  base = "https://image.tmdb.org/t/p/"
): string | null {
  if (!path) return null;
  return `${base}${size}${path}`;
}
