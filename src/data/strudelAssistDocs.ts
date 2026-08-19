/**
 * Compact Strudel reference for the /create-music assist tutor.
 * Keep this short — it is injected into the Venice system prompt.
 */

export const strudelAssistDocs = `
# Strudel mini-notation — quick reference (@strudel/web)

Strudel is a browser livecoding language for music (TidalCycles-inspired).
Patterns evaluate with evaluate(code). hush() stops sound.
This playground loads Dirt samples via samples("github:tidalcycles/dirt-samples").

## Core sounds
- sound("bd sd hh cp") — Dirt drum samples (bd, sd, hh, cp, rim, …)
- note("c a f e") — melodic notes (synth by default)
- n("0 2 4 7").scale("C:minor") — scale degrees
- s("sawtooth") / .s("triangle") / .s("square") / .s("sine") — oscillators
- Rest: ~ or -

## Mini-notation
- Sequence: "bd sd hh cp" (one cycle)
- Sub-sequences: "bd [hh hh] sd"
- Speed: "hh*8", "[bd sd]*2"
- Parallel (layers in one cycle): "bd*2, hh*8, ~ cp"
- Alternation: "<bd sd>" or note("<c a f e>")
- Euclidean: "bd(3,8)" or note("<c a f e>(3,8)")

## Common transforms (chain with dots)
.fast(n) .slow(n) .rev() .jux(rev)
.gain(n) .velocity(n)
.lpf(hz) .hpf(hz) .bpf(hz) .room(n) .delay(n)
.pan(n) .chop(n) .crush(n) .coarse(n)
.every(n, fn) .sometimes(fn) .often(fn)

## Stacking
stack(
  sound("bd*2"),
  sound("hh*8").gain(0.4),
  note("c3 eb3 g3").s("sawtooth").lpf(800)
)

## Timing
- setcps(0.5) — cycles per second (tempo)
- Patterns re-evaluate live; previous pattern is replaced

## Samples
Dirt bank names: bd, sd, hh, cp, rim, oh, cr, … (after samples() prebake)
Custom: samples({ bd: 'url…' }) then sound("bd")

## Synths without samples
note("c e g").s("sawtooth").lpf(1200)
n("0 2 4 7 4 2").scale("C:minor").s("triangle")

## Common mistakes
1. Empty editor → nothing to play; try note("c a f e") or sound("bd sd hh")
2. Using Dirt drums before samples load → wait for toast, or use synth note()/s()
3. Missing quotes in mini-notation: sound(bd sd) is wrong; use sound("bd sd")
4. Unbalanced brackets / parentheses in mini-notation
5. Confusing Hydra/JS video APIs with Strudel — this page is music only
6. Forgetting to press Play (Ctrl/⌘+Enter); edits do not auto-play

## Teaching style for the tutor
- Be concise and practical.
- When fixing code, explain the mistake in 1–3 short sentences.
- Always include a corrected complete pattern in a \`\`\`js fenced block when suggesting a fix.
- Prefer patterns that run in this @strudel/web playground (Dirt samples + synths).
`.trim();
