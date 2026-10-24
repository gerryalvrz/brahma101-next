/**
 * Experimental canvas take for /vj.
 * captureStream(30) + MediaRecorder. Prefers MP4/H.264, then WebM.
 * The blob is sniffed (and, in the browser, played for metadata) before download.
 * Recording does not touch the Hydra synth or the source video element.
 */

export const VJ_RECORD_SECONDS = 15;
export const VJ_RECORD_FPS = 30;
/** Two frames. MediaRecorder stops on the encoder clock, not a sample index. */
export const VJ_RECORD_DURATION_TOLERANCE_SEC = 2 / VJ_RECORD_FPS;
const VJ_RECORD_BITRATE = 8_000_000;

export const RECORDING_MIME_CANDIDATES = [
  { mimeType: "video/mp4;codecs=avc1.42E01E", format: "mp4" },
  { mimeType: "video/mp4;codecs=avc1.4D401E", format: "mp4" },
  { mimeType: "video/mp4;codecs=avc1.64001F", format: "mp4" },
  { mimeType: "video/mp4", format: "mp4" },
  { mimeType: "video/webm;codecs=vp9", format: "webm" },
  { mimeType: "video/webm;codecs=vp8", format: "webm" },
  { mimeType: "video/webm", format: "webm" },
] as const;

export type RecordingFormat = (typeof RECORDING_MIME_CANDIDATES)[number]["format"];

export type RecordingChoice = {
  mimeType: string;
  format: RecordingFormat;
};

export type RecordingProbe = {
  format: RecordingFormat | "unknown";
  width: number | null;
  height: number | null;
  durationSec: number | null;
};

export type RecordingCheck = {
  ok: boolean;
  summary: string;
  message: string;
};

export type RecordingResult = {
  blob: Blob;
  filename: string;
  summary: string;
  probe: RecordingProbe;
};

type CaptureSource = {
  captureStream: (frameRate: number) => {
    getTracks: () => { stop: () => void }[];
  };
};

type RecorderLike = {
  state: "inactive" | "recording" | "paused";
  mimeType: string;
  start: () => void;
  stop: () => void;
  ondataavailable: ((event: { data?: Blob }) => void) | null;
  onerror: ((event: { error?: DOMException }) => void) | null;
  onstop: (() => void) | null;
};

type PlaybackProbe = {
  width: number;
  height: number;
  durationSec: number;
};

const MP4_CONTAINERS = new Set([
  "moov",
  "trak",
  "mdia",
  "minf",
  "stbl",
  "edts",
  "mvex",
  "moof",
  "traf",
]);

const VISUAL_SAMPLE_ENTRIES = new Set([
  "avc1",
  "avc3",
  "hvc1",
  "hev1",
  "vp08",
  "vp09",
  "av01",
  "encv",
  "mp4v",
]);

const WEBM_CONTAINERS = new Set(["1a45dfa3", "18538067", "1549a966", "1654ae6b", "ae", "e0"]);

export function selectRecordingFormat(
  isTypeSupported: (mimeType: string) => boolean,
): RecordingChoice | null {
  for (const candidate of RECORDING_MIME_CANDIDATES) {
    if (isTypeSupported(candidate.mimeType)) {
      return { mimeType: candidate.mimeType, format: candidate.format };
    }
  }
  return null;
}

export function formatRecordClock(seconds: number) {
  const clamped = Math.min(VJ_RECORD_SECONDS, Math.max(0, seconds));
  const mins = Math.floor(clamped / 60);
  const whole = Math.floor(clamped - mins * 60);
  const tenth = Math.min(9, Math.floor((clamped - Math.floor(clamped)) * 10 + 1e-6));
  return `${String(mins).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${tenth}`;
}

export function recordingFilename(format: RecordingFormat, width: number, height: number) {
  return `vj-${width}x${height}-${VJ_RECORD_SECONDS}s.${format}`;
}

export function sniffContainer(bytes: Uint8Array): RecordingFormat | "unknown" {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "webm";
  }
  if (bytes.length >= 8) {
    const type = ascii(bytes, 4, 4);
    if (type === "ftyp" || type === "styp" || type === "moov") return "mp4";
  }
  return "unknown";
}

export function probeRecordingBytes(bytes: Uint8Array): RecordingProbe {
  const format = sniffContainer(bytes);
  if (format === "mp4") return { format, ...readMp4(bytes) };
  if (format === "webm") return { format, ...readWebm(bytes) };
  return { format, width: null, height: null, durationSec: null };
}

