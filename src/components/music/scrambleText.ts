/** Lightweight scramble (no GSAP Club ScrambleTextPlugin). */

const CHARS = "01░▒▓█<>/\\|#$";

export function scrambleTo(
  el: HTMLElement,
  finalText: string,
  durationMs = 700
): () => void {
  let cancelled = false;
  const start = performance.now();
  const len = Math.max(finalText.length, 1);

  const tick = (now: number) => {
    if (cancelled) return;
    const t = Math.min(1, (now - start) / durationMs);
    const reveal = Math.floor(t * len);
    let out = "";
    for (let i = 0; i < len; i++) {
      if (i < reveal) out += finalText[i] ?? "";
      else out += CHARS[(Math.random() * CHARS.length) | 0];
    }
    el.textContent = out;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = finalText;
  };

  requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    el.textContent = finalText;
  };
}
