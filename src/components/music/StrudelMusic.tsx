"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import Link from "next/link";
import {
  musicContent,
  musicLessons,
  musicSketches,
  findMusicPattern,
  type MusicPattern,
} from "@/data/music";
import {
  buildShareUrl,
  diceMutate,
  downloadText,
  pickRandomPattern,
  readCodeFromUrl,
  stamp,
} from "@/lib/strudel/music-tools";
import { loadStrudel, type StrudelApi } from "@/lib/strudel/load-strudel";
import styles from "./StrudelMusic.module.css";

function TreeLeaf({
  pattern,
  active,
  ready,
  isLast,
  prefix,
  onSelect,
}: {
  pattern: MusicPattern;
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
        onClick={() => onSelect(pattern.id)}
        disabled={!ready}
        title={pattern.blurb}
      >
        {pattern.label}
      </button>
    </li>
  );
}

export default function StrudelMusic() {
  const apiRef = useRef<StrudelApi | null>(null);
  const codeRef = useRef(musicLessons[0].code);
  const [activeId, setActiveId] = useState(musicLessons[0].id);
  const [code, setCode] = useState(musicLessons[0].code);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [panelPos, setPanelPos] = useState({ x: 20, y: 220 });
  const [dragging, setDragging] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const [openFolders, setOpenFolders] = useState({
    music: true,
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
    let cancelled = false;

    const fromUrl = readCodeFromUrl();
    if (fromUrl) {
      setCode(fromUrl);
      setActiveId("shared");
    }

    void loadStrudel()
      .then(async (api) => {
        if (cancelled) return;
        apiRef.current = api;

        await api.initStrudel({
          prebake: async () => {
            try {
              await api.samples("github:tidalcycles/dirt-samples");
              if (!cancelled) setToast(musicContent.toastSamples);
            } catch {
              if (!cancelled) setToast(musicContent.toastSamplesFail);
            }
          },
        });
        if (!cancelled) {
          setError(null);
          setReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to init Strudel"
          );
        }
      });

    return () => {
      cancelled = true;
      try {
        apiRef.current?.hush();
      } catch {
        /* ignore teardown races */
      }
      apiRef.current = null;
      setPlaying(false);
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

  async function playCode(source: string) {
    const api = apiRef.current;
    if (!api || !ready) return;
    try {
      await api.evaluate(source);
      setPlaying(true);
      setError(null);
      setToast(musicContent.toastPlay);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setPlaying(false);
    }
  }

  function stopCode() {
    const api = apiRef.current;
    if (!api) return;
    try {
      api.hush();
      setPlaying(false);
      setToast(musicContent.toastStop);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function selectPattern(id: string) {
    const pattern = findMusicPattern(id);
    if (!pattern) return;
    setActiveId(id);
    setCode(pattern.code);
    void playCode(pattern.code);
  }

  async function sharePattern() {
    const url = buildShareUrl(codeRef.current);
    window.history.replaceState({}, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setToast(musicContent.toastShare);
    } catch {
      setToast(url);
    }
  }

  function randomPattern() {
    const pattern = pickRandomPattern();
    setActiveId(pattern.id);
    setCode(pattern.code);
    void playCode(pattern.code);
  }

  function dicePattern() {
    const next = diceMutate(codeRef.current);
    setActiveId("mutated");
    setCode(next);
    void playCode(next);
    setToast(musicContent.toastDice);
  }

  function exportPattern() {
    const id = stamp();
    const text = [
      `// brahma101 /create-music — strudel pattern ${id}`,
      `// https://strudel.cc`,
      "",
      codeRef.current,
      "",
    ].join("\n");
    downloadText(`strudel-${id}.txt`, text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void playCode(code);
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === ".") {
      e.preventDefault();
      stopCode();
    }
  }

  const active = findMusicPattern(activeId);
  const blurb =
    active?.blurb ??
    (activeId === "shared"
      ? "Loaded from share URL."
      : activeId === "mutated"
        ? "Dice-mutated numeric values."
        : "Custom / edited pattern.");

  return (
    <div className={styles.root}>
      <div
        className={
          playing ? `${styles.stage} ${styles.stagePlaying}` : styles.stage
        }
        aria-hidden
      >
        <div className={styles.stagePulse} />
        <div className={styles.orbit}>
          <div className={styles.orbitCore} />
        </div>
      </div>

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
            <h1 className={styles.title}>{musicContent.title}</h1>
            <p className={styles.subtitle}>{musicContent.subtitle}</p>
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
                <aside className={styles.treePane} aria-label="Pattern worktree">
                  <div className={styles.treeRoot}>
                    <button
                      type="button"
                      className={styles.treeFolderBtn}
                      onClick={() => toggleFolder("music")}
                      aria-expanded={openFolders.music}
                    >
                      <span className={styles.treeCaret} aria-hidden>
                        {openFolders.music ? "▼" : "▶"}
                      </span>
                      <span className={styles.treeRootLabel}>music/</span>
                    </button>
                    <a
                      className={styles.docsLink}
                      href={musicContent.docsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      docs ↗
                    </a>
                  </div>

                  {openFolders.music ? (
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
                            {musicContent.lessonsTitle}/
                          </span>
                        </button>
                        {openFolders.lessons ? (
                          <ul className={styles.treeList}>
                            {musicLessons.map((lesson, i) => (
                              <TreeLeaf
                                key={lesson.id}
                                pattern={lesson}
                                active={lesson.id === activeId}
                                ready={ready}
                                isLast={i === musicLessons.length - 1}
                                prefix="│   "
                                onSelect={selectPattern}
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
                            {musicContent.sketchesTitle}/
                          </span>
                        </button>
                        {openFolders.sketches ? (
                          <ul className={styles.treeList}>
                            {musicSketches.map((sketch, i) => (
                              <TreeLeaf
                                key={sketch.id}
                                pattern={sketch}
                                active={sketch.id === activeId}
                                ready={ready}
                                isLast={i === musicSketches.length - 1}
                                prefix="    "
                                onSelect={selectPattern}
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
                    <p className={styles.hint}>{musicContent.editorHint}</p>
                  </div>
                  <div className={styles.panelBarLeft}>
                    <button
                      type="button"
                      className={
                        playing
                          ? `${styles.runBtn} ${styles.toolBtnActive}`
                          : styles.runBtn
                      }
                      onClick={() => void playCode(code)}
                      disabled={!ready}
                    >
                      play
                    </button>
                    <button
                      type="button"
                      className={styles.ghostBtn}
                      onClick={stopCode}
                      disabled={!ready || !playing}
                    >
                      stop
                    </button>
                  </div>
                </div>

                <div className={styles.toolRow} aria-label="Pattern tools">
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => void sharePattern()}
                    disabled={!ready}
                    title="Copy shareable URL with encoded pattern"
                  >
                    share
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={randomPattern}
                    disabled={!ready}
                    title="Load a random curated pattern"
                  >
                    random
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={dicePattern}
                    disabled={!ready}
                    title="Mutate numeric values in the pattern"
                  >
                    dice
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={exportPattern}
                    disabled={!ready}
                    title="Download pattern as text"
                  >
                    export
                  </button>
                </div>

                <textarea
                  className={styles.editor}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={onKeyDown}
                  spellCheck={false}
                  aria-label="Strudel pattern code"
                />
              </div>
            </div>

            <p className={styles.credit}>
              <a
                href={musicContent.credit.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {musicContent.credit.label}
              </a>
              {" · AGPL · H toggles ui · drag to move"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
