import type { DetectedParam, ParamFnDef } from "./param-types";

const NUMBER_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;

type ArgSpan = {
  start: number;
  end: number;
  raw: string;
  numeric: boolean;
  value: number | null;
};

/** Strip line and block comments so we don't match fn names inside them. */
function stripComments(code: string): string {
  let out = "";
  let i = 0;
  while (i < code.length) {
    if (code[i] === "/" && code[i + 1] === "/") {
      while (i < code.length && code[i] !== "\n") {
        out += " ";
        i += 1;
      }
      continue;
    }
    if (code[i] === "/" && code[i + 1] === "*") {
      out += "  ";
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
        out += code[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      if (i < code.length) {
        out += "  ";
        i += 2;
      }
      continue;
    }
    out += code[i];
    i += 1;
  }
  return out;
}

function isIdentChar(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z0-9_$]/.test(ch);
}

/** Find `name(` or `.name(` call sites; returns index of `(`. */
function findCallSites(
  masked: string,
  def: ParamFnDef,
): { openParen: number; nameStart: number }[] {
  const sites: { openParen: number; nameStart: number }[] = [];
  const name = def.name;
  let from = 0;

  while (from < masked.length) {
    const idx = masked.indexOf(name, from);
    if (idx === -1) break;

    const before = masked[idx - 1];
    const afterName = masked[idx + name.length];
    if (isIdentChar(before) || isIdentChar(afterName)) {
      from = idx + name.length;
      continue;
    }

    let j = idx + name.length;
    while (j < masked.length && /\s/.test(masked[j]!)) j += 1;
    if (masked[j] !== "(") {
      from = idx + name.length;
      continue;
    }

    if (def.kind === "method") {
      // Require a dot immediately before the name (ignoring whitespace is rare; keep strict).
      if (before !== ".") {
        from = idx + name.length;
        continue;
      }
    } else {
      // Bare call: no leading dot (avoid matching `.osc` if that existed).
      if (before === ".") {
        from = idx + name.length;
        continue;
      }
    }

    sites.push({ openParen: j, nameStart: idx });
    from = j + 1;
  }

  return sites;
}

function parseArgList(code: string, openParen: number): ArgSpan[] | null {
  const args: ArgSpan[] = [];
  let i = openParen + 1;
  let depth = 0;
  let inStr: '"' | "'" | "`" | null = null;
  let argStart = i;

  const flush = (end: number) => {
    const raw = code.slice(argStart, end);
    const trimmed = raw.trim();
    if (!trimmed && args.length === 0 && end <= i) {
      // empty call — ok
      return;
    }
    if (!trimmed) return;

    const lead = raw.match(/^\s*/)?.[0].length ?? 0;
    const trail = raw.match(/\s*$/)?.[0].length ?? 0;
    const tokenStart = argStart + lead;
    const tokenEnd = end - trail;
    const token = code.slice(tokenStart, tokenEnd);
    const m = token.match(NUMBER_RE);
    const isPlainNumber = !!m && m[0] === token;
    args.push({
      start: tokenStart,
      end: tokenEnd,
      raw: token,
      numeric: isPlainNumber,
      value: isPlainNumber ? Number(token) : null,
    });
  };

  while (i < code.length) {
    const ch = code[i]!;

    if (inStr) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === inStr) inStr = null;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      i += 1;
      continue;
    }

    if (ch === "(" || ch === "[" || ch === "{") {
      depth += 1;
      i += 1;
      continue;
    }

    if (ch === ")" || ch === "]" || ch === "}") {
      if (depth === 0 && ch === ")") {
        flush(i);
        return args;
      }
      depth -= 1;
      i += 1;
      continue;
    }

    if (ch === "," && depth === 0) {
      flush(i);
      i += 1;
      argStart = i;
      continue;
    }

    i += 1;
  }

  return null; // unbalanced
}

