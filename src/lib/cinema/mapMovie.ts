import { countryLabel } from "@/data/cinema/countries";
import { computeBrahmaScore } from "@/lib/cinema/brahmaScore";
import { backdropUrl, posterUrl } from "@/lib/tmdb/client";
import type { TmdbGenre, TmdbMovieDetails, TmdbMovieListItem } from "@/lib/tmdb/types";
import type {
  CinemaGenre,
  CinemaMovieDetail,
  CinemaMovieSummary,
} from "@/lib/cinema/types";

function yearFromDate(date: string | undefined): number | null {
  if (!date || date.length < 4) return null;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) ? y : null;
}

function pickDirector(details?: TmdbMovieDetails): string | null {
  const crew = details?.credits?.crew;
  if (!crew?.length) return null;
  const directors = crew.filter((c) => c.job === "Director");
  if (directors.length === 0) return null;
  return directors.map((d) => d.name).join(", ");
}

function resolveCountries(
  item: TmdbMovieListItem,
  details?: TmdbMovieDetails
): string[] {
  if (details?.production_countries?.length) {
    return details.production_countries.map((c) => c.iso_3166_1);
  }
  if (item.origin_country?.length) return item.origin_country;
  return [];
}

function resolveGenres(
  item: TmdbMovieListItem,
  genreMap: Map<number, string>,
  details?: TmdbMovieDetails
): CinemaGenre[] {
  if (details?.genres?.length) {
    return details.genres.map((g) => ({ id: g.id, name: g.name }));
  }
  return (item.genre_ids ?? [])
    .map((id) => {
      const name = genreMap.get(id);
      return name ? { id, name } : null;
    })
    .filter((g): g is CinemaGenre => g !== null);
}

export function mapMovieSummary(
  item: TmdbMovieListItem,
  genreMap: Map<number, string>,
  details?: TmdbMovieDetails
): CinemaMovieSummary {
  const countries = resolveCountries(item, details);
  const keywords =
    details?.keywords?.keywords?.map((k) => k.name).slice(0, 8) ?? [];

  return {
    id: item.id,
    title: item.title,
    originalTitle: item.original_title,
    year: yearFromDate(item.release_date),
    overview: item.overview ?? "",
    posterPath: item.poster_path,
    posterUrl: posterUrl(item.poster_path),
    countries,
    countryLabels: countries
      .map((c) => countryLabel(c))
      .filter((c): c is string => Boolean(c)),
    genres: resolveGenres(item, genreMap, details),
    keywords,
    director: pickDirector(details),
    voteAverage: item.vote_average,
    voteCount: item.vote_count,
    popularity: item.popularity,
    brahmaScore: computeBrahmaScore({
      voteAverage: item.vote_average,
      voteCount: item.vote_count,
    }),
    tmdbUrl: `https://www.themoviedb.org/movie/${item.id}`,
  };
}

export function mapMovieDetail(
  details: TmdbMovieDetails,
  genreMap: Map<number, string>
): CinemaMovieDetail {
  const base = mapMovieSummary(details, genreMap, details);
  const cast = (details.credits?.cast ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .slice(0, 12)
    .map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
    }));

  return {
    ...base,
    runtime: details.runtime ?? null,
    tagline: details.tagline || null,
    backdropUrl: backdropUrl(details.backdrop_path),
    cast,
  };
}

export function genreListToMap(genres: TmdbGenre[]): Map<number, string> {
  return new Map(genres.map((g) => [g.id, g.name]));
}
