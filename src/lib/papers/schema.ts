import { z } from "zod";
import { SLUG_PATTERN, assertValidSlug } from "@/lib/writing/schema";

function isRealUtcYmd(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function coerceIsoDate(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return value;
}

export const paperFrontmatterSchema = z.object({
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

export type ParsedPaperFrontmatter = z.infer<typeof paperFrontmatterSchema>;

export { SLUG_PATTERN, assertValidSlug };

export function parsePaperFrontmatter(
  data: unknown,
  source: string,
): ParsedPaperFrontmatter {
  const result = paperFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid paper frontmatter in ${source}: ${details}`);
  }
  return result.data;
}
