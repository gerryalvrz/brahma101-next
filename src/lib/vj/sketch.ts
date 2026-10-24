/**
 * Hydra-synth's evaluator (`lib/sandbox.js`, used by `hydra.eval`) is
 * `globalThis.eval`. With `makeGlobal: false` it still runs as page JavaScript,
 * and it does not inject `src` / `s0` into that scope.
 *
 * This module parses a Hydra-chain subset and calls only whitelisted functions
 * on the local synth. It does not use `eval` or `Function`. Sketches cannot
 * touch the DOM, replace s0, or call hush().
 *
 * `speed = 0.5` writes `synth.speed` (the value hydra's tick multiplies).
 * It does not assign `window.speed`. Numeric bindings and `pat = () => chain`
 * helpers stay inside the sketch. The whole program is validated before any
 * synth call, so a later error does not leave a partial chain or speed change.
 */

export class VjSketchError extends Error {
  readonly line: number;
  readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(`Line ${line}, column ${column}: ${message}`);
    this.name = "VjSketchError";
    this.line = line;
    this.column = column;
  }
}

export type VjSketchEnv = {
  intensity: () => number;
  time: () => number;
};

/** Local Hydra synth. Globals stay off. `speed` is hydra's clock multiplier. */
export type VjSketchSynth = {
  time: number;
  speed?: number;
  render: (output?: unknown) => void;
  s0: {
    init: (opts: { src: HTMLVideoElement; dynamic: boolean }) => void;
  };
} & Record<string, unknown>;

const SOURCES = new Set([
  "noise",
  "voronoi",
  "osc",
  "shape",
  "gradient",
  "src",
  "solid",
  "prev",
]);

const METHODS = new Set([
  "out",
  "rotate",
  "scale",
  "pixelate",
  "posterize",
  "shift",
  "repeat",
  "modulateRepeat",
  "repeatX",
  "modulateRepeatX",
  "repeatY",
  "modulateRepeatY",
  "kaleid",
  "modulateKaleid",
  "scroll",
  "scrollX",
  "modulateScrollX",
  "scrollY",
  "modulateScrollY",
  "add",
  "sub",
  "layer",
  "blend",
  "mult",
  "diff",
  "modulate",
  "modulateScale",
  "modulatePixelate",
  "modulateRotate",
  "modulateHue",
  "invert",
  "contrast",
  "brightness",
  "mask",
  "luma",
  "thresh",
  "color",
  "saturate",
  "hue",
  "colorama",
  "sum",
  "r",
  "g",
  "b",
  "a",
]);

const BUFFERS = new Set(["s0", "s1", "s2", "s3", "o0", "o1", "o2", "o3"]);

const BLOCKED = new Set([
  "eval",
  "Function",
  "window",
  "document",
  "globalThis",
  "global",
  "constructor",
  "prototype",
  "__proto__",
  "fetch",
  "XMLHttpRequest",
  "import",
  "require",
  "alert",
  "setTimeout",
  "setInterval",
  "process",
  "this",
  "hush",
  "init",
  "initCam",
  "initVideo",
  "initImage",
  "initScreen",
  "initStream",
  "initCanvas",
  "clear",
  "loadScript",
  "setResolution",
]);

const MATH_FNS: Record<string, (...args: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
  floor: Math.floor,
  ceil: Math.ceil,
  sqrt: Math.sqrt,
  sign: Math.sign,
  exp: Math.exp,
  log: Math.log,
  random: Math.random,
};

const ARRAY_MODS = new Set(["fast", "smooth", "offset", "fit"]);

type ArrayModName = "fast" | "smooth" | "offset" | "fit";

type ArrayMod = {
  name: ArrayModName;
  args: NumExpr[];
  line: number;
  column: number;
};

type NumExpr =
  | { type: "number"; value: number; line: number; column: number }
  | { type: "name"; name: string; line: number; column: number }
  | { type: "unary"; expr: NumExpr; line: number; column: number }
  | {
      type: "binary";
      op: "+" | "-" | "*" | "/";
      left: NumExpr;
      right: NumExpr;
      line: number;
      column: number;
    }
  | { type: "math"; name: string; args: NumExpr[]; line: number; column: number }
  | { type: "arrow"; body: NumExpr; line: number; column: number }
  | { type: "array"; items: NumExpr[]; mods: ArrayMod[]; line: number; column: number };

type ChainExpr =
  | { type: "call"; name: string; args: Expr[]; line: number; column: number }
  | {
      type: "method";
      object: ChainExpr;
      name: string;
      args: Expr[];
      line: number;
      column: number;
    }
  | { type: "buffer"; name: string; line: number; column: number };

type Expr = NumExpr | ChainExpr;

type Statement =
  | { type: "chain"; expr: ChainExpr }
  | { type: "num"; name: string; expr: NumExpr; line: number; column: number }
  | { type: "helper"; name: string; body: ChainExpr; line: number; column: number };

type Binding =
  | { kind: "num"; expr: NumExpr }
  | { kind: "helper"; body: ChainExpr };