export function mergeProbe(parsed: RecordingProbe, playback: PlaybackProbe | null): RecordingProbe {
  return {
    format: parsed.format,
    width: preferMeasure(playback?.width, parsed.width),
    height: preferMeasure(playback?.height, parsed.height),
    durationSec: preferMeasure(playback?.durationSec, parsed.durationSec),
  };
}

export function describeRecordingCheck(
  probe: RecordingProbe,
  expected: { format: RecordingFormat; width: number; height: number; durationSec: number },
): RecordingCheck {
  const summary = formatProbe(probe);
  const wanted = `${expected.width}×${expected.height} · ${expected.durationSec.toFixed(3)}s · ${expected.format}`;
  const sizeOk =
    probe.width != null &&
    probe.height != null &&
    Math.abs(probe.width - expected.width) < 0.01 &&
    Math.abs(probe.height - expected.height) < 0.01;
  const durationOk =
    probe.durationSec != null &&
    Math.abs(probe.durationSec - expected.durationSec) <= VJ_RECORD_DURATION_TOLERANCE_SEC + 1e-6;
  const formatOk = probe.format === expected.format;
  const ok = sizeOk && durationOk && formatOk;
  return {
    ok,
    summary,
    message: ok
      ? `Recorded ${summary}.`
      : `Recording check failed. Expected ${wanted}. File is ${summary}.`,
  };
}

export function probePlayback(blob: Blob): Promise<PlaybackProbe | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    let settled = false;
    const finish = (value: PlaybackProbe | null) => {
      if (settled) return;
      settled = true;
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), 3000);
    video.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const durationSec = video.duration;
      if (!Number.isFinite(durationSec) || durationSec <= 0 || video.videoWidth <= 0) {
        finish(null);
        return;
      }
      finish({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSec,
      });
    };
    video.onerror = () => {
      window.clearTimeout(timer);
      finish(null);
    };
    video.src = url;
  });
}

export function downloadRecording(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

type StartRecordingOptions = {
  canvas: CaptureSource;
  width: number;
  height: number;
  seconds?: number;
  fps?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
  isTypeSupported?: (mimeType: string) => boolean;
  createRecorder?: (stream: { getTracks: () => { stop: () => void }[] }, mimeType: string) => RecorderLike;
  readPlayback?: (blob: Blob) => Promise<PlaybackProbe | null>;
  onFinishing?: () => void;
  onComplete: (result: RecordingResult) => void;
  onError: (message: string) => void;
  onAbort?: () => void;
};

export function startCanvasRecording(options: StartRecordingOptions) {
  const seconds = options.seconds ?? VJ_RECORD_SECONDS;
  const fps = options.fps ?? VJ_RECORD_FPS;
  const now = options.now ?? (() => performance.now());
  const setTimer = options.setTimer ?? ((fn, ms) => window.setTimeout(fn, ms));
  const clearTimer = options.clearTimer ?? ((id) => window.clearTimeout(id));
  const isTypeSupported =
    options.isTypeSupported ??
    ((mimeType: string) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType));
  const readPlayback = options.readPlayback ?? probePlayback;

  const choice = selectRecordingFormat(isTypeSupported);
  if (!choice) {
    options.onError("This browser cannot record MP4 or WebM from the canvas.");
    return null;
  }
  if (typeof options.canvas.captureStream !== "function") {
    options.onError("This browser cannot capture the canvas.");
    return null;
  }

  let stream: { getTracks: () => { stop: () => void }[] };
  try {
    stream = options.canvas.captureStream(fps);
  } catch (error) {
    options.onError(error instanceof Error ? error.message : "Could not capture the canvas.");
    return null;
  }

  const createRecorder =
    options.createRecorder ??
    ((captured, mimeType) => {
      const media = captured as MediaStream;
      try {
        return new MediaRecorder(media, {
          mimeType,
          videoBitsPerSecond: VJ_RECORD_BITRATE,
        }) as RecorderLike;
      } catch {
        return new MediaRecorder(media, { mimeType }) as RecorderLike;
      }
    });

  let recorder: RecorderLike;
  try {
    recorder = createRecorder(stream, choice.mimeType);
  } catch (error) {
    stopTracks(stream);
    options.onError(error instanceof Error ? error.message : "Could not start the recorder.");
    return null;
  }

  const chunks: Blob[] = [];
  let mode: "open" | "keep" | "drop" = "open";
  let released = false;
  let timer: number | null = null;

  const release = () => {
    if (released) return;
    released = true;
    if (timer != null) clearTimer(timer);
    timer = null;
    stopTracks(stream);
    recorder.ondataavailable = null;
    recorder.onerror = null;
    recorder.onstop = null;
  };

  const halt = () => {
    if (recorder.state === "recording") {
      try {
        recorder.stop();
        return;
      } catch {
        /* fall through and release */
      }
    }
    release();
    if (mode === "drop") options.onAbort?.();
    else options.onError("Recording stopped before any video was captured.");
  };

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };
  recorder.onerror = () => {
    mode = "drop";
    release();
    options.onError("The recorder failed.");
  };
  recorder.onstop = () => {
    const dropped = mode === "drop";
    release();
    if (dropped) {
      options.onAbort?.();
      return;
    }
    const blob = new Blob(chunks, { type: recorder.mimeType || choice.mimeType });
    void settleRecording(blob, choice.format, options.width, options.height, seconds, readPlayback)
      .then((result) => {
        if (result.ok) options.onComplete(result.value);
        else options.onError(result.message);
      })
      .catch((error: unknown) => {
        options.onError(error instanceof Error ? error.message : "Could not read the recording.");
      });
  };

  try {
    recorder.start();
  } catch (error) {
    mode = "drop";
    release();
    options.onError(error instanceof Error ? error.message : "Could not start the recorder.");
    return null;
  }

  const started = now();
  timer = setTimer(() => {
    if (mode !== "open") return;
    mode = "keep";
    options.onFinishing?.();
    halt();
  }, Math.max(0, Math.round(seconds * 1000 - (now() - started))));

  return {
    stop() {
      if (mode !== "open") return;
      mode = "drop";
      halt();
    },
  };
}

