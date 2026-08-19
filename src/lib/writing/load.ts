import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { assertValidSlug, parseFrontmatter } from "./schema";
import type { WritingPost, WritingPostMeta } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "writing");

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

function loadPostFromFile(filepath: string): WritingPost {
  const filename = path.basename(filepath);
  const slug = filename.replace(/\.md$/i, "");
  assertValidSlug(slug, filename);

  const raw = fs.readFileSync(filepath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parseFrontmatter(data, filename);

  return {
    ...frontmatter,
    slug,
    filepath,
    content: content.replace(/^\uFEFF/, "").trimStart(),
  };
}

/** All posts on disk (including drafts). Throws if any file is invalid. */
export function getAllWritingPosts(): WritingPost[] {
  const posts = listMarkdownFiles().map(loadPostFromFile);
  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * Posts visible on the site.
 * Drafts are hidden when NODE_ENV === "production".
 */
export function getVisibleWritingPosts(): WritingPost[] {
  const posts = getAllWritingPosts();
  if (isProduction()) {
    return posts.filter((post) => !post.draft);
  }
  return posts;
}

export function getVisibleWritingPostMetas(): WritingPostMeta[] {
  return getVisibleWritingPosts().map(
    ({ content: _content, ...meta }) => meta,
  );
}

export function getWritingPostBySlug(slug: string): WritingPost | undefined {
  return getVisibleWritingPosts().find((post) => post.slug === slug);
}

export function getVisibleWritingSlugs(): string[] {
  return getVisibleWritingPosts().map((post) => post.slug);
}