type Scope = Map<string, Binding>;

/** Hydra array sequencer fields. `fit()` copies speed and smooth, not offset. */
type SequencedArray = number[] & {
  _speed?: number;
  _smooth?: number;
  _offset?: number;
};

type Tok =
  | { k: "num"; v: number; line: number; column: number }
  | { k: "id"; v: string; line: number; column: number }
  | { k: "op"; v: string; line: number; column: number }
  | { k: "arrow"; line: number; column: number }
  | { k: "eof"; line: number; column: number };

function isIdentStart(ch: string) {
  return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch === "_";
}

function isIdent(ch: string) {
  return isIdentStart(ch) || (ch >= "0" && ch <= "9");
}

function isDigit(ch: string | undefined) {
  return !!ch && ch >= "0" && ch <= "9";
}

function isReservedBinding(name: string) {
  return (
    SOURCES.has(name) ||
    METHODS.has(name) ||
    BUFFERS.has(name) ||
    name === "Math" ||
    name === "intensity" ||
    name === "time" ||
    name === "render"
  );
}

function isNumExpr(expr: Expr): expr is NumExpr {
  return (
    expr.type === "number" ||
    expr.type === "name" ||
    expr.type === "unary" ||
    expr.type === "binary" ||
    expr.type === "math" ||
    expr.type === "arrow" ||
    expr.type === "array"
  );
}

function isArrayMod(name: string): name is ArrayModName {
  return ARRAY_MODS.has(name);
}

function lex(source: string): Tok[] {
  const tokens: Tok[] = [];
  let i = 0;
  let line = 1;
  let column = 1;

  const bump = () => {
    const ch = source[i] ?? "";
    i += 1;
    if (ch === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
    return ch;
  };

  while (i < source.length) {
    const ch = source[i] ?? "";
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      bump();
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") bump();
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const startLine = line;
      const startColumn = column;
      bump();
      bump();
      let closed = false;
      while (i < source.length) {
        if (source[i] === "*" && source[i + 1] === "/") {
          bump();
          bump();
          closed = true;
          break;
        }
        bump();
      }
      if (!closed) {
        throw new VjSketchError("Unclosed block comment.", startLine, startColumn);
      }
      continue;
    }

    const startLine = line;
    const startColumn = column;

    if (isDigit(ch) || (ch === "." && isDigit(source[i + 1]))) {
      let raw = "";
      if (source[i] === ".") raw += bump();
      while (isDigit(source[i])) raw += bump();
      if (source[i] === "." && !raw.includes(".")) {
        raw += bump();
        while (isDigit(source[i])) raw += bump();
      }
      if (source[i] === "e" || source[i] === "E") {
        raw += bump();
        if (source[i] === "+" || source[i] === "-") raw += bump();
        if (!isDigit(source[i])) {
          throw new VjSketchError("Invalid number.", startLine, startColumn);
        }
        while (isDigit(source[i])) raw += bump();
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw new VjSketchError("Invalid number.", startLine, startColumn);
      }
      tokens.push({ k: "num", v: value, line: startLine, column: startColumn });
      continue;
    }

    if (isIdentStart(ch)) {
      let name = "";
      while (i < source.length && isIdent(source[i] ?? "")) name += bump();
      if (BLOCKED.has(name)) {
        throw new VjSketchError(
          `"${name}" is not available. This editor runs Hydra chains only, not JavaScript.`,
          startLine,
          startColumn,
        );
      }
      tokens.push({ k: "id", v: name, line: startLine, column: startColumn });
      continue;
    }

    if (ch === "=" && source[i + 1] === ">") {
      bump();
      bump();
      tokens.push({ k: "arrow", line: startLine, column: startColumn });
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      throw new VjSketchError(
        "Strings are not allowed. Pass numbers, buffers, and Hydra chains.",
        startLine,
        startColumn,
      );
    }
    if (ch === "{" || ch === "}") {
      throw new VjSketchError(
        "Blocks are not allowed. Write a Hydra chain such as src(s0).out().",
        startLine,
        startColumn,
      );
    }
    if ("()[].,+-*/;=".includes(ch)) {
      bump();
      tokens.push({ k: "op", v: ch, line: startLine, column: startColumn });
      continue;
    }
    throw new VjSketchError(
      `Unexpected "${ch}". This editor only accepts Hydra chains.`,
      startLine,
      startColumn,
    );
  }

  tokens.push({ k: "eof", line, column });
  return tokens;
}

class Parser {
  private index = 0;
  private readonly tokens: Tok[];

  constructor(tokens: Tok[]) {
    this.tokens = tokens;
  }

  parseProgram(): Statement[] {
    const statements: Statement[] = [];
    while (!this.eof()) {
      if (this.eatOp(";")) continue;
      statements.push(this.parseStatement());
      this.eatOp(";");
    }
    return statements;
  }

  private eof() {
    return this.cur().k === "eof";
  }

  private cur(): Tok {
    return this.tokens[this.index] ?? this.tokens[this.tokens.length - 1]!;
  }

