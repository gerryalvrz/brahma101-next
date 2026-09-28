/**
 * Brahma Score — dual-spectrum quality rank for world cinema.
 *
 * ---------------------------------------------------------------------------
 * Two lanes, one score
 * ---------------------------------------------------------------------------
 *
 * Trust lane (m_trust = 250):
 *   Classic Bayesian shrink — needs many votes before we fully believe R.
 *   Protects Top lists from 10.0-with-3-votes spam.
 *
 * Gem lane (m_gem = 45):
 *   Same math, faster credit. Strong films with modest vote counts
 *   (≈20–400) can surface without waiting for Hollywood-scale volume.
 *
 * Blend:
 *   mix = MIX_MAX × outlier × gemAffinity(v)
 *   score = (1 - mix) × trust + mix × gem
 *   brahmaScore = round(score × 10, 1)   // 0–100 display
 *
 * where:
 *   R = TMDB vote_average (0–10)
 *   v = TMDB vote_count
 *   C = PRIOR_MEAN (6.5) — country-agnostic
 *   outlier = max(0, R − C) / (10 − C)  — only above-average ratings open the gem lane
 *   gemAffinity = log-normal bump peaking near ~100 votes; near-zero for
 *                 ultra-low noise (<12) and for mega-voted titles (trust owns them)
 *
 * ---------------------------------------------------------------------------
 * Design goals
 * ---------------------------------------------------------------------------
 *
 * - Both spectra: confident classics AND under-seen jewels.
 * - Ultra-low votes still shrink hard (noise floor).
 * - No popularity term, no country term.
 */

/** Votes at which trust-lane rating and prior are weighted 50/50. */
export const BRAHMA_TRUST_STRENGTH = 250;

/** Faster credit for the gem / discovery lane. */
export const BRAHMA_GEM_STRENGTH = 45;

/** Global mean pulled toward when vote counts are thin. Not country-specific. */
export const BRAHMA_PRIOR_MEAN = 6.5;

/** Below this, treat as near-noise (tiny gemAffinity only). */
export const BRAHMA_NOISE_FLOOR = 12;

/** Vote count where gemAffinity peaks (discovery sweet spot). */
export const BRAHMA_GEM_PEAK_VOTES = 100;

/** Max weight of the gem lane in the final blend (0–1). */
export const BRAHMA_GEM_MIX_MAX = 0.42;

/** @deprecated Use BRAHMA_TRUST_STRENGTH — kept for older docs/imports. */
export const BRAHMA_PRIOR_STRENGTH = BRAHMA_TRUST_STRENGTH;

export type BrahmaScoreInput = {
  voteAverage: number;
  voteCount: number;
};

function bayesian(R: number, v: number, m: number, C: number): number {
  return (v / (v + m)) * R + (m / (v + m)) * C;
}

/**
 * Log-bump affinity for the discovery band.
 * Peaks near BRAHMA_GEM_PEAK_VOTES; fades for spam-tier and mega-voted titles.
 */
export function gemAffinity(voteCount: number): number {
  const v = Math.max(0, voteCount);
  if (v < BRAHMA_NOISE_FLOOR) {
    return (v / BRAHMA_NOISE_FLOOR) * 0.15;
  }
  const x = Math.log(v + 1);
  const peak = Math.log(BRAHMA_GEM_PEAK_VOTES + 1);
  const sigma = 0.9;
  return Math.exp(-0.5 * ((x - peak) / sigma) ** 2);
}

/**
 * Returns Brahma Score on a 0–100 scale (one decimal).
 * Dual-spectrum: trust lane + gem lane blend.
 */
export function computeBrahmaScore({
  voteAverage,
  voteCount,
}: BrahmaScoreInput): number {
  const R = clamp(voteAverage, 0, 10);
  const v = Math.max(0, voteCount);
  const C = BRAHMA_PRIOR_MEAN;

  const trust = bayesian(R, v, BRAHMA_TRUST_STRENGTH, C);
  const gem = bayesian(R, v, BRAHMA_GEM_STRENGTH, C);

  const outlier = Math.max(0, R - C) / (10 - C);
  const mix = BRAHMA_GEM_MIX_MAX * outlier * gemAffinity(v);

  const blended = (1 - mix) * trust + mix * gem;
  return Math.round(blended * 10 * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
