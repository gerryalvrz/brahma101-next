"use client";

import {
  cinemaSubgenreGroups,
  cinemaSubgenres,
  type CinemaSubgenre,
} from "@/data/cinema/subgenres";
import type { CinemaGenre } from "@/lib/cinema/types";
import styles from "./cinema.module.css";

type Props = {
  genres: CinemaGenre[];
  activeGenreId: number | "" | null;
  activeSubgenreId: string | null;
  onSelectGenre: (genre: CinemaGenre) => void;
  onSelectSubgenre: (sub: CinemaSubgenre) => void;
  disabled?: boolean;
};

export default function CinemaBrowse({
  genres,
  activeGenreId,
  activeSubgenreId,
  onSelectGenre,
  onSelectSubgenre,
  disabled,
}: Props) {
  return (
    <div className={styles.browse}>
      <div className={styles.browseBlock}>
        <h3 className={styles.browseHeading}>Best of genre</h3>
        <p className={styles.browseHint}>
          Tap a TMDB genre for a Worldwide Top 100 by Brahma Score.
        </p>
        <div className={styles.browseGrid} role="list">
          {genres.map((genre) => {
            const active = activeGenreId === genre.id && !activeSubgenreId;
            return (
              <button
                key={genre.id}
                type="button"
                role="listitem"
                className={
                  active
                    ? `${styles.browseChip} ${styles.browseChipActive}`
                    : styles.browseChip
                }
                disabled={disabled}
                aria-pressed={active}
                onClick={() => onSelectGenre(genre)}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.browseBlock}>
        <h3 className={styles.browseHeading}>Best of subgenre</h3>
        <p className={styles.browseHint}>
          Keyword-level charts — more precise than TMDB genres alone.
        </p>
        {cinemaSubgenreGroups.map((group) => {
          const items = cinemaSubgenres.filter((s) => s.group === group.id);
          if (items.length === 0) return null;
          return (
            <div key={group.id} className={styles.browseGroup}>
              <h4 className={styles.browseGroupLabel}>{group.label}</h4>
              <div className={styles.browseGrid} role="list">
                {items.map((sub) => {
                  const active = activeSubgenreId === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      role="listitem"
                      className={
                        active
                          ? `${styles.browseChip} ${styles.browseChipActive}`
                          : styles.browseChip
                      }
                      title={sub.description}
                      disabled={disabled}
                      aria-pressed={active}
                      onClick={() => onSelectSubgenre(sub)}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
