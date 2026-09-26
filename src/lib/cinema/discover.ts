import { getSubgenreById } from "@/data/cinema/subgenres";
import {
  CINEMA_PAGE_SIZE,
  decadeRange,
  normalizeDiscoverFilters,
  type CinemaDiscoverQuery,
} from "@/lib/cinema/filters";
import { genreListToMap, mapMovieDetail, mapMovieSummary } from "@/lib/cinema/mapMovie";
import type {
  CinemaDiscoverResponse,
  CinemaMovieDetail,
  CinemaMovieSummary,
  CinemaSort,
} from "@/lib/cinema/types";
import {
  tmdbDiscoverMovie,
  tmdbGenreList,
  tmdbMovieDetails,
} from "@/lib/tmdb/client";
import type { TmdbMovieListItem } from "@/lib/tmdb/types";
import { computeBrahmaScore } from "@/lib/cinema/brahmaScore";

/** How many TMDB pages to pull when re-ranking by Brahma Score. */
const BRAHMA_POOL_PAGES = 5;

function tmdbSortParam(sort: CinemaSort): string {
  switch (sort) {
    case "rating":
      return "vote_average.desc";
    case "year":
      return "primary_release_date.desc";
    case "popularity":
      return "popularity.desc";
    case "brahma":
    default:
      // Strong pool for re-ranking: high averages with enough votes already filtered.
      return "vote_average.desc";
  }
}

function buildDiscoverParams(
  filters: ReturnType<typeof normalizeDiscoverFilters>,
  page: number
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    page,
    sort_by: tmdbSortParam(filters.sort),
    "vote_count.gte": filters.minVotes,
    "vote_average.gte": filters.minRating,
  };

  if (filters.genreId) {
    params.with_genres = filters.genreId;
  }

  if (filters.subgenreId) {
    const sub = getSubgenreById(filters.subgenreId);
    if (sub) params.with_keywords = sub.withKeywords;
  }

  if (filters.country) {
    params.with_origin_country = filters.country;
  }

  if (filters.decade) {
    const range = decadeRange(filters.decade);
    params["primary_release_date.gte"] = range.gte;
    params["primary_release_date.lte"] = range.lte;
  }

  return params;
}

async function loadGenreMap(): Promise<Map<number, string>> {
  const { genres } = await tmdbGenreList();
  return genreListToMap(genres);
}

/** Enrich a batch with credits/keywords (cached via tmdbFetch). */
async function enrichSummaries(
  items: TmdbMovieListItem[],
  genreMap: Map<number, string>
): Promise<CinemaMovieSummary[]> {
  const enriched = await Promise.all(
    items.map(async (item) => {
      try {
        const details = await tmdbMovieDetails(item.id);
        return mapMovieSummary(item, genreMap, details);
      } catch {
        return mapMovieSummary(item, genreMap);
      }
    })
  );
  return enriched;
}

function sortByBrahma(movies: CinemaMovieSummary[]): CinemaMovieSummary[] {
  return movies.slice().sort((a, b) => {
    if (b.brahmaScore !== a.brahmaScore) return b.brahmaScore - a.brahmaScore;
    if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
    return b.voteAverage - a.voteAverage;
  });
}

function dedupeById(items: TmdbMovieListItem[]): TmdbMovieListItem[] {
  const seen = new Set<number>();
  const out: TmdbMovieListItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Rank list items by Brahma Score, then keep Top N for pagination. */
function rankPoolByBrahma(
  pooled: TmdbMovieListItem[],
  top: number
): TmdbMovieListItem[] {
  return pooled
    .slice()
    .sort((a, b) => {
      const sa = computeBrahmaScore({
        voteAverage: a.vote_average,
        voteCount: a.vote_count,
      });
      const sb = computeBrahmaScore({
        voteAverage: b.vote_average,
        voteCount: b.vote_count,
      });
      if (sb !== sa) return sb - sa;
      if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count;
      return b.vote_average - a.vote_average;
    })
    .slice(0, top);
}

export async function discoverCinema(
  raw: CinemaDiscoverQuery
): Promise<CinemaDiscoverResponse> {
  const filters = normalizeDiscoverFilters(raw);
  const genreMap = await loadGenreMap();
  const pageSize = CINEMA_PAGE_SIZE;
  const top = filters.top;

  if (filters.sort === "brahma") {
    const poolNeeded = Math.min(Math.max(top, pageSize), BRAHMA_POOL_PAGES * 20);
    const pagesToFetch = Math.ceil(poolNeeded / 20);

    const pageResults = await Promise.all(
      Array.from({ length: pagesToFetch }, (_, i) =>
        tmdbDiscoverMovie(buildDiscoverParams(filters, i + 1))
      )
    );

    const ranked = rankPoolByBrahma(
      dedupeById(pageResults.flatMap((p) => p.results)),
      top
    );
    const totalResults = ranked.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * pageSize;
    const pageSlice = ranked.slice(start, start + pageSize);
    const results = sortByBrahma(await enrichSummaries(pageSlice, genreMap));

    return {
      page,
      pageSize,
      totalResults,
      totalPages,
      results,
      filters,
    };
  }

  // Direct TMDB sort — still capped by `top` across pages
  const maxPageByTop = Math.ceil(top / pageSize);
  if (filters.page > maxPageByTop) {
    return {
      page: filters.page,
      pageSize,
      totalResults: top,
      totalPages: maxPageByTop,
      results: [],
      filters,
    };
  }

  const data = await tmdbDiscoverMovie(
    buildDiscoverParams(filters, filters.page)
  );
  const tmdbTotal = Math.min(data.total_results, top);
  const totalPages = Math.min(data.total_pages, maxPageByTop);

  let pageItems = data.results;
  const remaining = top - (filters.page - 1) * pageSize;
  if (remaining < pageItems.length) {
    pageItems = pageItems.slice(0, Math.max(0, remaining));
  }

  const results = await enrichSummaries(pageItems, genreMap);

  return {
    page: filters.page,
    pageSize,
    totalResults: tmdbTotal,
    totalPages,
    results,
    filters,
  };
}

export async function getCinemaMovieDetail(
  id: number
): Promise<CinemaMovieDetail> {
  const [details, genreMap] = await Promise.all([
    tmdbMovieDetails(id),
    loadGenreMap(),
  ]);
  return mapMovieDetail(details, genreMap);
}

export async function listCinemaGenres() {
  const { genres } = await tmdbGenreList();
  return genres.slice().sort((a, b) => a.name.localeCompare(b.name));
}