  private eatOp(value: string) {
    const token = this.cur();
    if (token.k === "op" && token.v === value) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private checkOp(value: string, offset = 0) {
    const token = this.tokens[this.index + offset];
    return token?.k === "op" && token.v === value;
  }

  private expectOp(value: string) {
    if (!this.eatOp(value)) {
      const token = this.cur();
      throw new VjSketchError(`Expected "${value}".`, token.line, token.column);
    }
  }

  private isArrowHead(index = this.index) {
    const open = this.tokens[index];
    const close = this.tokens[index + 1];
    const arrow = this.tokens[index + 2];
    return open?.k === "op" && open.v === "(" && close?.k === "op" && close.v === ")" && arrow?.k === "arrow";
  }

  /** A call, a buffer, or parentheses around one of those. */
  private startsChain(index = this.index): boolean {
    const token = this.tokens[index];
    if (!token) return false;
    if (token.k === "id") {
      const next = this.tokens[index + 1];
      if (next?.k === "op" && next.v === "(") return true;
      return BUFFERS.has(token.v);
    }
    if (token.k === "op" && token.v === "(") return this.startsChain(index + 1);
    return false;
  }

  private parseStatement(): Statement {
    const token = this.cur();
    if (token.k === "id" && this.checkOp("=", 1)) return this.parseBinding();
    const expr = this.parseChain();
    if (expr.type === "buffer") {
      throw new VjSketchError(
        `Expected a call such as src(${expr.name}).out().`,
        expr.line,
        expr.column,
      );
    }
    return { type: "chain", expr };
  }

  private parseBinding(): Statement {
    const nameTok = this.cur();
    if (nameTok.k !== "id") {
      throw new VjSketchError("Expected a name.", nameTok.line, nameTok.column);
    }
    if (isReservedBinding(nameTok.v)) {
      throw new VjSketchError(
        `"${nameTok.v}" is reserved. Bind a new name, or set speed to a number.`,
        nameTok.line,
        nameTok.column,
      );
    }
    this.index += 1;
    this.expectOp("=");
    if (this.isArrowHead() && this.startsChain(this.index + 3)) {
      if (nameTok.v === "speed") {
        throw new VjSketchError(
          "speed needs a fixed number. It sets the Hydra clock, not a chain.",
          nameTok.line,
          nameTok.column,
        );
      }
      const arrow = this.tokens[this.index + 2];
      this.index += 3;
      const body = this.parseChain();
      if (body.type === "buffer") {
        throw new VjSketchError(
          "Expected a Hydra chain after () =>.",
          body.line,
          body.column,
        );
      }
      return {
        type: "helper",
        name: nameTok.v,
        body,
        line: arrow?.line ?? nameTok.line,
        column: arrow?.column ?? nameTok.column,
      };
    }
    return {
      type: "num",
      name: nameTok.v,
      expr: this.parseNumeric(),
      line: nameTok.line,
      column: nameTok.column,
    };
  }

  private parseChain(): ChainExpr {
    let expr: ChainExpr;
    if (this.eatOp("(")) {
      expr = this.parseChain();
      this.expectOp(")");
    } else {
      expr = this.parsePrimary();
    }
    while (this.eatOp(".")) {
      const token = this.cur();
      if (token.k !== "id") {
        throw new VjSketchError("Expected a Hydra transform name.", token.line, token.column);
      }
      const name = token.v;
      this.index += 1;
      if (expr.type === "buffer") {
        throw new VjSketchError(
          `${expr.name}.${name}() is not allowed. s0 stays the loaded video. Use src(${expr.name}).`,
          token.line,
          token.column,
        );
      }
      if (!METHODS.has(name)) {
        throw new VjSketchError(
          `.${name}() is not a Hydra transform.`,
          token.line,
          token.column,
        );
      }
      this.expectOp("(");
      const args = this.parseArgList();
      this.expectOp(")");
      expr = { type: "method", object: expr, name, args, line: token.line, column: token.column };
    }
    return expr;
  }

  private parsePrimary(): ChainExpr {
    const token = this.cur();
    if (token.k !== "id") {
      throw new VjSketchError(
        "Expected a Hydra chain such as src(s0).out().",
        token.line,
        token.column,
      );
    }
    this.index += 1;
    if (this.eatOp("(")) {
      const args = this.parseArgList();
      this.expectOp(")");
      return { type: "call", name: token.v, args, line: token.line, column: token.column };
    }
    if (BUFFERS.has(token.v)) {
      return { type: "buffer", name: token.v, line: token.line, column: token.column };
    }
    throw new VjSketchError(
      `Unknown name ${token.v}. Use a Hydra source, a helper, or s0–s3 / o0–o3.`,
      token.line,
      token.column,
    );
  }

  private parseArgList(): Expr[] {
    const args: Expr[] = [];
    if (this.checkOp(")")) return args;
    args.push(this.parseArg());
    while (this.eatOp(",")) {
      if (this.checkOp(")")) break;
      args.push(this.parseArg());
    }
    return args;
  }

  private parseArg(): Expr {
    const token = this.cur();
    if (this.isArrowHead() && this.startsChain(this.index + 3)) {
      throw new VjSketchError(
        "Name a chain helper first: pat = () => osc().rotate().",
        token.line,
        token.column,
      );
    }
    if (this.startsChain()) return this.parseChain();
    if (
      token.k === "num" ||
      token.k === "id" ||
      (token.k === "op" && (token.v === "+" || token.v === "-" || token.v === "(" || token.v === "["))
    ) {
      return this.parseNumeric();
    }
    throw new VjSketchError(
      "Expected a number, buffer, or Hydra chain.",
      token.line,
      token.column,
    );
  }

  private parseNumeric(): NumExpr {
    return this.parseSum();
  }

  private parseSum(): NumExpr {
    let left = this.parseProduct();
    while (this.checkOp("+") || this.checkOp("-")) {
      const opTok = this.cur();
      if (opTok.k !== "op" || (opTok.v !== "+" && opTok.v !== "-")) break;
      this.index += 1;
      const right = this.parseProduct();
      left = {
        type: "binary",
        op: opTok.v,
        left,
        right,
        line: opTok.line,
        column: opTok.column,
      };
    }
    return left;
  }

  private parseProduct(): NumExpr {
    let left = this.parseUnary();
    while (this.checkOp("*") || this.checkOp("/")) {
      const opTok = this.cur();
      if (opTok.k !== "op" || (opTok.v !== "*" && opTok.v !== "/")) break;
      this.index += 1;
      const right = this.parseUnary();
      left = {
        type: "binary",
        op: opTok.v,
        left,
        right,
        line: opTok.line,
        column: opTok.column,
      };
    }
    return left;
  }

  private parseUnary(): NumExpr {
    const token = this.cur();
    if (token.k === "op" && (token.v === "+" || token.v === "-")) {
      this.index += 1;
      const expr = this.parseUnary();
      if (token.v === "+") return expr;
      return { type: "unary", expr, line: token.line, column: token.column };
    }
    return this.parseAtom();
  }

  private parseAtom(): NumExpr {
    const token = this.cur();
    if (token.k === "num") {
      this.index += 1;
      return { type: "number", value: token.v, line: token.line, column: token.column };
    }
    if (token.k === "id" && token.v === "Math") {
      this.index += 1;
      this.expectOp(".");
      const nameTok = this.cur();
      if (nameTok.k !== "id" || !Object.hasOwn(MATH_FNS, nameTok.v)) {
        throw new VjSketchError(
          "Only Math.sin, cos, tan, abs, min, max, pow, floor, ceil, sqrt, sign, exp, log, and random are allowed.",
          nameTok.line,
          nameTok.column,
        );
      }
      this.index += 1;
      this.expectOp("(");
      const args: NumExpr[] = [];
      if (!this.checkOp(")")) {
        args.push(this.parseNumeric());
        while (this.eatOp(",")) {
          if (this.checkOp(")")) break;
          args.push(this.parseNumeric());
        }
      }
      this.expectOp(")");
      return {
        type: "math",
        name: nameTok.v,
        args,
        line: token.line,
        column: token.column,
      };
    }
    if (token.k === "id") {
      this.index += 1;
      if (this.checkOp("(")) {
        throw new VjSketchError(
          `${token.v} is a number, not a function.`,
          token.line,
          token.column,
        );
      }
      return { type: "name", name: token.v, line: token.line, column: token.column };
    }
    if (token.k === "op" && token.v === "(") {
      if (this.isArrowHead()) {
        this.index += 3;
        const body = this.parseNumeric();
        return { type: "arrow", body, line: token.line, column: token.column };
      }
      this.index += 1;
      const inner = this.parseNumeric();
      this.expectOp(")");
      return inner;
    }
    if (token.k === "op" && token.v === "[") {
      this.index += 1;
      const items: NumExpr[] = [];
      if (!this.checkOp("]")) {
        items.push(this.parseNumeric());
        while (this.eatOp(",")) {
          if (this.checkOp("]")) break;
          items.push(this.parseNumeric());
        }
      }
      this.expectOp("]");
      const mods: ArrayMod[] = [];
      while (this.checkOp(".")) {
        const nameTok = this.tokens[this.index + 1];
        if (!nameTok || nameTok.k !== "id" || !isArrayMod(nameTok.v)) {
          const at = nameTok ?? this.cur();
          throw new VjSketchError(
            "Arrays only support .fast(), .smooth(), .offset(), and .fit().",
            at.line,
            at.column,
          );
        }
        this.index += 2;
        this.expectOp("(");
        const args: NumExpr[] = [];
        if (!this.checkOp(")")) {
          args.push(this.parseNumeric());
          while (this.eatOp(",")) {
            if (this.checkOp(")")) break;
            args.push(this.parseNumeric());
          }
        }
        this.expectOp(")");
        const max = nameTok.v === "fit" ? 2 : 1;
        if (args.length > max) {
          throw new VjSketchError(
            `.${nameTok.v}() takes at most ${max} number${max === 1 ? "" : "s"}.`,
            nameTok.line,
            nameTok.column,
          );
        }
        mods.push({
          name: nameTok.v,
          args,
          line: nameTok.line,
          column: nameTok.column,
        });
      }
      return { type: "array", items, mods, line: token.line, column: token.column };
    }
    throw new VjSketchError("Expected a number.", token.line, token.column);
  }
}

function isLive(expr: NumExpr, scope: Scope, stack = new Set<string>()): boolean {
  switch (expr.type) {
    case "number":
      return false;
    case "name":
      return nameIsLive(expr.name, scope, stack);
    case "unary":
      return isLive(expr.expr, scope, stack);
    case "binary":
      return isLive(expr.left, scope, stack) || isLive(expr.right, scope, stack);
    case "math":
      return expr.name === "random" || expr.args.some((arg) => isLive(arg, scope, stack));
    case "arrow":
      return true;
    case "array":
      return (
        expr.items.some((item) => isLive(item, scope, stack)) ||
        expr.mods.some((mod) => mod.args.some((arg) => isLive(arg, scope, stack)))
      );
  }
}

function nameIsLive(name: string, scope: Scope, stack: Set<string>) {
  if (name === "intensity" || name === "time") return true;
  if (stack.has(name)) return true;
  const bound = scope.get(name);
  if (!bound || bound.kind !== "num") return false;
  stack.add(name);
  const live = isLive(bound.expr, scope, stack);
  stack.delete(name);
  return live;
}

function validateNumeric(expr: NumExpr, scope: Scope, stack = new Set<string>()) {
  switch (expr.type) {
    case "number":
      return;
    case "name":
      validateName(expr, scope, stack);
      return;
    case "unary":
      validateNumeric(expr.expr, scope, stack);
      return;
    case "binary":
      validateNumeric(expr.left, scope, stack);
      validateNumeric(expr.right, scope, stack);
      return;
    case "math":
      for (const arg of expr.args) validateNumeric(arg, scope, stack);
      return;
    case "arrow":
      validateNumeric(expr.body, scope, stack);
      return;
    case "array":
      for (const item of expr.items) validateNumeric(item, scope, stack);
      for (const mod of expr.mods) {
        for (const arg of mod.args) validateNumeric(arg, scope, stack);
        if (mod.args.some((arg) => isLive(arg, scope))) {
          throw new VjSketchError(
            "Array .fast(), .smooth(), .offset(), and .fit() need fixed numbers.",
            mod.line,
            mod.column,
          );
        }
      }
      if (expr.items.some((item) => isLive(item, scope))) {
        throw new VjSketchError(
          "Arrays can only contain numbers.",
          expr.line,
          expr.column,
        );
      }
  }
}

function validateName(expr: Extract<NumExpr, { type: "name" }>, scope: Scope, stack: Set<string>) {
  if (expr.name === "intensity" || expr.name === "time") return;
  if (expr.name === "speed") {
    const bound = scope.get("speed");
    if (!bound) return;
    if (bound.kind !== "num") {
      throw new VjSketchError("speed is a number, not a chain.", expr.line, expr.column);
    }
    if (stack.has("speed")) {
      throw new VjSketchError(
        "Numeric bindings cannot refer to themselves.",
        expr.line,
        expr.column,
      );
    }
    stack.add("speed");
    validateNumeric(bound.expr, scope, stack);
    stack.delete("speed");
    return;
  }
  const bound = scope.get(expr.name);
  if (!bound) {
    throw new VjSketchError(
      `Unknown number ${expr.name}.`,
      expr.line,
      expr.column,
    );
  }
  if (bound.kind === "helper") {
    throw new VjSketchError(
      `${expr.name} is a chain. Call ${expr.name}().`,
      expr.line,
      expr.column,
    );
  }
  if (stack.has(expr.name)) {
    throw new VjSketchError(
      "Numeric bindings cannot refer to themselves.",
      expr.line,
      expr.column,
    );
  }
  stack.add(expr.name);
  validateNumeric(bound.expr, scope, stack);
  stack.delete(expr.name);
}

function validateChain(expr: ChainExpr, scope: Scope, stack: Set<string>) {
  if (expr.type === "buffer") return;
  if (expr.type === "call") {
    validateCall(expr, scope, stack);
    return;
  }
  validateChain(expr.object, scope, stack);
  for (const arg of expr.args) validateExpr(arg, scope, stack);
}

function validateCall(
  expr: Extract<ChainExpr, { type: "call" }>,
  scope: Scope,
  stack: Set<string>,
) {
  if (expr.name === "render") {
    if (expr.args.length > 1) {
      throw new VjSketchError("render() takes one buffer.", expr.line, expr.column);
    }
    for (const arg of expr.args) validateExpr(arg, scope, stack);
    return;
  }
  const bound = scope.get(expr.name);
  if (bound?.kind === "helper") {
    if (expr.args.length > 0) {
      throw new VjSketchError(
        `${expr.name}() takes no arguments.`,
        expr.line,
        expr.column,
      );
    }
    if (stack.has(expr.name)) {
      throw new VjSketchError(
        `Helper ${expr.name}() cannot call itself.`,
        expr.line,
        expr.column,
      );
    }
    stack.add(expr.name);
    validateChain(bound.body, scope, stack);
    stack.delete(expr.name);
    return;
  }
  if (bound?.kind === "num") {
    throw new VjSketchError(
      `${expr.name} is a number, not a function.`,
      expr.line,
      expr.column,
    );
  }
  if (!SOURCES.has(expr.name)) {
    throw new VjSketchError(
      `Unknown Hydra source ${expr.name}().`,
      expr.line,
      expr.column,
    );
  }
  for (const arg of expr.args) validateExpr(arg, scope, stack);
}

function validateExpr(expr: Expr, scope: Scope, stack: Set<string>) {
  if (isNumExpr(expr)) {
    validateNumeric(expr, scope);
    return;
  }
  validateChain(expr, scope, stack);
}

function draws(expr: ChainExpr, scope: Scope, stack = new Set<string>()): boolean {
  if (expr.type === "buffer") return false;
  if (expr.type === "method") {
    if (expr.name === "out") return true;
    if (draws(expr.object, scope, stack)) return true;
    return expr.args.some((arg) => !isNumExpr(arg) && draws(arg, scope, stack));
  }
  if (expr.name === "render") return true;
  const bound = scope.get(expr.name);
  if (bound?.kind === "helper" && !stack.has(expr.name)) {
    stack.add(expr.name);
    if (draws(bound.body, scope, stack)) return true;
    stack.delete(expr.name);
  }
  return expr.args.some((arg) => !isNumExpr(arg) && draws(arg, scope, stack));
}

function validateProgram(program: Statement[]) {
  const scope: Scope = new Map();
  let didDraw = false;
  for (const statement of program) {
    if (statement.type === "num") {
      validateNumeric(statement.expr, scope);
      if (statement.name === "speed" && isLive(statement.expr, scope)) {
        throw new VjSketchError(
          "speed needs a fixed number. It sets the Hydra clock.",
          statement.line,
          statement.column,
        );
      }
      scope.set(statement.name, { kind: "num", expr: statement.expr });
      continue;
    }
    if (statement.type === "helper") {
      scope.set(statement.name, { kind: "helper", body: statement.body });
      continue;
    }
    validateChain(statement.expr, scope, new Set());
    if (draws(statement.expr, scope)) didDraw = true;
  }
  if (!didDraw) {
    const first = program[0];
    const at = first?.type === "chain" ? first.expr : first;
    throw new VjSketchError(
      "Nothing is drawn. End a chain with .out() or call render().",
      at?.line ?? 1,
      at?.column ?? 1,
    );
  }
}

function compute(expr: NumExpr, env: VjSketchEnv, scope: Scope, synth: VjSketchSynth, stack = new Set<string>()): number {
  switch (expr.type) {
    case "number":
      return expr.value;
    case "name":
      return computeName(expr, env, scope, synth, stack);
    case "unary":
      return -compute(expr.expr, env, scope, synth, stack);
    case "binary": {
      const left = compute(expr.left, env, scope, synth, stack);
      const right = compute(expr.right, env, scope, synth, stack);
      if (expr.op === "+") return left + right;
      if (expr.op === "-") return left - right;
      if (expr.op === "*") return left * right;
      return left / right;
    }
    case "math": {
      const fn = MATH_FNS[expr.name];
      if (!fn) {
        throw new VjSketchError(
          `Math.${expr.name} is not available.`,
          expr.line,
          expr.column,
        );
      }
      return fn(...expr.args.map((arg) => compute(arg, env, scope, synth, stack)));
    }
    case "arrow":
      return compute(expr.body, env, scope, synth, stack);
    case "array":
      throw new VjSketchError(
        "Arrays can only contain numbers.",
        expr.line,
        expr.column,
      );
  }
}

function computeName(
  expr: Extract<NumExpr, { type: "name" }>,
  env: VjSketchEnv,
  scope: Scope,
  synth: VjSketchSynth,
  stack: Set<string>,
): number {
  if (expr.name === "intensity") return env.intensity();
  if (expr.name === "time") return env.time();
  if (stack.has(expr.name)) {
    throw new VjSketchError(
      "Numeric bindings cannot refer to themselves.",
      expr.line,
      expr.column,
    );
  }
  if (expr.name === "speed") {
    const bound = scope.get("speed");
    if (bound?.kind === "num") {
      stack.add("speed");
      const value = compute(bound.expr, env, scope, synth, stack);
      stack.delete("speed");
      return value;
    }
    if (typeof synth.speed !== "number" || !Number.isFinite(synth.speed)) {
      throw new VjSketchError(
        "speed is not a number on this synth.",
        expr.line,
        expr.column,
      );
    }
    return synth.speed;
  }
  const bound = scope.get(expr.name);
  if (bound?.kind !== "num") {
    throw new VjSketchError(`Unknown number ${expr.name}.`, expr.line, expr.column);
  }
  stack.add(expr.name);
  const value = compute(bound.expr, env, scope, synth, stack);
  stack.delete(expr.name);
  return value;
}

function mapRange(num: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function applyArrayMod(arr: SequencedArray, mod: ArrayMod, args: number[]): SequencedArray {
  if (mod.name === "fast") {
    arr._speed = args[0] ?? 1;
    return arr;
  }
  if (mod.name === "smooth") {
    arr._smooth = args[0] ?? 1;
    return arr;
  }
  if (mod.name === "offset") {
    arr._offset = (args[0] ?? 0.5) % 1;
    return arr;
  }
  const low = args[0] ?? 0;
  const high = args[1] ?? 1;
  const lowest = Math.min(...arr);
  const highest = Math.max(...arr);
  const mapped = arr.map((num) => mapRange(num, lowest, highest, low, high)) as SequencedArray;
  if (typeof arr._speed === "number") mapped._speed = arr._speed;
  if (typeof arr._smooth === "number") mapped._smooth = arr._smooth;
  return mapped;
}

function materialize(
  expr: NumExpr,
  env: VjSketchEnv,
  scope: Scope,
  synth: VjSketchSynth,
): number | (() => number) | SequencedArray {
  if (expr.type === "array") {
    if (expr.items.some((item) => isLive(item, scope))) {
      throw new VjSketchError(
        "Arrays can only contain numbers.",
        expr.line,
        expr.column,
      );
    }
    let arr = expr.items.map((item) => compute(item, env, scope, synth)) as SequencedArray;
    for (const mod of expr.mods) {
      if (mod.args.some((arg) => isLive(arg, scope))) {
        throw new VjSketchError(
          "Array .fast(), .smooth(), .offset(), and .fit() need fixed numbers.",
          mod.line,
          mod.column,
        );
      }
      const args = mod.args.map((arg) => compute(arg, env, scope, synth));
      arr = applyArrayMod(arr, mod, args);
    }
    return arr;
  }
  if (!isLive(expr, scope)) return compute(expr, env, scope, synth);
  return () => compute(expr, env, scope, synth);
}

function evaluate(synth: VjSketchSynth, expr: Expr, env: VjSketchEnv, scope: Scope): unknown {
  if (isNumExpr(expr)) return materialize(expr, env, scope, synth);

  if (expr.type === "buffer") {
    const value = synth[expr.name];
    if (value == null) {
      throw new VjSketchError(
        `Buffer ${expr.name} is not on this Hydra instance.`,
        expr.line,
        expr.column,
      );
    }
    return value;
  }

  if (expr.type === "call") {
    const helper = scope.get(expr.name);
    if (helper?.kind === "helper") {
      if (expr.args.length > 0) {
        throw new VjSketchError(
          `${expr.name}() takes no arguments.`,
          expr.line,
          expr.column,
        );
      }
      return evaluate(synth, helper.body, env, scope);
    }
    const args = expr.args.map((arg) => evaluate(synth, arg, env, scope));
    if (expr.name === "render") {
      if (args.length > 1) {
        throw new VjSketchError("render() takes one buffer.", expr.line, expr.column);
      }
      try {
        synth.render(args[0]);
      } catch (error) {
        if (error instanceof VjSketchError) throw error;
        const message = error instanceof Error ? error.message : "render() failed.";
        throw new VjSketchError(message, expr.line, expr.column);
      }
      return args[0];
    }
    if (!SOURCES.has(expr.name)) {
      throw new VjSketchError(
        `Unknown Hydra source ${expr.name}().`,
        expr.line,
        expr.column,
      );
    }
    const fn = synth[expr.name];
    if (typeof fn !== "function") {
      throw new VjSketchError(
        `${expr.name}() is not on this Hydra instance.`,
        expr.line,
        expr.column,
      );
    }
    try {
      return (fn as (...args: unknown[]) => unknown)(...args);
    } catch (error) {
      if (error instanceof VjSketchError) throw error;
      const message = error instanceof Error ? error.message : `${expr.name}() failed.`;
      throw new VjSketchError(message, expr.line, expr.column);
    }
  }

  if (!METHODS.has(expr.name)) {
    throw new VjSketchError(
      `.${expr.name}() is not a Hydra transform.`,
      expr.line,
      expr.column,
    );
  }
  const object = evaluate(synth, expr.object, env, scope);
  if (object == null || (typeof object !== "object" && typeof object !== "function")) {
    throw new VjSketchError(
      `.${expr.name}() needs a Hydra chain.`,
      expr.line,
      expr.column,
    );
  }
  const fn = (object as Record<string, unknown>)[expr.name];
  if (typeof fn !== "function") {
    throw new VjSketchError(
      `.${expr.name}() is not available on that chain.`,
      expr.line,
      expr.column,
    );
  }
  const args = expr.args.map((arg) => evaluate(synth, arg, env, scope));
  try {
    return (fn as (...args: unknown[]) => unknown).apply(object, args);
  } catch (error) {
    if (error instanceof VjSketchError) throw error;
    const message = error instanceof Error ? error.message : `.${expr.name}() failed.`;
    throw new VjSketchError(message, expr.line, expr.column);
  }
}

function executeProgram(synth: VjSketchSynth, program: Statement[], env: VjSketchEnv) {
  const scope: Scope = new Map();
  for (const statement of program) {
    if (statement.type === "num") {
      if (statement.name === "speed") {
        const value = compute(statement.expr, env, scope, synth);
        if (!Number.isFinite(value)) {
          throw new VjSketchError(
            "speed needs a fixed number. It sets the Hydra clock.",
            statement.line,
            statement.column,
          );
        }
        synth.speed = value;
      }
      scope.set(statement.name, { kind: "num", expr: statement.expr });
      continue;
    }
    if (statement.type === "helper") {
      scope.set(statement.name, { kind: "helper", body: statement.body });
      continue;
    }
    evaluate(synth, statement.expr, env, scope);
  }
}

export function parseVjSketch(code: string): Statement[] {
  return new Parser(lex(code)).parseProgram();
}

/** Parse and validate. Does not call the synth. */
export function checkVjSketch(code: string): { ok: true } | { ok: false; message: string } {
  try {
    const program = parseVjSketch(code);
    if (program.length === 0) {
      throw new VjSketchError("Sketch is empty.", 1, 1);
    }
    validateProgram(program);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not read that sketch.",
    };
  }
}

export type VjQuickFixResult = {
  tips: string[];
  fixedCode?: string;
};

const BLOCKED_LINE =
  /\b(eval|Function|window|document|globalThis|global|hush|initCam|initVideo|initImage|initScreen|initStream|initCanvas|loadScript|setResolution|fetch|XMLHttpRequest|alert|setTimeout|setInterval)\b/;

/**
 * Local syntax help for the /vj editor. A rewrite is returned only when
 * checkVjSketch accepts it, so Apply cannot insert a sketch the interpreter rejects.
 */
export function vjQuickFix(ctx: { code: string; error?: string | null }): VjQuickFixResult {
  const code = ctx.code ?? "";
  if (!code.trim()) {
    return {
      tips: ["The editor is empty. s0 is the loaded video."],
      fixedCode: "src(s0).out()",
    };
  }

  const current = checkVjSketch(code);
  if (current.ok) return { tips: [] };

  const tips = [current.message];
  if (BLOCKED_LINE.test(code)) {
    tips.push(
      "This editor runs Hydra chains only. s0 stays the loaded video — no DOM, eval, hush(), initCam(), or loadScript().",
    );
  }
  if (/\ba\s*\.\s*fft\b/.test(code)) {
    tips.push("There is no microphone on /vj. Use intensity or () => time.");
  }
  if (/['"`]/.test(code)) {
    tips.push("Strings are not allowed. Pass numbers, buffers, and chains.");
  }
  if (/[{}]/.test(code)) {
    tips.push("Blocks are not allowed. Name a helper: pat = () => osc().rotate().");
  }

  const fixedCode = firstValidRewrite(code);
  if (fixedCode) tips.push("This rewrite passes the VJ parser.");
  return { tips, fixedCode };
}

function firstValidRewrite(code: string) {
  const rewritten = rewriteBlocked(code);
  const candidates = [appendOut(code), rewritten, appendOut(rewritten)];
  if (!rewritten.trim()) candidates.push("src(s0).out()");
  for (const candidate of candidates) {
    const next = candidate.trim();
    if (!next || next === code.trim()) continue;
    if (checkVjSketch(next).ok) return next;
  }
  return undefined;
}

function rewriteBlocked(code: string) {
  const withoutFft = code.replace(/\ba\s*\.\s*fft\s*\[[^\]]*\]/g, "intensity");
  return withoutFft
    .split("\n")
    .filter((line) => !BLOCKED_LINE.test(line))
    .join("\n")
    .trim();
}

function appendOut(code: string) {
  const lines = code.split("\n");
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const trim = lines[index]?.trim() ?? "";
    if (!trim || trim.startsWith("//")) continue;
    if (/\.out\s*\(/.test(trim) || /\brender\s*\(/.test(trim)) return code;
    if (/^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(trim) && !trim.includes("=>")) continue;
    lines[index] = lines[index]!.replace(/\s*;?\s*$/, "") + ".out()";
    return lines.join("\n");
  }
  return code;
}

/** Replace the output chain only. Does not call hush() or touch the video element. */
export function runVjSketch(synth: VjSketchSynth, code: string, env: VjSketchEnv) {
  const program = parseVjSketch(code);
  if (program.length === 0) {
    throw new VjSketchError("Sketch is empty.", 1, 1);
  }
  validateProgram(program);
  executeProgram(synth, program, env);
}
