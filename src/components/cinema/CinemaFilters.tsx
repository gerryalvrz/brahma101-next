"use client";

import { cinemaCountries } from "@/data/cinema/countries";
import {
  cinemaSubgenreGroups,
  cinemaSubgenres,
} from "@/data/cinema/subgenres";
import {
  cinemaDecades,
  cinemaMinVoteOptions,
  cinemaTopOptions,
} from "@/lib/cinema/filters";
import type { CinemaGenre, CinemaSort } from "@/lib/cinema/types";
import styles from "./cinema.module.css";

export type CinemaFilterState = {
  genreId: number | "";
  subgenreId: string;
  country: string;
  decade: number | "";
  minRating: number;
  minVotes: number;
  sort: CinemaSort;
  top: number;
};

type Props = {
  value: CinemaFilterState;
  genres: CinemaGenre[];
  onChange: (next: CinemaFilterState) => void;
  onApply: () => void;
  disabled?: boolean;
};

const SORT_OPTIONS: { value: CinemaSort; label: string }[] = [
  { value: "brahma", label: "Brahma Score" },
  { value: "rating", label: "TMDB rating" },
  { value: "popularity", label: "Popularity" },
  { value: "year", label: "Year" },
];

const MIN_RATING_OPTIONS = [0, 5, 6, 6.5, 7, 7.5, 8];

export default function CinemaFilters({
  value,
  genres,
  onChange,
  onApply,
  disabled,
}: Props) {
  const set = <K extends keyof CinemaFilterState>(
    key: K,
    next: CinemaFilterState[K]
  ) => onChange({ ...value, [key]: next });

  const minVotesValue = cinemaMinVoteOptions.includes(value.minVotes)
    ? value.minVotes
    : cinemaMinVoteOptions.reduce((prev, cur) =>
        Math.abs(cur - value.minVotes) < Math.abs(prev - value.minVotes)
          ? cur
          : prev
      );

  const topValue = cinemaTopOptions.includes(value.top)
    ? value.top
    : cinemaTopOptions.reduce((prev, cur) =>
        Math.abs(cur - value.top) < Math.abs(prev - value.top) ? cur : prev
      );

  return (
    <form
      className={styles.filters}
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <label className={styles.field}>
        <span>Genre</span>
        <select
          value={value.genreId === "" ? "" : String(value.genreId)}
          onChange={(e) =>
            set("genreId", e.target.value ? Number(e.target.value) : "")
          }
          disabled={disabled}
        >
          <option value="">Any</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Subgenre / keyword</span>
        <select
          value={value.subgenreId}
          onChange={(e) => set("subgenreId", e.target.value)}
          disabled={disabled}
        >
          <option value="">Any</option>
          {cinemaSubgenreGroups.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {cinemaSubgenres
                .filter((s) => s.group === group.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Country</span>
        <select
          value={value.country}
          onChange={(e) => set("country", e.target.value)}
          disabled={disabled}
        >
          <option value="">Worldwide</option>
          {cinemaCountries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Decade</span>
        <select
          value={value.decade === "" ? "" : String(value.decade)}
          onChange={(e) =>
            set("decade", e.target.value ? Number(e.target.value) : "")
          }
          disabled={disabled}
        >
          <option value="">Any</option>
          {cinemaDecades.map((d) => (
            <option key={d} value={d}>
              {d}s
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Min rating</span>
        <select
          value={String(value.minRating)}
          onChange={(e) => set("minRating", Number(e.target.value))}
          disabled={disabled}
        >
          {MIN_RATING_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? "Any" : `${n}+`}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Min votes</span>
        <select
          value={String(minVotesValue)}
          onChange={(e) => set("minVotes", Number(e.target.value))}
          disabled={disabled}
        >
          {cinemaMinVoteOptions.map((n) => (
            <option key={n} value={n}>
              {n === 0 ? "Any" : `${n.toLocaleString()}+`}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Sort</span>
        <select
          value={value.sort}
          onChange={(e) => set("sort", e.target.value as CinemaSort)}
          disabled={disabled}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Top N</span>
        <select
          value={String(topValue)}
          onChange={(e) => set("top", Number(e.target.value))}
          disabled={disabled}
        >
          {cinemaTopOptions.map((n) => (
            <option key={n} value={n}>
              Top {n}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.filterActions}>
        <button type="submit" className={styles.primaryBtn} disabled={disabled}>
          Apply filters
        </button>
      </div>
    </form>
  );
}