async function settleRecording(
  blob: Blob,
  format: RecordingFormat,
  width: number,
  height: number,
  durationSec: number,
  readPlayback: (blob: Blob) => Promise<PlaybackProbe | null>,
): Promise<{ ok: true; value: RecordingResult } | { ok: false; message: string }> {
  if (blob.size === 0) return { ok: false, message: "Recording was empty." };
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const parsed = probeRecordingBytes(bytes);
  const playback = await readPlayback(blob);
  const probe = mergeProbe(parsed, playback);
  const check = describeRecordingCheck(probe, { format, width, height, durationSec });
  if (!check.ok) return { ok: false, message: check.message };
  return {
    ok: true,
    value: {
      blob,
      filename: recordingFilename(format, width, height),
      summary: check.message,
      probe,
    },
  };
}

function preferMeasure(playback: number | undefined, parsed: number | null) {
  if (playback != null && Number.isFinite(playback) && playback > 0) return playback;
  if (parsed != null && Number.isFinite(parsed) && parsed > 0) return parsed;
  return null;
}

function formatProbe(probe: RecordingProbe) {
  const width = probe.width == null ? "unknown size" : `${Math.round(probe.width)}×${probe.height == null ? "?" : Math.round(probe.height)}`;
  const duration = probe.durationSec == null ? "unknown duration" : `${probe.durationSec.toFixed(3)}s`;
  const format = probe.format === "unknown" ? "unknown format" : probe.format;
  return `${width} · ${duration} · ${format}`;
}

function stopTracks(stream: { getTracks: () => { stop: () => void }[] }) {
  for (const track of stream.getTracks()) track.stop();
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  let text = "";
  for (let i = 0; i < length; i += 1) text += String.fromCharCode(bytes[offset + i] ?? 0);
  return text;
}

function viewOf(bytes: Uint8Array) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function u16(bytes: Uint8Array, offset: number) {
  return viewOf(bytes).getUint16(offset);
}

function u32(bytes: Uint8Array, offset: number) {
  return viewOf(bytes).getUint32(offset);
}

function u64(bytes: Uint8Array, offset: number) {
  const high = u32(bytes, offset);
  const low = u32(bytes, offset + 4);
  return high * 2 ** 32 + low;
}

type Box = { type: string; dataStart: number; dataEnd: number };

