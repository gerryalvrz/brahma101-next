import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * Render trusted author Markdown (GFM) to HTML.
 * Content is git-sourced and author-controlled — not user-submitted HTML.
 */
export function renderMarkdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
