import assert from "node:assert/strict";
import test from "node:test";
import { checkVjSketch, vjQuickFix } from "./sketch.ts";

test("suggests the video chain when the editor is empty", () => {
  const fix = vjQuickFix({ code: "" });
  assert.equal(fix.fixedCode, "src(s0).out()");
  assert.equal(checkVjSketch(fix.fixedCode).ok, true);
});

test("appends .out() when a chain does not draw", () => {
  const fix = vjQuickFix({ code: "src(s0).kaleid(4)" });
  assert.equal(fix.fixedCode, "src(s0).kaleid(4).out()");
  assert.match(fix.tips[0] ?? "", /Nothing is drawn/);
  assert.equal(checkVjSketch(fix.fixedCode).ok, true);
});

test("drops initCam and keeps the video chain", () => {
  const fix = vjQuickFix({ code: "s0.initCam()\nsrc(s0).out()" });
  assert.equal(fix.fixedCode, "src(s0).out()");
  assert.match(fix.tips.join("\n"), /initCam/);
  assert.equal(checkVjSketch(fix.fixedCode).ok, true);
});

test("replaces a.fft with the intensity slider", () => {
  const fix = vjQuickFix({ code: "osc(() => a.fft[0] * 4).out()" });
  assert.equal(fix.fixedCode, "osc(() => intensity * 4).out()");
  assert.match(fix.tips.join("\n"), /microphone/);
  assert.equal(checkVjSketch(fix.fixedCode!).ok, true);
});

test("leaves a sketch alone when it already parses", () => {
  const code = "src(s0).modulate(noise(3, 0.1), intensity * 0.4).out()";
  const fix = vjQuickFix({ code });
  assert.equal(fix.fixedCode, undefined);
  assert.deepEqual(fix.tips, []);
});
