import Link from "next/link";
import type { Metadata } from "next";
import { getVisibleWritingPostMetas } from "@/lib/writing";
import styles from "./writing.module.css";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Essays on agentic infrastructure, LATAM ecosystems, and the Brahma101 thesis.",
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

export default function WritingPage() {
  const posts = getVisibleWritingPostMetas();

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Home
      </Link>
      <h1 className={styles.title}>Writing</h1>
      <p className={styles.lede}>
        Essays and notes — Markdown in{" "}
        <code>content/writing/</code>, published through git.
      </p>

      {posts.length === 0 ? (
        <p className={styles.empty}>No published posts yet.</p>
      ) : (
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug} className={styles.item}>
              <Link href={`/writing/${post.slug}`}>
                <div className={styles.meta}>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  {post.draft ? (
                    <span className={styles.draftBadge}>draft</span>
                  ) : null}
                </div>
                <h2 className={styles.itemTitle}>{post.title}</h2>
                <p className={styles.summary}>{post.summary}</p>
                {post.tags.length > 0 ? (
                  <ul className={styles.tags}>
                    {post.tags.map((tag) => (
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
