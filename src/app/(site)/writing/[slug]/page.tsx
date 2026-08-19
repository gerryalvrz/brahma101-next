import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getVisibleWritingSlugs,
  getWritingPostBySlug,
  renderMarkdownToHtml,
} from "@/lib/writing";
import WritingReaderTerminal from "@/components/writing/WritingReaderTerminal";
import styles from "../writing.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getVisibleWritingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getWritingPostBySlug(slug);
  if (!post) {
    return { title: "Not found" };
  }
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: `${post.date}T00:00:00.000Z`,
      tags: post.tags,
    },
  };
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function WritingPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getWritingPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const html = renderMarkdownToHtml(post.content);

  return (
    <WritingReaderTerminal slug={slug} title={post.title}>
      <article>
        <header className={styles.articleHeader}>
          <div className={styles.meta}>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.draft ? (
              <span className={styles.draftBadge}>draft</span>
            ) : null}
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.articleSummary}>{post.summary}</p>
          {post.tags.length > 0 ? (
            <ul className={styles.tags}>
              {post.tags.map((tag) => (
                <li key={tag} className={styles.tag}>
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </WritingReaderTerminal>
  );
}
