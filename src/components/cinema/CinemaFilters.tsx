"use client";

import { cinemaCountries } from "@/data/cinema/countries";
import { cinemaSubgenres } from "@/data/cinema/subgenres";
import { cinemaDecades } from "@/lib/cinema/filters";
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
            set(
              "genreId",
              e.target.value ? Number(e.target.value) : ""
            )
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
          {cinemaSubgenres.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
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
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={value.minRating}
          onChange={(e) => set("minRating", Number(e.target.value) || 0)}
          disabled={disabled}
        />
      </label>

      <label className={styles.field}>
        <span>Min votes</span>
        <input
          type="number"
          min={0}
          max={50000}
          step={10}
          value={value.minVotes}
          onChange={(e) => set("minVotes", Number(e.target.value) || 0)}
          disabled={disabled}
        />
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
        <input
          type="number"
          min={20}
          max={500}
          step={20}
          value={value.top}
          onChange={(e) => set("top", Number(e.target.value) || 100)}
          disabled={disabled}
        />
      </label>

      <div className={styles.filterActions}>
        <button type="submit" className={styles.primaryBtn} disabled={disabled}>
          Apply filters
        </button>
      </div>
    </form>
  );
}
