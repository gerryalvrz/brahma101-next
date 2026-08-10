"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
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
  const [activeId, setActiveId] = useState(artLessons[0].id);
  const [code, setCode] = useState(artLessons[0].code);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showUi, setShowUi] = useState(true);
  const [openFolders, setOpenFolders] = useState({
    art: true,
    lessons: true,
    sketches: true,
  });

  function toggleFolder(key: keyof typeof openFolders) {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let hydra: Hydra | null = null;
    let onResize: (() => void) | null = null;

    void import("hydra-synth").then(({ default: HydraCtor }) => {
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
        hydra.eval(artLessons[0].code);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to run sketch");
      }
      setReady(true);
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

  function runCode(source: string) {
    const hydra = hydraRef.current;
    if (!hydra) return;
    try {
      hydra.hush();
      hydra.eval(source);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eval error");
    }
  }

  function selectSnippet(id: string) {
    const snippet = findArtSnippet(id);
    if (!snippet) return;
    setActiveId(id);
    setCode(snippet.code);
    runCode(snippet.code);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runCode(code);
    }
  }

  const active = findArtSnippet(activeId) ?? artLessons[0];

  return (
    <div className={styles.root}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden={!ready} />

      {showUi ? <div className={styles.veil} aria-hidden /> : null}

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
            <p className={styles.blurb}>{active.blurb}</p>
          </header>

          <div className={styles.terminal}>
            <div className={styles.terminalBody}>
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

              <div className={styles.editorPane}>
                <div className={styles.panelBar}>
                  <p className={styles.hint}>{artContent.editorHint}</p>
                  <button
                    type="button"
                    className={styles.runBtn}
                    onClick={() => runCode(code)}
                    disabled={!ready}
                  >
                    run
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

                {error ? <p className={styles.error}>{error}</p> : null}
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
              {" · AGPL · press H to toggle ui"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
