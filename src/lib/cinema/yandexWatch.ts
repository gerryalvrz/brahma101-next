/**
 * Build a Yandex web search for free/online watch results.
 * Query shape: "{title} {year} {director} watch online"
 */
export function yandexWatchSearchUrl(input: {
  title: string;
  year?: number | null;
  director?: string | null;
}): string {
  const parts = [
    input.title.trim(),
    input.year != null ? String(input.year) : null,
    input.director?.trim() || null,
    "watch online",
  ].filter((p): p is string => Boolean(p && p.length > 0));

  const text = parts.join(" ");
  return `https://yandex.com/search/?text=${encodeURIComponent(text)}`;
}
