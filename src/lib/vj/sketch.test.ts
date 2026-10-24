import assert from "node:assert/strict";
import test from "node:test";
import { runVjSketch, type VjSketchSynth } from "./sketch.ts";

function describe(arg: unknown): string {
  if (typeof arg === "function") return `fn:${String((arg as () => number)())}`;
  if (typeof arg === "number") return String(arg);
  if (Array.isArray(arg)) {
    const seq = arg as number[] & { _speed?: number; _smooth?: number; _offset?: number };
    return `arr:${arg.join("|")}:speed=${seq._speed ?? ""}:smooth=${seq._smooth ?? ""}:offset=${seq._offset ?? ""}`;
  }
  if (arg && typeof arg === "object" && "id" in arg) return String((arg as { id: string }).id);
  return "chain";
}

function harness() {
  const calls: string[] = [];
  const chain: Record<string, (...args: unknown[]) => unknown> = {};
  for (const name of [
    "modulate",
    "out",
    "blend",
    "kaleid",
    "rotate",
    "layer",
    "mult",
    "mask",
    "diff",
    "scale",
  ]) {
    chain[name] = (...args: unknown[]) => {
      calls.push(`${name}(${args.map(describe).join(",")})`);
      return chain;
    };
  }

  const s0 = { id: "s0" };
  const o0 = { id: "o0" };
  const call =
    (label: string) =>
    (...args: unknown[]) => {
      calls.push(`${label}(${args.map(describe).join(",")})`);
      return chain;
    };

  const synth = {
    time: 4,
    speed: 1,
    s0,
    o0,
    render(output?: unknown) {
      calls.push(`render(${describe(output)})`);
    },
    src: call("src"),
    osc: call("osc"),
    noise: call("noise"),
    shape: call("shape"),
    solid: call("solid"),
  } as unknown as VjSketchSynth;

  return { synth, calls };
}

const env = { intensity: () => 0.5, time: () => 4 };

test("runs a video modulate chain without hush", () => {
  const { synth, calls } = harness();
  runVjSketch(synth, "src(s0).modulate(noise(3, 0.1), 0.1).out()", env);
  assert.deepEqual(calls, [
    "src(s0)",
    "noise(3,0.1)",
    "modulate(chain,0.1)",
    "out()",
  ]);
});

test("keeps comments, line breaks, and the intensity slider", () => {
  const { synth, calls } = harness();
  runVjSketch(
    synth,
    `
      // editable preset
      src(s0)
        .modulate(noise(3, 0.1), intensity * 0.4)
        .out()
    `,
    env,
  );
  assert.deepEqual(calls, [
    "src(s0)",
    "noise(3,0.1)",
    "modulate(chain,fn:0.2)",
    "out()",
  ]);
});

test("does not execute any chain when later syntax is rejected", () => {
  const { synth, calls } = harness();
  assert.throws(
    () => runVjSketch(synth, "src(s0).out()\ndocument.body.remove()", env),
    /document/,
  );
  assert.deepEqual(calls, []);
});

test("rejects DOM, eval, and source replacement", () => {
  const { synth, calls } = harness();
  for (const code of [
    "window.location = 'https://example.invalid'",
    'eval("1")',
    'Function("return this")()',
    "s0.initCam()",
    'src(s0).initVideo("file")',
    "hush()",
  ]) {
    assert.throws(() => runVjSketch(synth, code, env), VjSketchReject, code);
  }
  assert.deepEqual(calls, []);
});

function VjSketchReject(error: unknown) {
  return error instanceof Error && /not available|not allowed|Unknown Hydra|Expected/.test(error.message);
}

test("allows time arrows and render without touching s0", () => {
  const { synth, calls } = harness();
  runVjSketch(synth, "src(s0).rotate(() => time).out(o0)\nrender(o0)", env);
  assert.deepEqual(calls, [
    "src(s0)",
    "rotate(fn:4)",
    "out(o0)",
    "render(o0)",
  ]);
});

test("binds local numbers and reads them from later chains", () => {
  const { synth, calls } = harness();
  runVjSketch(
    synth,
    `
      n = 2
      m = n + intensity
      osc(n, m).out()
    `,
    env,
  );
  assert.deepEqual(calls, ["osc(2,fn:2.5)", "out()"]);
  assert.equal(synth.speed, 1);
});

test("calls a helper from a chain and from a nested argument", () => {
  const { synth, calls } = harness();
  runVjSketch(
    synth,
    `
      pat = () => osc(2).rotate(0.1)
      solid().layer(src(s0).mult(pat())).mask(shape(4)).out()
    `,
    env,
  );
  assert.deepEqual(calls, [
    "solid()",
    "src(s0)",
    "osc(2)",
    "rotate(0.1)",
    "mult(chain)",
    "layer(chain)",
    "shape(4)",
    "mask(chain)",
    "out()",
  ]);
});

test("does not call a helper until a later chain invokes it", () => {
  const { synth, calls } = harness();
  runVjSketch(synth, "pat = () => osc().rotate()\nsrc(s0).out()", env);
  assert.deepEqual(calls, ["src(s0)", "out()"]);
});

