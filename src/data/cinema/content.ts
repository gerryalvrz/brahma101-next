export const cinemaContent = {
  title: "World Cinema Explorer",
  lede: "Browse global film by genre and subgenre — ranked by Brahma Score, not Hollywood popularity.",
  backLabel: "← Home",
  presetsHeading: "Featured charts",
  browseHeading: "Browse Best of",
  filtersHeading: "Filters",
  resultsHeading: "Films",
  empty:
    "No films matched these filters. Loosen rating / votes, or clear country.",
  missingKey:
    "TMDB_API_KEY is not set. Add it to .env.local and restart the dev server.",
  scoreHint:
    "Brahma Score rewards strong ratings with vote-count confidence — no country boost, no popularity gaming.",
} as const;
