/**
 * Compact Hydra reference for the /art assist tutor.
 * Keep this short — it is injected into the Venice system prompt.
 */

export const hydraAssistDocs = `
# Hydra video synth — quick reference (hydra-synth)

Hydra is a livecoding language for WebGL visuals. Chains start with a SOURCE,
then GEOMETRY / COLOR / BLEND / MODULATE transforms, and end with .out() or render().

## Sources
- osc(frequency = 60, sync = 0.1, offset = 0)
- noise(scale = 10, offset = 0.1)
- shape(sides = 3, radius = 0.3, smoothing = 0.01)
- gradient(speed = 0)
- solid(r, g, b, a)
- voronoi(scale, speed, blending)
- src(input) — use buffers like o0/o1 or sources s0–s3

## Geometry
.rotate(angle, speed) .scale(size, xMult, yMult)
.pixelate(x, y) .repeat(x, y) .kaleid(n)
.scrollX(amount, speed) .scrollY(amount, speed)

## Color
.color(r, g, b) .invert(amount) .contrast(amount)
.brightness(amount) .saturate(amount) .hue(amount)

## Blending (combine colors)
.diff(texture) .add(texture, amount) .mult(texture, amount)
.blend(texture, amount) .mask(texture)

## Modulation (warp geometry using another texture)
.modulate(texture, amount)
.modulateRotate(texture, amount)
.modulateScale(texture, amount)
.modulateScrollX(texture, amount)

## Outputs
- .out() or .out(o0) — write to buffer (default o0)
- o0, o1, o2, o3 — four buffers
- render() — show all four; render(o1) — show one buffer
- Always end a visible chain with .out(...) or use render()

## Webcam
s0.initCam()
src(s0).out()
// transforms: src(s0).kaleid(4).out()

## Audio FFT (requires mic — toolbar "audio" on /art)
a.setBins(6)
a.show()
osc(10, 0, () => a.fft[0] * 4).out()
// a.fft[0] low band … higher indexes = higher frequencies
// a.setCutoff / a.setScale / a.setSmooth calibrate response

## External scripts
await loadScript("https://example.com/lib.js")
// must be top-level await (editor wraps sketches in async IIFE)
// then call functions the script registers (e.g. custom sources)

## Dynamic parameters
osc(() => 100 * Math.sin(time * 0.1)).out()
// global: time, mouse, width, height, bpm, speed, fps

## Feedback / self-modulate
osc(12).modulate(o0, 0.1).blend(o0, 0.7).out()

## Extensions
Unknown names like stereogram() are NOT core hydra-synth.
They require either:
1) await loadScript("https://…/extension.js") then call the API, or
2) setFunction({ name, type, inputs, glsl }) to define custom GLSL.
If a function is "not defined", say so clearly — do not invent fake built-ins.
Known community packs (examples):
- https://metagrowing.org/extra-shaders-for-hydra/lib-pattern.js (brick, spiral, …)
There is no standard published stereogram() in hydra-synth core.

## Common mistakes
1. Missing .out() / render() → nothing updates the screen
2. s0.initCam() alone → need src(s0).out()
3. Using a.fft before enabling mic (toolbar audio)
4. await outside async → editor handles this; still need await loadScript before using its APIs
5. Typo: .ou() instead of .out(); forgot parentheses on osc()
6. Custom lib not loaded → await loadScript(...) first

## Teaching style for the tutor
- Be concise and practical.
- When fixing code, explain the mistake in 1–3 short sentences.
- Always include a corrected complete sketch in a \`\`\`js fenced block when suggesting a fix.
- Prefer hydra-synth idioms that run in the browser editor.
`.trim();
