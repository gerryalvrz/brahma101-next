export const cinemaContent = {
  title: "World Cinema Explorer",
  lede: "Filter global film by genre and subgenre — ranked by Brahma Score, not Hollywood popularity.",
  backLabel: "← Home",
  filtersHeading: "Search & filters",
  empty:
    "No films matched these filters. Loosen rating / votes, or clear country.",
  missingKey:
    "TMDB_API_KEY is not set. Add it to .env.local and restart the dev server.",
  brahmaTitle: "What is Brahma Score?",
  brahmaLead:
    "A 0–100 dual-spectrum rank: it keeps noisy 3-vote 10.0s down, but lets strong under-seen films rise — without Hollywood popularity or country boosts.",
  brahmaPoints: [
    "Trust lane — Bayesian shrink with a high vote bar (≈250). Classics with deep consensus stay on top.",
    "Gem lane — same math, faster credit (≈45). High ratings with roughly 20–400 votes get a discovery lift.",
    "Blend opens only when the rating is above average; ultra-low votes still shrink hard.",
    "No popularity term · no country term — marketing heat cannot buy rank.",
  ],
  brahmaExample:
    "Examples: 8.2 / 5,000 ≈ trust classic · 8.7 / 80 ≈ gem lift · 10.0 / 3 ≈ still suppressed.",
} as const;
