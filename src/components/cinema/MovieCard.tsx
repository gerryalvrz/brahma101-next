"use client";

import Image from "next/image";
import type { CinemaMovieSummary } from "@/lib/cinema/types";
import styles from "./cinema.module.css";

type Props = {
  movie: CinemaMovieSummary;
  rank: number;
  onSelect: (movie: CinemaMovieSummary) => void;
};

function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

export default function MovieCard({ movie, rank, onSelect }: Props) {
  const originalDiffers =
    movie.originalTitle &&
    movie.originalTitle.toLowerCase() !== movie.title.toLowerCase();

  const country =
    movie.countryLabels[0] ?? movie.countries[0] ?? "Worldwide";
  const genres = movie.genres
    .slice(0, 3)
    .map((g) => g.name)
    .join(", ");

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.cardButton}
        onClick={() => onSelect(movie)}
        aria-label={`#${rank} ${movie.title} — open details`}
      >
        <div className={styles.posterWrap}>
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt=""
              width={92}
              height={138}
              className={styles.poster}
            />
          ) : (
            <div className={styles.posterFallback}>No poster</div>
          )}
        </div>

        <div className={styles.cardBody}>
          <span className={styles.rankBadge}>#{rank}</span>

          <h3 className={styles.cardTitle}>{movie.title}</h3>

          {originalDiffers ? (
            <p className={styles.originalTitle}>{movie.originalTitle}</p>
          ) : null}

          <p className={styles.cardMeta}>
            {[
              movie.year ?? "—",
              country,
              movie.director ? `dir. ${movie.director}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {genres ? <p className={styles.cardGenres}>{genres}</p> : null}

          <div className={styles.ratingRow}>
            <span className={styles.tmdbRating} title="TMDB rating">
              <span className={styles.star} aria-hidden>
                ★
              </span>
              {movie.voteAverage.toFixed(1)}
              <span className={styles.voteCount}>
                ({formatVotes(movie.voteCount)})
              </span>
            </span>
            <span className={styles.brahmaRating} title="Brahma Score">
              Brahma {movie.brahmaScore.toFixed(1)}
            </span>
          </div>

          {movie.keywords.length > 0 ? (
            <ul className={styles.tagRow}>
              {movie.keywords.slice(0, 3).map((k) => (
                <li key={k} className={styles.tagMuted}>
                  {k}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <span className={styles.infoBtn} aria-hidden>
          i
        </span>
      </button>
    </article>
  );
}
