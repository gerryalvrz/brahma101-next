/**
 * Writing post model (file-based).
 * Filename stem = canonical slug. Frontmatter does not redefine slug.
 */
export type WritingFrontmatter = {
  title: string;
  /** ISO calendar date: YYYY-MM-DD */
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
};

export type WritingPostMeta = WritingFrontmatter & {
  slug: string;
  /** Absolute path to the source .md file */
  filepath: string;
};

export type WritingPost = WritingPostMeta & {
  /** Markdown body without frontmatter */
  content: string;
};
