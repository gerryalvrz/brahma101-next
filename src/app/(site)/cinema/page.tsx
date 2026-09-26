import Link from "next/link";
import type { Metadata } from "next";
import CinemaExplorer from "@/components/cinema/CinemaExplorer";
import { cinemaContent } from "@/data/cinema/content";
import { listCinemaGenres } from "@/lib/cinema/discover";
import { getTmdbApiKey } from "@/lib/tmdb/client";
import styles from "./cinema.module.css";

export const metadata: Metadata = {
  title: "World Cinema Explorer",
  description:
    "Browse global films by genre and subgenre — ranked by Brahma Score, not Hollywood popularity.",
};

/** Read TMDB_API_KEY per request (not baked at build). */
export const dynamic = "force-dynamic";

export default async function CinemaPage() {
  const hasApiKey = Boolean(getTmdbApiKey());
  let genres: { id: number; name: string }[] = [];

  if (hasApiKey) {
    try {
      genres = await listCinemaGenres();
    } catch {
      genres = [];
    }
  }

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        {cinemaContent.backLabel}
      </Link>
      <h1 className={styles.title}>{cinemaContent.title}</h1>
      <p className={styles.lede}>{cinemaContent.lede}</p>

      <CinemaExplorer initialGenres={genres} hasApiKey={hasApiKey} />
    </main>
  );
}
