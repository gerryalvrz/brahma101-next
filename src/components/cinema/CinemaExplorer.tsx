"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bestOfGenre, bestOfSubgenre } from "@/data/cinema/bestOf";
import { cinemaContent } from "@/data/cinema/content";
import { cinemaCountries } from "@/data/cinema/countries";
import {
  cinemaPresets,
  defaultCinemaPresetId,
  type CinemaPreset,
} from "@/data/cinema/presets";
import {
  getSubgenreById,
  type CinemaSubgenre,
} from "@/data/cinema/subgenres";
import type {
  CinemaDiscoverResponse,
  CinemaGenre,
  CinemaMovieSummary,
} from "@/lib/cinema/types";
import CinemaBrowse from "./CinemaBrowse";
import CinemaFilters, {
  type CinemaFilterState,
} from "./CinemaFilters";
import CinemaPresets from "./CinemaPresets";
import MovieCard from "./MovieCard";
import MovieDetailModal from "./MovieDetailModal";
import styles from "./cinema.module.css";

function presetToFilters(preset: CinemaPreset): CinemaFilterState {
  const f = preset.filters;
  return {
    genreId: f.genreId ?? "",
    subgenreId: f.subgenreId ?? "",
    country: f.country ?? "",
    decade: f.decade ?? "",
    minRating: f.minRating ?? 0,
    minVotes: f.minVotes ?? 200,
    sort: f.sort ?? "brahma",
    top: f.top ?? 100,
  };
}

function filtersToQuery(filters: CinemaFilterState, page: number): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("sort", filters.sort);
  params.set("minRating", String(filters.minRating));
  params.set("minVotes", String(filters.minVotes));
  params.set("top", String(filters.top));
  if (filters.genreId !== "") params.set("genreId", String(filters.genreId));
  if (filters.subgenreId) params.set("subgenreId", filters.subgenreId);
  if (filters.country) params.set("country", filters.country);
  if (filters.decade !== "") params.set("decade", String(filters.decade));
  return params.toString();
}

function chartEyebrow(
  filters: CinemaFilterState,
  genres: CinemaGenre[]
): string {
  const parts = ["WORLD CINEMA"];
  if (filters.subgenreId) {
    const sub = getSubgenreById(filters.subgenreId);
    if (sub) parts.push(sub.label.toUpperCase());
  } else if (filters.genreId !== "") {
    const g = genres.find((x) => x.id === filters.genreId);
    parts.push((g?.name ?? "GENRE").toUpperCase());
  }
  return parts.join(": ");
}

function chartHeadline(
  filters: CinemaFilterState,
  total: number,
  genres: CinemaGenre[]
): string {
  const n = total || filters.top;
  const scope = filters.country
    ? cinemaCountries.find((c) => c.code === filters.country)?.label ??
      filters.country
    : "worldwide";

  let focus = "world cinema";
  if (filters.subgenreId) {
    focus = getSubgenreById(filters.subgenreId)?.label ?? focus;
  } else if (filters.genreId !== "") {
    focus = genres.find((g) => g.id === filters.genreId)?.name ?? focus;
  }

  const sortLabel =
    filters.sort === "brahma"
      ? "Brahma Score"
      : filters.sort === "rating"
        ? "TMDB rating"
        : filters.sort === "popularity"
          ? "popularity"
          : "year";

  return `Top ${n} ${focus} titles · ${scope} · by ${sortLabel}`;
}

type Props = {
  initialGenres: CinemaGenre[];
  hasApiKey: boolean;
};