function* boxes(bytes: Uint8Array, start: number, end: number): Generator<Box> {
  let offset = start;
  while (offset + 8 <= end) {
    let size = u32(bytes, offset);
    const type = ascii(bytes, offset + 4, 4);
    let header = 8;
    if (size === 1) {
      if (offset + 16 > end) return;
      size = u64(bytes, offset + 8);
      header = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < header || offset + size > end) return;
    yield { type, dataStart: offset + header, dataEnd: offset + size };
    offset += size;
  }
}

function readMp4(bytes: Uint8Array) {
  let width: number | null = null;
  let height: number | null = null;
  let movieScale = 0;
  let movieDuration = 0;
  let mediaScale = 0;
  let fragmentEnd = 0;

  const visit = (start: number, end: number) => {
    for (const box of boxes(bytes, start, end)) {
      if (box.type === "mvhd") {
        const header = readFullBoxTime(bytes, box.dataStart, box.dataEnd);
        if (header) {
          movieScale = header.timescale;
          movieDuration = header.duration;
        }
      } else if (box.type === "mdhd") {
        const header = readFullBoxTime(bytes, box.dataStart, box.dataEnd);
        if (header && header.timescale > 0) mediaScale = header.timescale;
      } else if (box.type === "tkhd") {
        const sample = readTkhdSize(bytes, box.dataStart, box.dataEnd);
        if (sample && (width == null || height == null)) {
          width = sample.width;
          height = sample.height;
        }
      } else if (VISUAL_SAMPLE_ENTRIES.has(box.type) && (width == null || height == null)) {
        const sample = readVisualSize(bytes, box.dataStart, box.dataEnd);
        if (sample) {
          width = sample.width;
          height = sample.height;
        }
      } else if (box.type === "stsd") {
        visit(box.dataStart + 8, box.dataEnd);
      } else if (box.type === "traf") {
        const end = readFragmentEnd(bytes, box.dataStart, box.dataEnd);
        if (end != null) fragmentEnd = Math.max(fragmentEnd, end);
      } else if (MP4_CONTAINERS.has(box.type)) {
        visit(box.dataStart, box.dataEnd);
      }
    }
  };

  visit(0, bytes.length);
  const scale = mediaScale || movieScale;
  let durationSec: number | null = null;
  if (fragmentEnd > 0 && scale > 0 && movieDuration === 0) durationSec = fragmentEnd / scale;
  else if (movieDuration > 0 && movieScale > 0) durationSec = movieDuration / movieScale;
  return { width, height, durationSec };
}

function readFullBoxTime(bytes: Uint8Array, start: number, end: number) {
  if (end - start < 16) return null;
  const version = bytes[start] ?? 0;
  if (version === 1) {
    if (end - start < 28) return null;
    return { timescale: u32(bytes, start + 20), duration: u64(bytes, start + 24) };
  }
  return { timescale: u32(bytes, start + 12), duration: u32(bytes, start + 16) };
}

