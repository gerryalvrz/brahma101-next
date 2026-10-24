import assert from "node:assert/strict";
import test from "node:test";
import {
  VJ_RECORD_DURATION_TOLERANCE_SEC,
  VJ_RECORD_FPS,
  VJ_RECORD_SECONDS,
  describeRecordingCheck,
  formatRecordClock,
  probeRecordingBytes,
  recordingFilename,
  selectRecordingFormat,
  startCanvasRecording,
  type RecordingResult,
} from "./record.ts";

function concat(...parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function box(type: string, payload: Uint8Array) {
  const out = new Uint8Array(8 + payload.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, out.length);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(payload, 8);
  return out;
}

function mvhd(timescale: number, duration: number) {
  const payload = new Uint8Array(32);
  const view = new DataView(payload.buffer);
  view.setUint32(12, timescale);
  view.setUint32(16, duration);
  return box("mvhd", payload);
}

function mdhd(timescale: number, duration: number) {
  const payload = new Uint8Array(24);
  const view = new DataView(payload.buffer);
  view.setUint32(12, timescale);
  view.setUint32(16, duration);
  return box("mdhd", payload);
}

function tkhd(width: number, height: number) {
  const payload = new Uint8Array(84);
  const view = new DataView(payload.buffer);
  view.setUint32(76, width * 65536);
  view.setUint32(80, height * 65536);
  return box("tkhd", payload);
}

function mp4Take(width: number, height: number, timescale: number, duration: number) {
  const moov = box(
    "moov",
    concat(mvhd(timescale, duration), box("trak", tkhd(width, height))),
  );
  return concat(box("ftyp", new Uint8Array([0x69, 0x73, 0x6f, 0x6d])), moov);
}

function fragmentedMp4() {
  const moov = box(
    "moov",
    concat(
      mvhd(30, 0),
      box("trak", concat(tkhd(1920, 540), box("mdia", mdhd(30, 0)))),
    ),
  );
  const tfhd = new Uint8Array(12);
  const tfhdView = new DataView(tfhd.buffer);
  tfhdView.setUint32(0, 0x000008);
  tfhdView.setUint32(4, 1);
  tfhdView.setUint32(8, 1);
  const tfdt = new Uint8Array(8);
  new DataView(tfdt.buffer).setUint32(4, 0);
  const trun = new Uint8Array(8);
  new DataView(trun.buffer).setUint32(4, 450);
  const moof = box("moof", box("traf", concat(box("tfhd", tfhd), box("tfdt", tfdt), box("trun", trun))));
  return concat(box("ftyp", new Uint8Array([0x69, 0x73, 0x6f, 0x6d])), moov, moof);
}

function vintSize(length: number) {
  return new Uint8Array([0x80 | length]);
}

function element(id: number[], data: Uint8Array) {
  return concat(new Uint8Array(id), vintSize(data.length), data);
}

function uintBytes(value: number, width: number) {
  const out = new Uint8Array(width);
  let rest = value;
  for (let index = width - 1; index >= 0; index -= 1) {
    out[index] = rest & 0xff;
    rest = Math.floor(rest / 256);
  }
  return out;
}

function float64(value: number) {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setFloat64(0, value);
  return out;
}

function webmTake() {
  const info = element(
    [0x15, 0x49, 0xa9, 0x66],
    concat(
      element([0x2a, 0xd7, 0xb1], uintBytes(1_000_000, 3)),
      element([0x44, 0x89], float64(15_000)),
    ),
  );
  const video = element(
    [0xe0],
    concat(element([0xb0], uintBytes(1920, 2)), element([0xba], uintBytes(540, 2))),
  );
  const tracks = element([0x16, 0x54, 0xae, 0x6b], element([0xae], video));
  const segment = element([0x18, 0x53, 0x80, 0x67], concat(info, tracks));
  return concat(element([0x1a, 0x45, 0xdf, 0xa3], new Uint8Array(0)), segment);
}

test("prefers MP4 H.264 and falls back to WebM", () => {
  const both = selectRecordingFormat(() => true);
  assert.equal(both?.mimeType, "video/mp4;codecs=avc1.42E01E");
  assert.equal(both?.format, "mp4");

  const webm = selectRecordingFormat((mime) => mime === "video/webm;codecs=vp9");
  assert.equal(webm?.format, "webm");
  assert.equal(webm?.mimeType, "video/webm;codecs=vp9");

  assert.equal(selectRecordingFormat(() => false), null);
});

test("formats the visible counter up to 15.0 seconds", () => {
  assert.equal(VJ_RECORD_SECONDS, 15);
  assert.equal(VJ_RECORD_FPS, 30);
  assert.equal(formatRecordClock(0), "00:00.0");
  assert.equal(formatRecordClock(12.46), "00:12.4");
  assert.equal(formatRecordClock(15), "00:15.0");
  assert.equal(formatRecordClock(40), "00:15.0");
});

test("reads resolution, duration, and container from MP4 and WebM bytes", () => {
  const mp4 = probeRecordingBytes(mp4Take(1920, 540, 1000, 15_000));
  assert.equal(mp4.format, "mp4");
  assert.equal(mp4.width, 1920);
  assert.equal(mp4.height, 540);
  assert.equal(mp4.durationSec, 15);

  const fragmented = probeRecordingBytes(fragmentedMp4());
  assert.equal(fragmented.format, "mp4");
  assert.equal(fragmented.width, 1920);
  assert.equal(fragmented.height, 540);
  assert.equal(fragmented.durationSec, 15);

  const webm = probeRecordingBytes(webmTake());
  assert.equal(webm.format, "webm");
  assert.equal(webm.width, 1920);
  assert.equal(webm.height, 540);
  assert.equal(webm.durationSec, 15);

  const wrong = probeRecordingBytes(mp4Take(1280, 720, 1000, 15_000));
  const check = describeRecordingCheck(wrong, {
    format: "mp4",
    width: 1920,
    height: 540,
    durationSec: 15,
  });
  assert.equal(check.ok, false);
  assert.match(check.message, /1280×720/);
  assert.match(check.message, /15\.000s/);
  assert.match(check.message, /mp4/);
});

test("accepts duration within two frames and rejects a container mismatch", () => {
  const inside = describeRecordingCheck(
    { format: "mp4", width: 1920, height: 540, durationSec: 15 + VJ_RECORD_DURATION_TOLERANCE_SEC },
    { format: "mp4", width: 1920, height: 540, durationSec: 15 },
  );
  assert.equal(inside.ok, true);

  const outside = describeRecordingCheck(
    { format: "webm", width: 1920, height: 540, durationSec: 15 },
    { format: "mp4", width: 1920, height: 540, durationSec: 15 },
  );
  assert.equal(outside.ok, false);
  assert.match(outside.message, /webm/);
});

type FakeSession = {
  stop: () => void;
  fire: () => void;
  events: string[];
};

function fakeSession(bytes: Uint8Array, supported: (mime: string) => boolean) {
  const events: string[] = [];
  let fire = () => {};
  const canvas = {
    hush() {
      events.push("hush");
    },
    load() {
      events.push("load");
    },
    captureStream(frameRate: number) {
      events.push(`capture:${frameRate}`);
      return {
        getTracks: () => [
          {
            stop() {
              events.push("track");
            },
          },
        ],
      };
    },
  };
  let scheduled: (() => void) | null = null;
  let delay = -1;
  const result = new Promise<RecordingResult>((resolve, reject) => {
    const handle = startCanvasRecording({
      canvas,
      width: 1920,
      height: 540,
      now: () => 5_000,
      setTimer(fn, ms) {
        scheduled = fn;
        delay = ms;
        return 7;
      },
      clearTimer() {
        events.push("clear-timer");
      },
      isTypeSupported: supported,
      createRecorder(_stream, mimeType) {
        events.push(`recorder:${mimeType}`);
        return {
          state: "inactive",
          mimeType,
          start() {
            this.state = "recording";
          },
          stop() {
            this.state = "inactive";
            this.ondataavailable?.({ data: new Blob([bytes], { type: mimeType }) });
            this.onstop?.();
          },
          ondataavailable: null,
          onerror: null,
          onstop: null,
        };
      },
      readPlayback: async () => null,
      onComplete: resolve,
      onError: (message) => reject(new Error(message)),
    });
    fire = () => {
      events.push(`delay:${delay}`);
      scheduled?.();
    };
    events.push(handle ? "armed" : "missing");
    Object.assign(events, { handle });
  });
  return {
    stop: () => {
      const handle = (events as { handle?: { stop: () => void } }).handle;
      handle?.stop();
    },
    fire,
    events,
    result,
  } satisfies FakeSession & { result: Promise<RecordingResult> };
}

test("records 15s at 30 fps and downloads only a checked MP4", async () => {
  const session = fakeSession(mp4Take(1920, 540, 1000, 15_000), (mime) => mime.startsWith("video/mp4"));
  session.fire();
  const result = await session.result;
  assert.equal(result.filename, recordingFilename("mp4", 1920, 540));
  assert.equal(result.probe.format, "mp4");
  assert.equal(result.probe.width, 1920);
  assert.equal(result.probe.height, 540);
  assert.equal(result.probe.durationSec, 15);
  assert.match(result.summary, /1920×540/);
  assert.match(result.summary, /15\.000s/);
  assert.match(result.summary, /mp4/);
  assert.deepEqual(session.events.filter((event) => event !== "clear-timer" && event !== "armed"), [
    "capture:30",
    "recorder:video/mp4;codecs=avc1.42E01E",
    "delay:15000",
    "track",
  ]);
});

test("uses WebM bytes when H.264 is unavailable", async () => {
  const session = fakeSession(webmTake(), (mime) => mime === "video/webm;codecs=vp8");
  session.fire();
  const result = await session.result;
  assert.equal(result.filename, "vj-1920x540-15s.webm");
  assert.equal(result.probe.format, "webm");
  assert.ok(session.events.includes("recorder:video/webm;codecs=vp8"));
});

test("rejects a file whose bytes are not the selected container", async () => {
  const session = fakeSession(webmTake(), (mime) => mime.startsWith("video/mp4"));
  session.fire();
  await assert.rejects(session.result, /Expected 1920×540 · 15\.000s · mp4/);
  await assert.rejects(session.result, /webm/);
});

test("prefers playback metadata over a mismatched header", async () => {
  const events: string[] = [];
  const result = new Promise<RecordingResult>((resolve, reject) => {
    let scheduled: (() => void) | null = null;
    startCanvasRecording({
      canvas: {
        captureStream() {
          return { getTracks: () => [{ stop() {} }] };
        },
      },
      width: 1920,
      height: 540,
      now: () => 0,
      setTimer(fn) {
        scheduled = fn;
        return 1;
      },
      clearTimer() {},
      isTypeSupported: (mime) => mime.startsWith("video/mp4"),
      createRecorder(_stream, mimeType) {
        return {
          state: "inactive",
          mimeType,
          start() {
            this.state = "recording";
          },
          stop() {
            this.state = "inactive";
            this.ondataavailable?.({ data: new Blob([mp4Take(1920, 540, 1000, 15_000)]) });
            this.onstop?.();
          },
          ondataavailable: null,
          onerror: null,
          onstop: null,
        };
      },
      readPlayback: async () => ({ width: 1920, height: 540, durationSec: 10 }),
      onComplete: resolve,
      onError: (message) => reject(new Error(message)),
    });
    events.push("started");
    scheduled?.();
  });
  await assert.rejects(result, /10\.000s/);
  assert.deepEqual(events, ["started"]);
});

test("stop discards the take and does not restart a shader hook", async () => {
  let completed = false;
  let aborted = false;
  const events: string[] = [];
  const handle = startCanvasRecording({
    canvas: {
      hush() {
        events.push("hush");
      },
      captureStream() {
        events.push("capture");
        return {
          getTracks: () => [
            {
              stop() {
                events.push("track");
              },
            },
          ],
        };
      },
    },
    width: 1920,
    height: 540,
    now: () => 0,
    setTimer() {
      return 1;
    },
    clearTimer() {
      events.push("clear-timer");
    },
    isTypeSupported: () => true,
    createRecorder() {
      return {
        state: "inactive",
        mimeType: "video/mp4",
        start() {
          this.state = "recording";
        },
        stop() {
          this.state = "inactive";
          this.ondataavailable?.({ data: new Blob([mp4Take(1920, 540, 1000, 15_000)]) });
          this.onstop?.();
        },
        ondataavailable: null,
        onerror: null,
        onstop: null,
      };
    },
    readPlayback: async () => null,
    onComplete() {
      completed = true;
    },
    onError() {
      completed = true;
    },
    onAbort() {
      aborted = true;
    },
  });
  handle?.stop();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(completed, false);
  assert.equal(aborted, true);
  assert.deepEqual(events, ["capture", "clear-timer", "track"]);
});
