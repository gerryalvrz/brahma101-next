"use client";

/**
 * One requestAnimationFrame loop shared by every background effect.
 *
 * Independent loops (or worse, setInterval) drift out of phase with vsync and
 * each other, which is what reads as jank when several full-screen canvases run
 * at once. A single loop also gives us one place to pause on tab-hide.
 */

type TickFn = (now: number, deltaMs: number) => void;

type Subscriber = {
  fn: TickFn;
  intervalMs: number;
  last: number;
};

const subscribers = new Set<Subscriber>();
let rafId = 0;
let listening = false;

/** Cap the delta so a backgrounded tab doesn't resume with a huge jump. */
const MAX_DELTA_MS = 100;

function frame(now: number) {
  rafId = requestAnimationFrame(frame);

  for (const sub of subscribers) {
    const elapsed = sub.last === 0 ? sub.intervalMs : now - sub.last;
    if (elapsed < sub.intervalMs) continue;
    sub.last = now;
    sub.fn(now, Math.min(elapsed, MAX_DELTA_MS));
  }
}

function start() {
  if (rafId || subscribers.size === 0) return;
  if (document.visibilityState !== "visible") return;
  for (const sub of subscribers) sub.last = 0;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  if (!rafId) return;
  cancelAnimationFrame(rafId);
  rafId = 0;
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") start();
  else stop();
}

/**
 * Run `fn` on the shared loop, at most once every `fps` frames.
 * Returns an unsubscribe function.
 */
export function subscribeToFrames(fn: TickFn, fps = 60): () => void {
  const sub: Subscriber = { fn, intervalMs: 1000 / fps, last: 0 };
  subscribers.add(sub);

  if (!listening) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    listening = true;
  }
  start();

  return () => {
    subscribers.delete(sub);
    if (subscribers.size === 0) {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      listening = false;
    }
  };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarseOrSmallScreen(): boolean {
  return (
    window.matchMedia("(max-width: 700px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}