function readTkhdSize(bytes: Uint8Array, start: number, end: number) {
  if (end - start < 8) return null;
  const width = u32(bytes, end - 8) / 65536;
  const height = u32(bytes, end - 4) / 65536;
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function readVisualSize(bytes: Uint8Array, start: number, end: number) {
  if (end - start < 28) return null;
  const width = u16(bytes, start + 24);
  const height = u16(bytes, start + 26);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

function readFragmentEnd(bytes: Uint8Array, start: number, end: number) {
  let defaultDuration = 0;
  let base = 0;
  let sum = 0;
  let sawSample = false;
  for (const box of boxes(bytes, start, end)) {
    if (box.type === "tfhd") {
      const duration = readTfhdDefaultDuration(bytes, box.dataStart, box.dataEnd);
      if (duration != null) defaultDuration = duration;
    } else if (box.type === "tfdt") {
      const time = readTfdt(bytes, box.dataStart, box.dataEnd);
      if (time != null) base = time;
    } else if (box.type === "trun") {
      const samples = readTrunDuration(bytes, box.dataStart, box.dataEnd, defaultDuration);
      if (samples != null) {
        sum += samples;
        sawSample = true;
      }
    }
  }
  if (!sawSample) return null;
  return base + sum;
}

function readTfhdDefaultDuration(bytes: Uint8Array, start: number, end: number) {
  if (end - start < 8) return null;
  const flags = u32(bytes, start) & 0xffffff;
  let cursor = start + 8;
  if (flags & 0x000001) cursor += 8;
  if (flags & 0x000002) cursor += 4;
  if ((flags & 0x000008) === 0 || cursor + 4 > end) return null;
  return u32(bytes, cursor);
}

function readTfdt(bytes: Uint8Array, start: number, end: number) {
  if (end - start < 8) return null;
  const version = bytes[start] ?? 0;
  if (version === 1) {
    if (end - start < 12) return null;
    return u64(bytes, start + 4);
  }
  return u32(bytes, start + 4);
}

function readTrunDuration(bytes: Uint8Array, start: number, end: number, defaultDuration: number) {
  if (end - start < 8) return null;
  const flags = u32(bytes, start) & 0xffffff;
  const count = u32(bytes, start + 4);
  if ((flags & 0x000100) === 0) {
    if (defaultDuration <= 0) return null;
    return count * defaultDuration;
  }
  let cursor = start + 8;
  if (flags & 0x000001) cursor += 4;
  if (flags & 0x000004) cursor += 4;
  let entry = 4;
  if (flags & 0x000200) entry += 4;
  if (flags & 0x000400) entry += 4;
  if (flags & 0x000800) entry += 4;
  let sum = 0;
  for (let index = 0; index < count; index += 1) {
    if (cursor + 4 > end) return null;
    sum += u32(bytes, cursor);
    cursor += entry;
  }
  return sum;
}

function readWebm(bytes: Uint8Array) {
  let scale = 1_000_000;
  let duration: number | null = null;
  let width: number | null = null;
  let height: number | null = null;

  const walk = (start: number, end: number) => {
    let offset = start;
    while (offset + 2 <= end) {
      const id = readVint(bytes, offset, true);
      if (!id) return;
      const size = readVint(bytes, offset + id.length, false);
      if (!size) return;
      const dataStart = offset + id.length + size.length;
      const dataEnd = size.value < 0 ? end : dataStart + size.value;
      if (dataEnd > end || dataEnd < dataStart) return;
      const hex = hexOf(bytes, offset, id.length);
      if (hex === "4489") duration = readEbmlFloat(bytes, dataStart, dataEnd - dataStart);
      else if (hex === "2ad7b1") scale = readEbmlUint(bytes, dataStart, dataEnd - dataStart);
      else if (hex === "b0" && width == null) width = readEbmlUint(bytes, dataStart, dataEnd - dataStart);
      else if (hex === "ba" && height == null) height = readEbmlUint(bytes, dataStart, dataEnd - dataStart);
      else if (WEBM_CONTAINERS.has(hex)) walk(dataStart, dataEnd);
      offset = dataEnd;
    }
  };

  walk(0, bytes.length);
  const durationSec = duration == null ? null : (duration * scale) / 1e9;
  return { width, height, durationSec: durationSec != null && durationSec > 0 ? durationSec : null };
}

function readVint(bytes: Uint8Array, offset: number, keepMarker: boolean) {
  if (offset >= bytes.length) return null;
  const first = bytes[offset] ?? 0;
  if (first === 0) return null;
  let length = 1;
  let marker = 0x80;
  while (length <= 8 && (first & marker) === 0) {
    length += 1;
    marker >>= 1;
  }
  if (marker === 0 || offset + length > bytes.length) return null;
  let value = keepMarker ? first : first & (marker - 1);
  for (let index = 1; index < length; index += 1) {
    value = value * 256 + (bytes[offset + index] ?? 0);
  }
  if (!keepMarker) {
    const unknown = 2 ** (7 * length) - 1;
    if (value === unknown) return { value: -1, length };
  }
  return { value, length };
}

function readEbmlUint(bytes: Uint8Array, start: number, size: number) {
  let value = 0;
  for (let index = 0; index < size; index += 1) value = value * 256 + (bytes[start + index] ?? 0);
  return value;
}

function readEbmlFloat(bytes: Uint8Array, start: number, size: number) {
  if (size === 4) return viewOf(bytes).getFloat32(start);
  if (size === 8) return viewOf(bytes).getFloat64(start);
  return null;
}

function hexOf(bytes: Uint8Array, offset: number, length: number) {
  let hex = "";
  for (let index = 0; index < length; index += 1) {
    hex += (bytes[offset + index] ?? 0).toString(16).padStart(2, "0");
  }
  return hex;
}