function expandRange(
  value: number,
  min: number,
  max: number,
): { min: number; max: number } {
  let lo = min;
  let hi = max;
  if (value < lo) lo = value;
  if (value > hi) hi = value;
  // Give a little headroom when value sits on the edge.
  const span = hi - lo || 1;
  if (value <= lo + span * 0.02) lo = value - span * 0.1;
  if (value >= hi - span * 0.02) hi = value + span * 0.1;
  return { min: lo, max: hi };
}

/**
 * Scan source for catalogued call sites with literal numeric args.
 * Non-literal args (expressions, strings, textures) are skipped.
 */
export function detectParams(
  code: string,
  catalog: ParamFnDef[],
): DetectedParam[] {
  const masked = stripComments(code);
  const found: DetectedParam[] = [];
  const callCounts = new Map<string, number>();

  // Collect all sites with position, then sort so callIndex is source order.
  type Site = {
    def: ParamFnDef;
    openParen: number;
    nameStart: number;
  };
  const sites: Site[] = [];

  for (const def of catalog) {
    for (const site of findCallSites(masked, def)) {
      sites.push({ def, ...site });
    }
  }

  sites.sort((a, b) => a.nameStart - b.nameStart);

  for (const site of sites) {
    const args = parseArgList(code, site.openParen);
    if (!args) continue;

    const prev = callCounts.get(site.def.name) ?? 0;
    const callIndex = prev + 1;
    callCounts.set(site.def.name, callIndex);

    for (let ai = 0; ai < site.def.args.length && ai < args.length; ai += 1) {
      const argDef = site.def.args[ai]!;
      if (argDef.skip) continue;
      const span = args[ai]!;
      if (!span.numeric || span.value === null || !Number.isFinite(span.value)) {
        continue;
      }

      const range = expandRange(span.value, argDef.min, argDef.max);
      const id = `${site.def.name}@${callIndex}:${ai}`;
      found.push({
        id,
        fnName: site.def.name,
        category: site.def.category,
        argName: argDef.name,
        callIndex,
        argIndex: ai,
        value: span.value,
        min: range.min,
        max: range.max,
        step: argDef.step,
        start: span.start,
        end: span.end,
        label: `${site.def.name}#${callIndex} · ${argDef.name}`,
      });
    }
  }

  // Refine labels: drop #n when that fn appears only once.
  const totals = new Map<string, number>();
  for (const p of found) {
    totals.set(p.fnName, Math.max(totals.get(p.fnName) ?? 0, p.callIndex));
  }
  for (const p of found) {
    if ((totals.get(p.fnName) ?? 0) <= 1) {
      p.label = `${p.fnName} · ${p.argName}`;
    }
  }

  return found.sort((a, b) => a.start - b.start);
}

export function formatParamValue(value: number, step: number): string {
  if (!Number.isFinite(value)) return "0";
  if (step >= 1 && Number.isInteger(step)) {
    return String(Math.round(value));
  }
  const decimals = Math.min(
    6,
    Math.max(0, (String(step).split(".")[1] ?? "").length),
  );
  const fixed = value.toFixed(decimals);
  // Trim trailing zeros but keep at least one decimal if original had step < 1
  if (decimals === 0) return fixed;
  return fixed.replace(/\.?0+$/, "") || "0";
}

/** Rewrite one detected param's literal in the source string. */
export function applyParamValue(
  code: string,
  param: DetectedParam,
  nextValue: number,
): string {
  const formatted = formatParamValue(nextValue, param.step);
  return code.slice(0, param.start) + formatted + code.slice(param.end);
}

export function groupParamsByCategory(
  params: DetectedParam[],
): { category: string; params: DetectedParam[] }[] {
  const order: string[] = [];
  const map = new Map<string, DetectedParam[]>();
  for (const p of params) {
    if (!map.has(p.category)) {
      map.set(p.category, []);
      order.push(p.category);
    }
    map.get(p.category)!.push(p);
  }
  return order.map((category) => ({
    category,
    params: map.get(category)!,
  }));
}
