"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import Link from "next/link";
import type Hydra from "hydra-synth";
import {
  artContent,
  artLessons,
  artSketches,
  findArtSnippet,
  type ArtSketch,
} from "@/data/art";
import {
  buildShareUrl,
  diceMutate,
  downloadDataUrl,
  downloadText,
  pickRandomSnippet,
  readCodeFromUrl,
  stamp,
} from "@/lib/hydra/art-tools";
import styles from "./HydraArt.module.css";

function TreeLeaf({
  sketch,
  active,
  ready,
  isLast,
  prefix,
  onSelect,
}: {
  sketch: ArtSketch;
  active: boolean;
  ready: boolean;
  isLast: boolean;
  prefix: string;
  onSelect: (id: string) => void;
}) {
  return (
    <li className={styles.treeItem}>
      <span className={styles.treeGuide} aria-hidden>
        {prefix}
        {isLast ? "└── " : "├── "}
      </span>
      <button
        type="button"
        className={
          active ? `${styles.treeBtn} ${styles.treeBtnActive}` : styles.treeBtn
        }
        onClick={() => onSelect(sketch.id)}
        disabled={!ready}
        title={sketch.blurb}
      >
        {sketch.label}
      </button>
    </li>
  );
}

export default function HydraArt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hydraRef = useRef<Hydra | null>(null);
  const codeRef = useRef(artLessons[0].code);
  const [activeId, setActiveId] = useState(artLessons[0].id);
  const [code, setCode] = useState(artLessons[0].code);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [panelPos, setPanelPos] = useState({ x: 20, y: 220 });
  const [dragging, setDragging] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const [openFolders, setOpenFolders] = useState({
    art: true,
    lessons: true,
    sketches: true,
  });

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    const y = Math.min(
      Math.max(160, Math.round(window.innerHeight * 0.38)),
      window.innerHeight - 220
    );
    setPanelPos({ x: 20, y });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  function onDragPointerDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button, a")) return;
    const el = terminalRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    draggingRef.current = true;
    setDragging(true);
    el.setPointerCapture(e.pointerId);
  }

  function onDragPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const el = terminalRef.current;
    const width = el?.offsetWidth ?? 420;
    const maxX = Math.max(0, window.innerWidth - Math.min(width, 120));
    const maxY = Math.max(0, window.innerHeight - 64);
    const x = Math.min(Math.max(0, e.clientX - dragOffset.current.x), maxX);
    const y = Math.min(Math.max(0, e.clientY - dragOffset.current.y), maxY);
    setPanelPos({ x, y });
  }

  function onDragPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    try {
      terminalRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  function toggleFolder(key: keyof typeof openFolders) {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let hydra: Hydra | null = null;
    let onResize: (() => void) | null = null;

    const fromUrl = readCodeFromUrl();
    const initialCode = fromUrl ?? artLessons[0].code;
    if (fromUrl) {
      setCode(fromUrl);
      setActiveId("shared");
    }

    void import("hydra-synth").then(async ({ default: HydraCtor }) => {
      if (cancelled || !canvasRef.current) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      hydra = new HydraCtor({
        canvas: canvasRef.current,
        width: w,
        height: h,
        detectAudio: false,
        enableStreamCapture: false,
        makeGlobal: true,
      });
      hydraRef.current = hydra;

      onResize = () => {
        hydra?.setResolution(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      try {
        await new Promise<void>((resolve, reject) => {
          try {
            const result: unknown = window.eval(
              `(async () => {\n${initialCode}\n})()`
            );
            Promise.resolve(result).then(() => resolve()).catch(reject);
          } catch (e) {
            reject(e);
          }
        });
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to run sketch");
        }
      }
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      try {
        hydra?.hush();
      } catch {
        /* ignore teardown races */
      }
      hydraRef.current = null;
    };
  }, []);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key.toLowerCase() !== "h") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)
      ) {
        return;
      }
      setShowUi((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function runCode(source: string) {
    const hydra = hydraRef.current;
    if (!hydra) return;
    try {
      hydra.hush();
      // Match hydra.ojack.xyz: wrap in async IIFE so `await loadScript(...)` works.
      await new Promise<void>((resolve, reject) => {
        try {
          const result: unknown = window.eval(
            `(async () => {\n${source}\n})()`
          );
          Promise.resolve(result).then(() => resolve()).catch(reject);
        } catch (e) {
          reject(e);
        }
      });
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    }
  }

  function selectSnippet(id: string) {
    const snippet = findArtSnippet(id);
    if (!snippet) return;
    setActiveId(id);
    setCode(snippet.code);
    void runCode(snippet.code);
  }

  async function shareSketch() {
    const url = buildShareUrl(codeRef.current);
    window.history.replaceState({}, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setToast(artContent.toastShare);
    } catch {
      setToast(url);
    }
  }

  function randomSketch() {
    const snippet = pickRandomSnippet();
    setActiveId(snippet.id);
    setCode(snippet.code);
    void runCode(snippet.code);
  }

  function diceSketch() {
    const next = diceMutate(codeRef.current);
    setActiveId("mutated");
    setCode(next);
    void runCode(next);
    setToast(artContent.toastDice);
  }

  function screenshot() {
    const hydra = hydraRef.current;
    const canvas = canvasRef.current;
    if (!hydra || !canvas) return;

    const filename = `hydra-${stamp()}.png`;
    try {
      hydra.getScreenImage((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setToast(artContent.toastShot);
      });
    } catch {
      downloadDataUrl(filename, canvas.toDataURL("image/png"));
      setToast(artContent.toastShot);
    }
  }

  function exportShaders() {
    const hydra = hydraRef.current;
    if (!hydra) return;

    const id = stamp();
    const outputs = hydra.o ?? [];
    const parts: string[] = [
      `// brahma101 /art — hydra shader export ${id}`,
      `// Note: Hydra GLSL is regl/WebGL1-style and may need adapation for Resolume/MadMapper/etc.`,
      "",
      "// ===== SOURCE (hydra) =====",
      codeRef.current,
      "",
    ];

    let exported = 0;
    outputs.forEach((output, index) => {
      if (output.frag) {
        parts.push(`// ===== o${index} FRAGMENT =====`, output.frag, "");
        exported += 1;
      }
      if (output.vert) {
        parts.push(`// ===== o${index} VERTEX =====`, output.vert, "");
        exported += 1;
      }
    });

    if (exported === 0) {
      setError("No compiled shader found — run a sketch first.");
      return;
    }

    downloadText(`hydra-shaders-${id}.glsl.txt`, `${parts.join("\n")}\n`);
    setToast(artContent.toastShader);
  }

  function toggleAudio() {
    const hydra = hydraRef.current;
    if (!hydra) return;

    if (audioOn) {
      try {
        hydra.synth.a?.hide();
        hydra.synth.a?.stream?.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      hydra.detectAudio = false;
      setAudioOn(false);
      setToast(artContent.toastAudioOff);
      return;
    }

    try {
      if (!hydra.synth.a) {
        hydra._initAudio();
      }
      hydra.detectAudio = true;
      const audio = hydra.synth.a;
      if (audio) {
        window.a = audio;
        audio.setBins(6);
        audio.show();
      }
      setAudioOn(true);
      setToast(artContent.toastAudioOn);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mic permission failed");
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void runCode(code);
    }
  }

  const active = findArtSnippet(activeId);
  const blurb =
    active?.blurb ??
    (activeId === "shared"
      ? "Loaded from share URL."
      : activeId === "mutated"
        ? "Dice-mutated numeric values."
        : "Custom / edited sketch.");

  return (
    <div className={styles.root}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden={!ready} />

      {showUi ? <div className={styles.veil} aria-hidden /> : null}

      {error ? (
        <div className={styles.errorOverlay} role="alert">
          <div className={styles.errorOverlayHead}>
            <span>error</span>
            <button
              type="button"
              className={styles.errorDismiss}
              onClick={() => setError(null)}
            >
              dismiss
            </button>
          </div>
          <pre className={styles.errorOverlayBody}>{error}</pre>
        </div>
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <div className={styles.chromeBar}>
        <Link href="/research" className={styles.back}>
          ← Research
        </Link>
        <button
          type="button"
          className={styles.toggleUi}
          onClick={() => setShowUi((v) => !v)}
          aria-pressed={showUi}
          aria-label={showUi ? "Hide panel" : "Show panel"}
        >
          {showUi ? "hide ui" : "show ui"}
        </button>
      </div>

      {showUi ? (
        <div className={styles.ui}>
          <header className={styles.header}>
            <h1 className={styles.title}>{artContent.title}</h1>
            <p className={styles.subtitle}>{artContent.subtitle}</p>
            <p className={styles.blurb}>{blurb}</p>
          </header>

          <div
            ref={terminalRef}
            className={
              dragging
                ? `${styles.terminal} ${styles.terminalDragging}`
                : styles.terminal
            }
            style={{ left: panelPos.x, top: panelPos.y }}
            onPointerMove={onDragPointerMove}
            onPointerUp={onDragPointerUp}
            onPointerCancel={onDragPointerUp}
          >
            <div
              className={styles.dragHandle}
              onPointerDown={onDragPointerDown}
              title="Drag panel"
            >
              <span className={styles.dragGrip} aria-hidden>
                ⋮⋮
              </span>
              <span className={styles.dragLabel}>drag</span>
              <span className={styles.dragHint}>move panel</span>
            </div>

            <div
              className={
                showTree
                  ? styles.terminalBody
                  : `${styles.terminalBody} ${styles.terminalBodyEditorOnly}`
              }
            >
              {showTree ? (
                <aside className={styles.treePane} aria-label="Snippet worktree">
                  <div className={styles.treeRoot}>
                    <button
                      type="button"
                      className={styles.treeFolderBtn}
                      onClick={() => toggleFolder("art")}
                      aria-expanded={openFolders.art}
                    >
                      <span className={styles.treeCaret} aria-hidden>
                        {openFolders.art ? "▼" : "▶"}
                      </span>
                      <span className={styles.treeRootLabel}>art/</span>
                    </button>
                    <a
                      className={styles.docsLink}
                      href={artContent.docsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      docs ↗
                    </a>
                  </div>

                  {openFolders.art ? (
                    <>
                      <div className={styles.treeBranch}>
                        <button
                          type="button"
                          className={styles.treeFolderBtn}
                          onClick={() => toggleFolder("lessons")}
                          aria-expanded={openFolders.lessons}
                        >
                          <span className={styles.treeGuide} aria-hidden>
                            ├──{" "}
                          </span>
                          <span className={styles.treeCaret} aria-hidden>
                            {openFolders.lessons ? "▼" : "▶"}
                          </span>
                          <span className={styles.treeFolderLabel}>
                            {artContent.lessonsTitle}/
                          </span>
                        </button>
                        {openFolders.lessons ? (
                          <ul className={styles.treeList}>
                            {artLessons.map((lesson, i) => (
                              <TreeLeaf
                                key={lesson.id}
                                sketch={lesson}
                                active={lesson.id === activeId}
                                ready={ready}
                                isLast={i === artLessons.length - 1}
                                prefix="│   "
                                onSelect={selectSnippet}
                              />
                            ))}
                          </ul>
                        ) : null}
                      </div>

                      <div className={styles.treeBranch}>
                        <button
                          type="button"
                          className={styles.treeFolderBtn}
                          onClick={() => toggleFolder("sketches")}
                          aria-expanded={openFolders.sketches}
                        >
                          <span className={styles.treeGuide} aria-hidden>
                            └──{" "}
                          </span>
                          <span className={styles.treeCaret} aria-hidden>
                            {openFolders.sketches ? "▼" : "▶"}
                          </span>
                          <span className={styles.treeFolderLabel}>
                            {artContent.sketchesTitle}/
                          </span>
                        </button>
                        {openFolders.sketches ? (
                          <ul className={styles.treeList}>
                            {artSketches.map((sketch, i) => (
                              <TreeLeaf
                                key={sketch.id}
                                sketch={sketch}
                                active={sketch.id === activeId}
                                ready={ready}
                                isLast={i === artSketches.length - 1}
                                prefix="    "
                                onSelect={selectSnippet}
                              />
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </aside>
              ) : null}

              <div className={styles.editorPane}>
                <div className={styles.panelBar}>
                  <div className={styles.panelBarLeft}>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={() => setShowTree((v) => !v)}
                      aria-pressed={showTree}
                    >
                      {showTree ? "hide tree" : "show tree"}
                    </button>
                    <p className={styles.hint}>{artContent.editorHint}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.runBtn}
                    onClick={() => void runCode(code)}
                    disabled={!ready}
                  >
                    run
                  </button>
                </div>

                <div className={styles.toolRow} aria-label="Sketch tools">
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => void shareSketch()}
                    disabled={!ready}
                    title="Copy shareable URL with encoded sketch"
                  >
                    share
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={randomSketch}
                    disabled={!ready}
                    title="Load a random curated sketch"
                  >
                    random
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={diceSketch}
                    disabled={!ready}
                    title="Mutate numeric values in the sketch"
                  >
                    dice
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={screenshot}
                    disabled={!ready}
                    title="Download PNG screenshot"
                  >
                    shot
                  </button>
                  <button
                    type="button"
                    className={
                      audioOn
                        ? `${styles.toolBtn} ${styles.toolBtnActive}`
                        : styles.toolBtn
                    }
                    onClick={toggleAudio}
                    disabled={!ready}
                    title="Enable microphone FFT (a.fft)"
                  >
                    {audioOn ? "audio on" : "audio"}
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={exportShaders}
                    disabled={!ready}
                    title="Download compiled GLSL for videomapping"
                  >
                    shader
                  </button>
                </div>

                <textarea
                  className={styles.editor}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={onKeyDown}
                  spellCheck={false}
                  aria-label="Hydra sketch code"
                />
              </div>
            </div>

            <p className={styles.credit}>
              <a
                href={artContent.credit.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {artContent.credit.label}
              </a>
              {" · AGPL · H toggles ui · drag to move"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
