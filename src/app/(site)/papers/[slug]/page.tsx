import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getVisiblePaperSlugs,
  getPaperBySlug,
} from "@/lib/papers";
import { renderMarkdownToHtml } from "@/lib/writing";
import WritingReaderTerminal from "@/components/writing/WritingReaderTerminal";
import styles from "../../writing/writing.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getVisiblePaperSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const paper = getPaperBySlug(slug);
  if (!paper) {
    return { title: "Not found" };
  }
  return {
    title: paper.title,
    description: paper.summary,
    openGraph: {
      title: paper.title,
      description: paper.summary,
      type: "article",
      publishedTime: `${paper.date}T00:00:00.000Z`,
      tags: paper.tags,
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

export default async function PaperPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug.endsWith(".pdf")) {
    notFound();
  }
  const paper = getPaperBySlug(slug);
  if (!paper) {
    notFound();
  }

  const abstractHtml = paper.content
    ? renderMarkdownToHtml(paper.content)
    : "";

  return (
    <WritingReaderTerminal
      slug={slug}
      title={paper.title}
      fileLabel={`${slug}.pdf`}
      hint="papers · read"
      indexHref="/papers"
      indexLabel="Papers"
    >
      <article>
        <header className={styles.articleHeader}>
          <div className={styles.meta}>
            <time dateTime={paper.date}>{formatDate(paper.date)}</time>
            {paper.draft ? (
              <span className={styles.draftBadge}>draft</span>
            ) : null}
          </div>
          <h1 className={styles.title}>{paper.title}</h1>
          <p className={styles.articleSummary}>{paper.summary}</p>
          {paper.tags.length > 0 ? (
            <ul className={styles.tags}>
              {paper.tags.map((tag) => (
                <li key={tag} className={styles.tag}>
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>
        {abstractHtml ? (
          <div
            className={styles.body}
            dangerouslySetInnerHTML={{ __html: abstractHtml }}
          />
        ) : null}
        <p className={styles.pdfActions}>
          <a href={paper.href} target="_blank" rel="noopener noreferrer">
            Open PDF ↗
          </a>
          <a href={paper.href} download>
            Download
          </a>
        </p>
        <iframe
          className={styles.pdfFrame}
          src={paper.href}
          title={paper.title}
        />
      </article>
    </WritingReaderTerminal>
  );
}
