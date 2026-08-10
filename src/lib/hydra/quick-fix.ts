export type QuickFixResult = {
  tips: string[];
  fixedCode?: string;
};

export type QuickFixContext = {
  code: string;
  error?: string | null;
  audioOn?: boolean;
};

/**
 * Deterministic Hydra syntax tips / small rewrites. No network.
 */
export function localQuickFix(ctx: QuickFixContext): QuickFixResult {
  const code = ctx.code ?? "";
  const tips: string[] = [];
  let fixedCode: string | undefined;
  const trimmed = code.trim();
  const error = (ctx.error ?? "").toLowerCase();

  if (!trimmed) {
    tips.push("Editor is empty. Try osc(20, 0.1, 0.8).out() or pick a tree sketch.");
    fixedCode = "osc(20, 0.1, 0.8).out()";
    return { tips, fixedCode };
  }

  const hasOut = /\.out\s*\(/.test(code);
  const hasRender = /\brender\s*\(/.test(code);
  if (!hasOut && !hasRender) {
    tips.push("No .out() or render() — the screen won't update. Append .out() to the chain.");
    if (/^(osc|noise|shape|gradient|solid|voronoi|src)\s*\(/.test(trimmed) && !trimmed.includes("\n")) {
      fixedCode = trimmed.replace(/;?\s*$/, "") + ".out()";
    }
  }

  if (/\.initCam\s*\(/.test(code) && !/\bsrc\s*\(\s*s0\s*\)/.test(code)) {
    tips.push("initCam() alone does not draw. Use src(s0).out() after s0.initCam().");
    if (!fixedCode) {
      fixedCode = `${code.trim()}\nsrc(s0).out()`;
    }
  }

  if (/\ba\.fft\b/.test(code) && ctx.audioOn === false) {
    tips.push('Code uses a.fft but mic is off. Click "audio" in the toolbar, allow the mic, then run.');
  }

  if (/\bawait\b/.test(code) && /await is only valid/i.test(error)) {
    tips.push("await needs an async runner — re-run after a refresh; /art wraps sketches in an async IIFE.");
  }

  if (/\bstereogram\s*\(/.test(code)) {
    tips.push(
      "stereogram() is not built into hydra-synth. It needs a custom extension (await loadScript / setFunction). Built-ins: osc, noise, shape, solid, voronoi, src, gradient."
    );
  }

  if (/\bbrick\s*\(/.test(code) && !/loadScript\s*\(/.test(code)) {
    tips.push(
      "brick() comes from an external script. Add await loadScript(\"…lib-pattern.js\") at the top first."
    );
  }

  if (error.includes("is not defined")) {
    const match = ctx.error?.match(/(\w+) is not defined/i);
    if (match) {
      tips.push(
        `"${match[1]}" is undefined. Load it with await loadScript(...), enable audio for "a", or check the spelling.`
      );
    }
  }

  if (error.includes("unexpected token")) {
    tips.push("Syntax error — check parentheses, commas, and that transforms are chained with dots.");
  }

  if (/^\s*osc\s*\(\s*\)\s*$/.test(trimmed)) {
    tips.push("Bare osc() works; try osc(20, 0.1, 0.8).out() for clearer motion.");
    fixedCode = "osc(20, 0.1, 0.8).out()";
  }

  return { tips, fixedCode };
}