export default function CinemaExplorer({ initialGenres, hasApiKey }: Props) {
  const defaultPreset =
    cinemaPresets.find((p) => p.id === defaultCinemaPresetId) ??
    cinemaPresets[0];

  const [filters, setFilters] = useState<CinemaFilterState>(() =>
    presetToFilters(defaultPreset)
  );
  const [applied, setApplied] = useState<CinemaFilterState>(() =>
    presetToFilters(defaultPreset)
  );
  const [activePresetId, setActivePresetId] = useState<string | null>(
    defaultCinemaPresetId
  );
  const [genres] = useState<CinemaGenre[]>(initialGenres);
  const [movies, setMovies] = useState<CinemaMovieSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CinemaMovieSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLElement | null>(null);
  const chartRef = useRef<HTMLElement | null>(null);

  const fetchPage = useCallback(
    async (filterState: CinemaFilterState, pageNum: number, append: boolean) => {
      if (!hasApiKey) {
        setError(cinemaContent.missingKey);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/cinema/discover?${filtersToQuery(filterState, pageNum)}`,
          { signal: controller.signal }
        );
        const body = (await res.json()) as CinemaDiscoverResponse & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error || `Request failed (${res.status})`);
        }

        setTotalPages(body.totalPages);
        setTotalResults(body.totalResults);
        setPage(body.page);
        setMovies((prev) =>
          append ? [...prev, ...body.results] : body.results
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load films");
        if (!append) setMovies([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hasApiKey]
  );

  useEffect(() => {
    void fetchPage(applied, 1, false);
    return () => abortRef.current?.abort();
  }, [applied, fetchPage]);

  const applyChart = (preset: CinemaPreset) => {
    const next = presetToFilters(preset);
    setFilters(next);
    setActivePresetId(preset.id);
    setPage(1);
    setApplied(next);
    requestAnimationFrame(() => {
      chartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const applyFilters = () => {
    setActivePresetId(null);
    setPage(1);
    setApplied({ ...filters });
  };

  const onSelectGenre = (genre: CinemaGenre) => {
    applyChart(bestOfGenre(genre));
  };

  const onSelectSubgenre = (sub: CinemaSubgenre) => {
    applyChart(bestOfSubgenre(sub));
  };

  const openRefine = () => {
    setFiltersOpen(true);
    requestAnimationFrame(() => {
      filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const canLoadMore = page < totalPages && !loading && !loadingMore && !error;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !canLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void fetchPage(applied, page + 1, true);
        }
      },
      { rootMargin: "240px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, applied, page, fetchPage]);

  const chartTitle = useMemo(
    () => chartHeadline(applied, totalResults, genres),
    [applied, totalResults, genres]
  );

  return (
    <div className={styles.explorer}>
      <section className={styles.section} aria-labelledby="cinema-presets">
        <h2 id="cinema-presets" className={styles.sectionTitle}>
          {cinemaContent.presetsHeading}
        </h2>
        <CinemaPresets
          activeId={activePresetId}
          onSelect={applyChart}
          disabled={loading}
        />
      </section>

      <section className={styles.section} aria-labelledby="cinema-browse">
        <h2 id="cinema-browse" className={styles.sectionTitle}>
          {cinemaContent.browseHeading}
        </h2>
        <CinemaBrowse
          genres={genres}
          activeGenreId={applied.genreId}
          activeSubgenreId={applied.subgenreId || null}
          onSelectGenre={onSelectGenre}
          onSelectSubgenre={onSelectSubgenre}
          disabled={loading || !hasApiKey}
        />
      </section>

      <section
        ref={filtersRef}
        className={styles.section}
        aria-labelledby="cinema-filters"
        hidden={!filtersOpen}
      >
        <div className={styles.filtersHeader}>
          <h2 id="cinema-filters" className={styles.sectionTitle}>
            {cinemaContent.filtersHeading}
          </h2>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setFiltersOpen(false)}
          >
            Hide filters
          </button>
        </div>
        <CinemaFilters
          value={filters}
          genres={genres}
          onChange={setFilters}
          onApply={applyFilters}
          disabled={loading || !hasApiKey}
        />
        <p className={styles.scoreHint}>{cinemaContent.scoreHint}</p>
      </section>

      <section
        ref={chartRef}
        className={styles.section}
        aria-labelledby="cinema-chart-title"
      >
        <p className={styles.chartEyebrow}>
          {chartEyebrow(applied, genres)}
        </p>
        <h2 id="cinema-chart-title" className={styles.chartTitle}>
          {loading && movies.length === 0 ? "Loading chart…" : chartTitle}
        </h2>
        <p className={styles.chartSub}>
          Ranked by Brahma Score — strong ratings with vote confidence, no
          Hollywood popularity boost.
        </p>

        <div className={styles.chartToolbar}>
          <p className={styles.titleCount} aria-live="polite">
            {error
              ? "—"
              : loading && movies.length === 0
                ? "…"
                : `${totalResults} Titles`}
          </p>
          <button
            type="button"
            className={styles.refineLink}
            onClick={openRefine}
          >
            Refine and expand results →
          </button>
        </div>

        {error ? (
          <p className={styles.errorLine} role="alert">
            {error}
          </p>
        ) : null}

        {!hasApiKey ? (
          <p className={styles.statusLine}>{cinemaContent.missingKey}</p>
        ) : null}

        {loading && movies.length === 0 ? (
          <div className={styles.skeletonList} aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : movies.length === 0 && !loading && !error ? (
          <p className={styles.statusLine}>{cinemaContent.empty}</p>
        ) : (
          <ol className={styles.list}>
            {movies.map((movie, index) => (
              <li key={movie.id}>
                <MovieCard
                  movie={movie}
                  rank={index + 1}
                  onSelect={(m) => {
                    setSelected(m);
                    setModalOpen(true);
                  }}
                />
              </li>
            ))}
          </ol>
        )}

        <div ref={sentinelRef} className={styles.sentinel} />
        {loadingMore ? (
          <p className={styles.statusLine}>Loading more…</p>
        ) : null}
        {!canLoadMore && movies.length > 0 && page >= totalPages ? (
          <p className={styles.statusLine}>End of list.</p>
        ) : null}
      </section>

      <MovieDetailModal
        movie={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
