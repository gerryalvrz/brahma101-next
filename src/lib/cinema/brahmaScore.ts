/**
 * Brahma Score — quality-first ranking for world cinema.
 *
 * ---------------------------------------------------------------------------
 * Formula
 * ---------------------------------------------------------------------------
 *
 *   bayesian = (v / (v + m)) * R + (m / (v + m)) * C
 *   brahmaScore = round(bayesian * 10, 1)   // displayed on a 0–100 scale
 *
 * where:
 *   R = TMDB `vote_average` (0–10)
 *   v = TMDB `vote_count`
 *   m = PRIOR_STRENGTH (250)  — votes needed before we fully trust R
 *   C = PRIOR_MEAN (6.5)     — country-agnostic global prior ≈ TMDB center
 *
 * ---------------------------------------------------------------------------
 * Design goals
 * ---------------------------------------------------------------------------
 *
 * - Reward strong ratings when they are backed by enough votes.
 * - Logarithmic / Bayesian vote weighting: low-v titles shrink toward C so a
 *   10.0 with three votes cannot dominate an 8.2 with thousands.
 * - No popularity term — reduces Hollywood marketing / discovery bias.
 * - No country term — surfaces strong films globally on equal footing.
 */

/** Votes at which the observed rating and the prior are weighted 50/50. */
export const BRAHMA_PRIOR_STRENGTH = 250;

/** Global mean pulled toward when vote counts are thin. Not country-specific. */
export const BRAHMA_PRIOR_MEAN = 6.5;

export type BrahmaScoreInput = {
  voteAverage: number;
  voteCount: number;
};

/**
 * Returns Brahma Score on a 0–100 scale (one decimal).
 */
export function computeBrahmaScore({
  voteAverage,
  voteCount,
}: BrahmaScoreInput): number {
  const R = clamp(voteAverage, 0, 10);
  const v = Math.max(0, voteCount);
  const m = BRAHMA_PRIOR_STRENGTH;
  const C = BRAHMA_PRIOR_MEAN;

  const bayesian = (v / (v + m)) * R + (m / (v + m)) * C;
  return Math.round(bayesian * 10 * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
