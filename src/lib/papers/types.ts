/**
 * Research paper catalog (file-based).
 * Filename stem = canonical slug. PDF lives at public/papers/{slug}.pdf.
 */
export type PaperFrontmatter = {
  title: string;
  /** ISO calendar date: YYYY-MM-DD */
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
};

export type PaperMeta = PaperFrontmatter & {
  slug: string;
  /** Public URL of the PDF */
  href: string;
  /** Absolute path to the catalog .md file */
  filepath: string;
};

export type Paper = PaperMeta & {
  /** Optional markdown abstract without frontmatter */
  content: string;
};
