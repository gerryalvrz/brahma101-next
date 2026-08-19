import Link from "next/link";
import type { Metadata } from "next";
import { getVisiblePaperMetas } from "@/lib/papers";
import styles from "../writing/writing.module.css";

export const metadata: Metadata = {
  title: "Research papers",
  description:
    "PDFs from the Brahma101 research archive — git-sourced, served from /papers.",
};

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function PapersPage() {
  const papers = getVisiblePaperMetas();

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Home
      </Link>
      <h1 className={styles.title}>Research papers</h1>
      <p className={styles.lede}>
        PDFs in <code>public/papers/</code>, catalogued in{" "}
        <code>content/papers/</code>.
      </p>

      {papers.length === 0 ? (
        <p className={styles.empty}>No papers in the library yet.</p>
      ) : (
        <ul className={styles.list}>
          {papers.map((paper) => (
            <li key={paper.slug} className={styles.item}>
              <Link href={`/papers/${paper.slug}`}>
                <div className={styles.meta}>
                  <time dateTime={paper.date}>{formatDate(paper.date)}</time>
                  {paper.draft ? (
                    <span className={styles.draftBadge}>draft</span>
                  ) : null}
                </div>
                <h2 className={styles.itemTitle}>{paper.title}</h2>
                <p className={styles.summary}>{paper.summary}</p>
                {paper.tags.length > 0 ? (
                  <ul className={styles.tags}>
                    {paper.tags.map((tag) => (
                      <li key={tag} className={styles.tag}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