test("sets synth.speed and does not write globalThis", () => {
  const { synth, calls } = harness();
  const before = Object.getOwnPropertyDescriptor(globalThis, "speed");
  runVjSketch(synth, "speed = 0.5\nosc(speed).out()", env);
  assert.equal(synth.speed, 0.5);
  assert.equal(Object.getOwnPropertyDescriptor(globalThis, "speed"), before);
  assert.deepEqual(calls, ["osc(0.5)", "out()"]);
});

test("passes hydra array modifiers without calling them early", () => {
  const { synth, calls } = harness();
  runVjSketch(
    synth,
    "osc([0, 10].fast(2).smooth(0.4).offset(0.25).fit(0, 1), [1, 3].offset(0.2)).out()",
    env,
  );
  const oscCall = calls[0] ?? "";
  assert.equal(
    oscCall,
    "osc(arr:0|1:speed=2:smooth=0.4:offset=,arr:1|3:speed=:smooth=:offset=0.2)",
  );
  assert.deepEqual(calls.slice(1), ["out()"]);
});

test("uses hydra defaults for array modifiers and keeps a fixed number from speed", () => {
  const { synth, calls } = harness();
  runVjSketch(
    synth,
    `
      speed = 0.5
      shape([4, 8].fast().smooth().offset().fit()).out()
    `,
    env,
  );
  assert.equal(synth.speed, 0.5);
  assert.equal(calls[0], "shape(arr:0|1:speed=1:smooth=1:offset=)");
});

test("does not change speed or run chains when a later line is invalid", () => {
  const { synth, calls } = harness();
  assert.throws(
    () =>
      runVjSketch(
        synth,
        `
          speed = 0.2
          pat = () => osc().rotate()
          src(s0).layer(pat()).out()
          nope().out()
        `,
        env,
      ),
    /Unknown Hydra source nope/,
  );
  assert.equal(synth.speed, 1);
  assert.deepEqual(calls, []);
});

/** ee_2 from hydra's bundled examples. sketch_id eerie_ear_0. */
const MULTIVERSE = `// ee_2 . MULTIVERSE . time and feedback
// e_e // @eerie_ear
pat = ()=>
solid()
.layer(solid().diff(
  osc((time/16) * 1, (time/1000) * 0.2  )
    .mult(osc((time/8) * 1, (time/1006) * 0.2  ).rotate(1.57))
    .modulate((shape(106,1,0.05)))
    .mult(shape(106,1,0.05))
  ))
  .modulateScale(osc(2,0.125),0.125)
//
solid()
.layer(solid(1,1,1)
  .mult(pat()
  .diff(src(o0).scale(0.2).mult(solid(),[0.7,0.6,0.4,0.6]).kaleid(1.01).saturate(0.3))
)
.layer(solid(1,1,1)
    .mask(
      noise(2,0.05)
      .invert().colorama(2).posterize(8,4).luma(0.25).thresh(0.5)
      .modulateRotate(osc(1,0.5))
    )
    .mult(gradient(0.5).kaleid(1).colorama(2).saturate(1.1).contrast(1.6).mult(solid(),0.45))
  ))
  .out()
//
speed= 0.5
`;

test("runs the MULTIVERSE sketch: helper, feedback, array, and synth speed", () => {
  const calls: string[] = [];
  const chain = new Proxy(
    {},
    {
      get(target, prop) {
        if (typeof prop !== "string") return undefined;
        const record = target as Record<string, unknown>;
        if (typeof record[prop] !== "function") {
          record[prop] = (...args: unknown[]) => {
            calls.push(`${prop}(${args.map(describe).join(",")})`);
            return chain;
          };
        }
        return record[prop];
      },
    },
  );
  const source =
    (label: string) =>
    (...args: unknown[]) => {
      calls.push(`${label}(${args.map(describe).join(",")})`);
      return chain;
    };
  const synth = {
    time: 0,
    speed: 1,
    s0: { id: "s0" },
    o0: { id: "o0" },
    render() {
      calls.push("render()");
    },
    src: source("src"),
    osc: source("osc"),
    shape: source("shape"),
    solid: source("solid"),
    noise: source("noise"),
    gradient: source("gradient"),
  } as unknown as VjSketchSynth;
  const time = 16000;
  const before = Object.getOwnPropertyDescriptor(globalThis, "speed");

  runVjSketch(synth, MULTIVERSE, { intensity: () => 0, time: () => time });

  assert.equal(synth.speed, 0.5);
  assert.equal(Object.getOwnPropertyDescriptor(globalThis, "speed"), before);
  const named = (name: string) => calls.filter((call) => call.startsWith(`${name}(`)).length;
  assert.equal(named("modulateScale"), 1);
  assert.equal(named("solid"), 7);
  assert.equal(named("osc"), 4);
  assert.equal(named("shape"), 2);
  assert.equal(named("src"), 1);
  assert.equal(named("out"), 1);
  assert.ok(calls.includes(`osc(fn:${(time / 16) * 1},fn:${(time / 1000) * 0.2})`));
  assert.ok(calls.includes("src(o0)"));
  assert.ok(calls.some((call) => call.includes("arr:0.7|0.6|0.4|0.6:speed=:smooth=:offset=")));

  calls.length = 0;
  synth.speed = 1;
  assert.throws(() => runVjSketch(synth, `${MULTIVERSE}\nnope().out()`, env), /nope/);
  assert.equal(synth.speed, 1);
  assert.deepEqual(calls, []);
});
