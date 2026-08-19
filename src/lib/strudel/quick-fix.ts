export type QuickFixResult = {
  tips: string[];
  fixedCode?: string;
};

export type QuickFixContext = {
  code: string;
  error?: string | null;
};

/**
 * Deterministic Strudel tips / small rewrites. No network.
 */
export function localQuickFix(ctx: QuickFixContext): QuickFixResult {
  const code = ctx.code ?? "";
  const tips: string[] = [];
  let fixedCode: string | undefined;
  const trimmed = code.trim();
  const error = (ctx.error ?? "").toLowerCase();

  if (!trimmed) {
    tips.push(
      'Editor is empty. Try note("c a f e") or sound("bd sd hh cp"), then Play.'
    );
    fixedCode = `note("c a f e")`;
    return { tips, fixedCode };
  }

  if (/\bsound\s*\(\s*[a-z]/i.test(trimmed) && !/\bsound\s*\(\s*["'`]/.test(trimmed)) {
    tips.push(
      'sound() needs a quoted mini-notation string, e.g. sound("bd sd hh").'
    );
  }

  if (/\bnote\s*\(\s*[a-z]/i.test(trimmed) && !/\bnote\s*\(\s*["'`]/.test(trimmed)) {
    tips.push('note() needs quotes, e.g. note("c a f e").');
  }

  if (/unexpected|Expected|SyntaxError|parse/i.test(error)) {
    tips.push(
      "Parse/syntax issue — check quotes, brackets [], and parentheses () in mini-notation."
    );
  }

  if (/sample|not found|failed to fetch|404/i.test(error)) {
    tips.push(
      'Sample missing or not loaded yet. Wait for Dirt samples, or use a synth: note("c e g").s("sawtooth").'
    );
  }

  if (/is not defined|undefined/i.test(error)) {
    const match = ctx.error?.match(/(\w+) is not defined/i);
    if (match) {
      tips.push(
        `"${match[1]}" is undefined here. Stick to Strudel APIs (sound, note, n, stack, …) — this is not Hydra.`
      );
    }
  }

  if (/\.out\s*\(/.test(code) || /\brender\s*\(/.test(code) || /\bosc\s*\(/.test(code)) {
    tips.push(
      "Looks like Hydra video code. On /create-music use Strudel, e.g. sound(\"bd sd\") or note(\"c a f e\")."
    );
    if (!fixedCode) fixedCode = `note("c a f e")`;
  }

  if (
    /^\s*sound\s*\(\s*["'][^"']*["']\s*\)\s*$/i.test(trimmed) === false &&
    /^\s*[a-z]+\s*$/i.test(trimmed)
  ) {
    tips.push(`Bare token "${trimmed}" is not a pattern. Wrap drums: sound("${trimmed}").`);
    fixedCode = `sound("${trimmed}")`;
  }

  if (/AudioContext|user gesture|not allowed to start/i.test(error)) {
    tips.push("Browser blocked audio — click Play once to unlock the AudioContext.");
  }

  return { tips, fixedCode };
}
