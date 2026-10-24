"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import HydraAssistChat from "@/components/art/HydraAssistChat";
import ParamDashboard from "@/components/livecoding/ParamDashboard";
import { hydraParamCatalog } from "@/lib/livecoding/hydra-params";
import {
  vjPresets,
  VJ_PREVIEW_HEIGHT,
  VJ_PREVIEW_WIDTH,
  type VjHydra,
  type VjPresetId,
} from "@/lib/vj/presets";
import {
  downloadRecording,
  formatRecordClock,
  selectRecordingFormat,
  startCanvasRecording,
  VJ_RECORD_FPS,
  VJ_RECORD_SECONDS,
} from "@/lib/vj/record";
import { vjQuickFix } from "@/lib/vj/quick-fix";
import { runVjSketch } from "@/lib/vj/sketch";
import {
  deleteVjSketch,
  readVjSketches,
  saveVjSketch,
  type VjStoredSketch,
} from "@/lib/vj/sketches";
import styles from "./VjStudio.module.css";

function isLocalVideo(file: File) {
  if (file.type === "video/mp4" || file.type === "video/webm") return true;
  return /\.(mp4|webm)$/i.test(file.name);
}

export default function VjStudio() {
  const initialCode: string = vjPresets[0].code;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hydraRef = useRef<VjHydra | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const intensityRef = useRef(0.55);
  const codeRef = useRef(initialCode);
  const runTimer = useRef<number | null>(null);
  const aliveRef = useRef(true);
  const recordingSession = useRef<{ stop: () => void } | null>(null);
  const recordStarted = useRef<number | null>(null);
  const recordSealed = useRef(false);

  const [ready, setReady] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [intensity, setIntensity] = useState(0.55);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sketchName, setSketchName] = useState("");
  const [sketches, setSketches] = useState<VjStoredSketch[]>([]);
  const [selectedSketchId, setSelectedSketchId] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordLocked, setRecordLocked] = useState(false);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [recordLabel, setRecordLabel] = useState<string | null>(null);

  const activePreset =
    vjPresets.find((item) => item.code === code)?.id ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;

    aliveRef.current = true;
    let cancelled = false;
    let raf = 0;

    canvas.width = VJ_PREVIEW_WIDTH;
    canvas.height = VJ_PREVIEW_HEIGHT;

    void import("hydra-synth").then(({ default: HydraCtor }) => {
      if (cancelled || !canvasRef.current) return;

      const hydra = new HydraCtor({
        canvas: canvasRef.current,
        width: VJ_PREVIEW_WIDTH,
        height: VJ_PREVIEW_HEIGHT,
        makeGlobal: false,
        detectAudio: false,
        enableStreamCapture: false,
        autoLoop: false,
      }) as unknown as VjHydra;

      hydra.setResolution(VJ_PREVIEW_WIDTH, VJ_PREVIEW_HEIGHT);
      hydraRef.current = hydra;

      try {
        runVjSketch(hydra.synth, codeRef.current, {
          intensity: () => intensityRef.current,
          time: () => hydra.synth.time,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not start the shader");
        }
      }

      let last = performance.now();
      const frame = (now: number) => {
        if (cancelled) return;
        try {
          hydra.tick(now - last);
        } catch (e) {
          console.warn("vj tick", e);
        }
        last = now;
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      aliveRef.current = false;
      recordingSession.current?.stop();
      recordingSession.current = null;
      cancelAnimationFrame(raf);

      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      try {
        hydraRef.current?.hush();
      } catch {
        /* teardown race */
      }
      hydraRef.current = null;
      if (runTimer.current) window.clearTimeout(runTimer.current);
    };
  }, []);

  useEffect(() => {
    setSketches(readVjSketches());
  }, []);

  useEffect(() => {
    if (!ready) return;
    const choice = selectRecordingFormat((mimeType) => {
      try {
        return typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType);
      } catch {
        return false;
      }
    });
    setRecordLabel(choice ? choice.format.toUpperCase() : null);
  }, [ready]);

  useEffect(() => {
    if (!recording) return;
    let raf = 0;
    const frame = () => {
      const started = recordStarted.current;
      if (started != null && !recordSealed.current) {
        setRecordElapsed(Math.min(VJ_RECORD_SECONDS, (performance.now() - started) / 1000));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [recording]);

  function runCode(source: string) {
    const hydra = hydraRef.current;
    if (!hydra || !aliveRef.current) return false;
    try {
      runVjSketch(hydra.synth, source, {
        intensity: () => intensityRef.current,
        time: () => hydra.synth.time,
      });
      setError(null);
      setStatus(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not run sketch");
      return false;
    }
  }

  function runNow(source = codeRef.current) {
    if (runTimer.current) {
      window.clearTimeout(runTimer.current);
      runTimer.current = null;
    }
    return runCode(source);
  }

  function selectPreset(id: VjPresetId) {
    const item = vjPresets.find((preset) => preset.id === id);
    if (!item) return;
    codeRef.current = item.code;
    setCode(item.code);
    runNow(item.code);
  }

  function onCode(event: ChangeEvent<HTMLTextAreaElement>) {
    codeRef.current = event.target.value;
    setCode(event.target.value);
  }

  function onEditorKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runNow();
    }
  }

  function onParams(next: string) {
    codeRef.current = next;
    setCode(next);
    if (runTimer.current) window.clearTimeout(runTimer.current);
    runTimer.current = window.setTimeout(() => runCode(next), 90);
  }

  function onSave() {
    try {
      const next = saveVjSketch(sketchName, codeRef.current, sketches);
      setSketches(next);
      const saved = next.find(
        (sketch) => sketch.name.toLowerCase() === sketchName.trim().toLowerCase(),
      );
      if (saved) setSelectedSketchId(saved.id);
      setStatus(`Saved “${sketchName.trim()}”.`);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save sketch");
    }
  }

  function onLoadSketch() {
    const sketch = sketches.find((item) => item.id === selectedSketchId);
    if (!sketch) return;
    codeRef.current = sketch.code;
    setCode(sketch.code);
    setSketchName(sketch.name);
    const loaded = runNow(sketch.code);
    if (loaded) setStatus(`Loaded “${sketch.name}”.`);
  }

  function onDeleteSketch() {
    if (!selectedSketchId) return;
    try {
      const next = deleteVjSketch(selectedSketchId, sketches);
      setSketches(next);
      setSelectedSketchId("");
      setStatus("Deleted saved sketch.");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete sketch");
    }
  }

  function onIntensity(event: ChangeEvent<HTMLInputElement>) {
    const value = Number(event.target.value);
    intensityRef.current = value;
    setIntensity(value);
  }

  async function loadVideo(file: File) {
    const video = videoRef.current;
    const hydra = hydraRef.current;
    if (!video || !hydra) return;

    if (!isLocalVideo(file)) {
      setError("Use an MP4 or WebM file.");
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setError(null);
    setFileName(file.name);

    video.pause();
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.src = url;

    try {
      await new Promise<void>((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error("Could not read that video."));
        };
        const cleanup = () => {
          video.removeEventListener("loadeddata", onReady);
          video.removeEventListener("error", onError);
        };
        video.addEventListener("loadeddata", onReady);
        video.addEventListener("error", onError);
      });

      if (!aliveRef.current || hydraRef.current !== hydra) {
        URL.revokeObjectURL(url);
        if (objectUrlRef.current === url) objectUrlRef.current = null;
        return;
      }

      await video.play();
      hydra.synth.s0.init({ src: video, dynamic: true });
      runNow(codeRef.current);
      setHasVideo(true);
      setPlaying(true);
    } catch (e) {
      if (objectUrlRef.current === url) {
        URL.revokeObjectURL(url);
        objectUrlRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
      setHasVideo(false);
      setPlaying(false);
      setError(e instanceof Error ? e.message : "Could not play that video.");
    }
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void loadVideo(file);
  }

  function onRecord() {
    const canvas = canvasRef.current;
    if (!canvas || !ready || recordingSession.current) return;
    setError(null);
    setStatus(null);
    recordSealed.current = false;
    recordStarted.current = performance.now();
    setRecordLocked(false);
    setRecordElapsed(0);
    setRecording(true);
    const session = startCanvasRecording({
      canvas,
      width: VJ_PREVIEW_WIDTH,
      height: VJ_PREVIEW_HEIGHT,
      onFinishing() {
        recordSealed.current = true;
        if (!aliveRef.current) return;
        setRecordLocked(true);
        setRecordElapsed(VJ_RECORD_SECONDS);
      },
      onComplete(result) {
        recordingSession.current = null;
        recordStarted.current = null;
        recordSealed.current = false;
        if (!aliveRef.current) return;
        setRecording(false);
        setRecordLocked(false);
        setRecordElapsed(VJ_RECORD_SECONDS);
        downloadRecording(result.blob, result.filename);
        setStatus(result.summary);
        setError(null);
      },
      onError(message) {
        recordingSession.current = null;
        recordStarted.current = null;
        recordSealed.current = false;
        if (!aliveRef.current) return;
        setRecording(false);
        setRecordLocked(false);
        setRecordElapsed(0);
        setError(message);
      },
      onAbort() {
        recordingSession.current = null;
        recordStarted.current = null;
        recordSealed.current = false;
        if (!aliveRef.current) return;
        setRecording(false);
        setRecordLocked(false);
        setRecordElapsed(0);
        setStatus("Recording discarded.");
      },
    });
    recordingSession.current = session;
    if (!session) {
      recordStarted.current = null;
      setRecording(false);
    }
  }

  function onStopRecording() {
    recordingSession.current?.stop();
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video || !hasVideo) return;
    if (video.paused) {
      try {
        await video.play();
        setPlaying(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Playback failed");
      }
      return;
    }
    video.pause();
    setPlaying(false);
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>
            <Link href="/research">← Research</Link>
          </p>
          <h1 className={styles.title}>VJ Studio</h1>
          <p className={styles.subtitle}>
            Local video on s0 · hydra-synth · {VJ_PREVIEW_WIDTH}×{VJ_PREVIEW_HEIGHT}
          </p>
        </div>
      </header>

      <div className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={VJ_PREVIEW_WIDTH}
          height={VJ_PREVIEW_HEIGHT}
          aria-label="Hydra preview, 32:9"
        />
        <video
          ref={videoRef}
          className={styles.sourceVideo}
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.row}>
          <label className={styles.fileBtn}>
            {ready ? "Load video" : "Starting…"}
            <input
              type="file"
              accept="video/mp4,video/webm,.mp4,.webm"
              disabled={!ready}
              onChange={onFile}
            />
          </label>
          <button
            type="button"
            className={styles.btn}
            onClick={() => void togglePlayback()}
            disabled={!hasVideo}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <p className={styles.fileName}>
            {fileName ?? "No clip loaded — MP4 or WebM stays in the browser."}
          </p>
        </div>

        <div className={styles.row} role="group" aria-label="Canvas recording">
          <button
            type="button"
            className={styles.btn}
            onClick={onRecord}
            disabled={!ready || recording || !recordLabel}
          >
            Record
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={onStopRecording}
            disabled={!recording || recordLocked}
          >
            Stop
          </button>
          <p
            className={recording ? `${styles.counter} ${styles.counterLive}` : styles.counter}
            role="timer"
            aria-live="polite"
            aria-label="Recording time"
          >
            {formatRecordClock(recordElapsed)} / {formatRecordClock(VJ_RECORD_SECONDS)}
            {recordLabel ? ` · ${recordLabel}` : ""}
          </p>
        </div>
        <p className={styles.hint}>
          Record captures {VJ_RECORD_SECONDS}.0s of this canvas at {VJ_RECORD_FPS} fps,{" "}
          {VJ_PREVIEW_WIDTH}×{VJ_PREVIEW_HEIGHT}. MP4/H.264 when the browser can encode it,
          otherwise WebM. The file is checked, then downloaded. Stop discards the take.
        </p>

        <div className={styles.row} role="group" aria-label="Shader preset">
          {vjPresets.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                activePreset === item.id
                  ? `${styles.btn} ${styles.btnActive}`
                  : styles.btn
              }
              aria-pressed={activePreset === item.id}
              disabled={!ready}
              title={item.detail}
              onClick={() => selectPreset(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className={styles.slider}>
          <span>Intensity</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={intensity}
            disabled={!ready}
            onChange={onIntensity}
          />
          <span className={styles.sliderValue}>{Math.round(intensity * 100)}</span>
        </label>

        <label className={styles.editorLabel}>
          Sketch
          <textarea
            className={styles.editor}
            value={code}
            onChange={onCode}
            onKeyDown={onEditorKey}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Hydra sketch"
            disabled={!ready}
          />
        </label>
        <p className={styles.hint}>
          Hydra chains only. hydra-synth eval runs page JavaScript, so this box
          does not use it. s0 stays the video. intensity follows the slider.
          Ctrl/⌘+Enter runs.
        </p>
        <div className={styles.row}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => runNow()}
            disabled={!ready}
          >
            Run
          </button>
          <input
            className={styles.field}
            value={sketchName}
            onChange={(event) => setSketchName(event.target.value)}
            placeholder="Sketch name"
            aria-label="Sketch name"
            maxLength={48}
          />
          <button type="button" className={styles.btn} onClick={onSave}>
            Save
          </button>
          <select
            className={styles.field}
            value={selectedSketchId}
            onChange={(event) => setSelectedSketchId(event.target.value)}
            aria-label="Saved sketches"
          >
            <option value="">Saved sketches</option>
            {sketches.map((sketch) => (
              <option key={sketch.id} value={sketch.id}>
                {sketch.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.btn}
            onClick={onLoadSketch}
            disabled={!selectedSketchId || !ready}
          >
            Load
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={onDeleteSketch}
            disabled={!selectedSketchId}
          >
            Delete
          </button>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
            <span className={styles.errorHint}> Open the brahma101 helper, then fix this.</span>
          </p>
        ) : null}
        {status ? (
          <p className={styles.status} role="status">
            {status}
          </p>
        ) : null}
      </div>
      <HydraAssistChat
        code={code}
        error={error}
        uiVisible
        zIndex={10100}
        welcome="brahma101 · your helper. welcome to VJ. I can fix sketch syntax."
        placeholder="Ask about this sketch…"
        quickFix={vjQuickFix}
        assistExtra={{ dialect: "vj" }}
        fixQuestion={(sketchError) =>
          sketchError
            ? `Fix this sketch so the VJ editor can run it. Error: ${sketchError}`
            : "Fix this sketch so the VJ editor can run it. Keep s0 as the video."
        }
        onApply={(next) => {
          codeRef.current = next;
          setCode(next);
          const applied = runNow(next);
          if (applied) setStatus("Applied from brahma101 helper.");
        }}
      />
      <ParamDashboard
        code={code}
        catalog={hydraParamCatalog}
        uiVisible
        ready={ready}
        title="params"
        emptyHint="Numeric literals in the sketch show up here."
        onCodeChange={onParams}
      />
    </div>
  );
}
