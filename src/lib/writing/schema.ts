import { z } from "zod";

/** Kebab-case slug from filename stem (a-z, 0-9, hyphens). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRealUtcYmd(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** YAML may parse unquoted dates as Date; normalize to YYYY-MM-DD. */
function coerceIsoDate(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return value;
}

export const writingFrontmatterSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  date: z.preprocess(
    coerceIsoDate,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
      .refine(isRealUtcYmd, "date must be a real calendar day"),
  ),
  summary: z.string().trim().min(1, "summary is required"),
  tags: z.array(z.string().trim().min(1)),
  draft: z.boolean(),
});

export type ParsedWritingFrontmatter = z.infer<typeof writingFrontmatterSchema>;

export function assertValidSlug(slug: string, source: string): void {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `Invalid writing slug "${slug}" from ${source}. Use kebab-case: lowercase letters, numbers, hyphens (e.g. my-first-post.md).`,
    );
  }
}

export function parseFrontmatter(
  data: unknown,
  source: string,
): ParsedWritingFrontmatter {
  const result = writingFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid frontmatter in ${source}: ${details}`);
  }
  return result.data;
}
