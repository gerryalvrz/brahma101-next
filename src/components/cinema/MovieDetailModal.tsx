"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import type { CinemaMovieDetail, CinemaMovieSummary } from "@/lib/cinema/types";
import { yandexWatchSearchUrl } from "@/lib/cinema/yandexWatch";
import styles from "./cinema.module.css";

type Props = {
  movie: CinemaMovieSummary | null;
  open: boolean;
  onClose: () => void;
};

export default function MovieDetailModal({ movie, open, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [detail, setDetail] = useState<CinemaMovieDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !movie) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/cinema/movie/${movie.id}`)
      .then(async (res) => {
        const body = (await res.json()) as CinemaMovieDetail & {
          error?: string;
        };
        if (!res.ok) throw new Error(body.error || "Failed to load details");
        if (!cancelled) setDetail(body);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, movie]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !movie) return null;

  const view = detail ?? movie;
  const originalDiffers =
    view.originalTitle &&
    view.originalTitle.toLowerCase() !== view.title.toLowerCase();

  return (
    <div
      className={styles.modalRoot}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className={styles.modalBackdrop}
        aria-label="Close"
        onClick={onClose}
      />
      <div className={styles.modalPanel}>
        <div className={styles.modalHeader}>
          <h2 id={titleId} className={styles.modalTitle}>
            {view.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.modalClose}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalPosterCol}>
            {view.posterUrl ? (
              <Image
                src={view.posterUrl}
                alt=""
                width={342}
                height={513}
                className={styles.modalPoster}
              />
            ) : (
              <div className={styles.posterFallback}>No poster</div>
            )}
          </div>

          <div className={styles.modalInfo}>
            {originalDiffers ? (
              <p className={styles.originalTitle}>{view.originalTitle}</p>
            ) : null}

            <p className={styles.modalMeta}>
              {[
                view.year ?? "—",
                view.countryLabels.join(", ") ||
                  view.countries.join(", ") ||
                  null,
                view.director ? `Director: ${view.director}` : null,
                detail?.runtime ? `${detail.runtime} min` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            <p className={styles.ratingRow}>
              <span className={styles.tmdbRating}>
                <span className={styles.star} aria-hidden>
                  ★
                </span>
                {view.voteAverage.toFixed(1)}
                <span className={styles.voteCount}>
                  ({view.voteCount.toLocaleString()})
                </span>
              </span>
              <span className={styles.brahmaRating}>
                Brahma {view.brahmaScore.toFixed(1)}
              </span>
            </p>

            {loading ? (
              <p className={styles.statusLine}>Loading details…</p>
            ) : null}
            {error ? <p className={styles.errorLine}>{error}</p> : null}

            {detail?.tagline ? (
              <p className={styles.tagline}>{detail.tagline}</p>
            ) : null}

            <p className={styles.overview}>
              {view.overview || "No overview available."}
            </p>

            {view.genres.length > 0 ? (
              <div className={styles.detailBlock}>
                <h3>Genres</h3>
                <ul className={styles.tagRow}>
                  {view.genres.map((g) => (
                    <li key={g.id} className={styles.tag}>
                      {g.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {view.keywords.length > 0 ? (
              <div className={styles.detailBlock}>
                <h3>Keywords</h3>
                <ul className={styles.tagRow}>
                  {view.keywords.map((k) => (
                    <li key={k} className={styles.tagMuted}>
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {detail?.cast && detail.cast.length > 0 ? (
              <div className={styles.detailBlock}>
                <h3>Cast</h3>
                <ul className={styles.castList}>
                  {detail.cast.map((c) => (
                    <li key={c.id}>
                      <strong>{c.name}</strong>
                      {c.character ? ` — ${c.character}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className={styles.watchActions}>
              <a
                href={yandexWatchSearchUrl({
                  title: view.title,
                  year: view.year,
                  director: view.director,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.watchLink}
              >
                Watch online (Yandex) →
              </a>
              <a
                href={view.tmdbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                View on TMDB →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
