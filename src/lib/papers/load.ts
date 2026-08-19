import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { assertValidSlug, parsePaperFrontmatter } from "./schema";
import type { Paper, PaperMeta } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "papers");
const PUBLIC_PDF_DIR = path.join(process.cwd(), "public", "papers");

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function listMarkdownFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
    .map((name) => path.join(CONTENT_DIR, name));
}

function loadPaperFromFile(filepath: string): Paper {
  const filename = path.basename(filepath);
  const slug = filename.replace(/\.md$/i, "");
  assertValidSlug(slug, filename);

  const pdfName = `${slug}.pdf`;
  const pdfPath = path.join(PUBLIC_PDF_DIR, pdfName);
  if (!fs.existsSync(pdfPath)) {
    throw new Error(
      `Paper catalog ${filename} has no matching PDF at public/papers/${pdfName}.`,
    );
  }

  const raw = fs.readFileSync(filepath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parsePaperFrontmatter(data, filename);

  return {
    ...frontmatter,
    slug,
    href: `/papers/${pdfName}`,
    filepath,
    content: content.replace(/^\uFEFF/, "").trimStart(),
  };
}

export function getAllPapers(): Paper[] {
  const papers = listMarkdownFiles().map(loadPaperFromFile);
  return papers.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getVisiblePapers(): Paper[] {
  const papers = getAllPapers();
  if (isProduction()) {
    return papers.filter((paper) => !paper.draft);
  }
  return papers;
}

export function getVisiblePaperMetas(): PaperMeta[] {
  return getVisiblePapers().map(({ content: _content, ...meta }) => meta);
}

export function getPaperBySlug(slug: string): Paper | undefined {
  return getVisiblePapers().find((paper) => paper.slug === slug);
}

export function getVisiblePaperSlugs(): string[] {
  return getVisiblePapers().map((paper) => paper.slug);
}
