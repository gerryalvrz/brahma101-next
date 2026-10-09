"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  applyParamValue,
  detectParams,
  formatParamValue,
  groupParamsByCategory,
} from "@/lib/livecoding/detect-params";
import type { DetectedParam, ParamFnDef } from "@/lib/livecoding/param-types";
import styles from "./ParamDashboard.module.css";

type Props = {
  code: string;
  catalog: ParamFnDef[];
  uiVisible: boolean;
  ready?: boolean;
  title?: string;
  emptyHint?: string;
  /** Called when a slider rewrites the source. Parent should update code + re-run. */
  onCodeChange: (next: string) => void;
};

const PANEL_W = 280;
const PANEL_H = 360;

export default function ParamDashboard({
  code,
  catalog,
  uiVisible,
  ready = true,
  title = "params",
  emptyHint = "No numeric knobs in this code yet. Load a lesson or write literals like osc(60) / .gain(0.5).",
  onCodeChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [placed, setPlaced] = useState(false);
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragMode = useRef(false);

  const params = useMemo(
    () => detectParams(code, catalog),
    [code, catalog],
  );
  const groups = useMemo(() => groupParamsByCategory(params), [params]);

  useEffect(() => {
    if (placed) return;
    const margin = 16;
    setPos({
      x: Math.max(margin, window.innerWidth - PANEL_W - margin),
      y: Math.max(margin, Math.round(window.innerHeight * 0.22)),
    });
    setPlaced(true);
  }, [placed]);

  if (!uiVisible) return null;

  function onDragPointerDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button, input")) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    dragMode.current = true;
    setDragging(true);
    el.setPointerCapture(e.pointerId);
  }

  function onDragPointerMove(e: PointerEvent<HTMLElement>) {
    if (!dragMode.current) return;
    const maxX = Math.max(0, window.innerWidth - 80);
    const maxY = Math.max(0, window.innerHeight - 48);
    setPos({
      x: Math.min(Math.max(0, e.clientX - dragOffset.current.x), maxX),
      y: Math.min(Math.max(0, e.clientY - dragOffset.current.y), maxY),
    });
  }

  function onDragPointerUp(e: PointerEvent<HTMLElement>) {
    if (!dragMode.current) return;
    dragMode.current = false;
    setDragging(false);
    try {
      panelRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  function onSlider(param: DetectedParam, raw: string) {
    const next = Number(raw);
    if (!Number.isFinite(next)) return;
    // Re-detect from current code so offsets stay valid for this edit.
    const live = detectParams(code, catalog);
    const match = live.find((p) => p.id === param.id);
    if (!match) return;
    onCodeChange(applyParamValue(code, match, next));
  }

  if (!open) {
    return (
      <button
        type="button"
        className={styles.float}
        style={{
          left: "auto",
          top: "auto",
          right: "1.1rem",
          bottom: "4.2rem",
          width: "auto",
          height: "auto",
        }}
        onClick={() => {
          setOpen(true);
          setMinimized(false);
        }}
        aria-label="Open params panel"
        title="Tweak numeric parameters"
      >
        <span className={styles.dockChip}>
          <span className={styles.dragTitle}>{title}</span>
          {params.length > 0 ? (
            <span className={styles.count}>{params.length}</span>
          ) : null}
        </span>
      </button>
    );
  }

  if (minimized) {
    return (
      <aside
        className={`${styles.float} ${styles.floatMinimized}`}
        aria-label="Params panel minimized"
      >
        <button
          type="button"
          className={styles.dockChip}
          onClick={() => setMinimized(false)}
          aria-label="Expand params panel"
        >
          <span className={styles.dragTitle}>{title}</span>
          {params.length > 0 ? (
            <span className={styles.count}>{params.length}</span>
          ) : null}
        </button>
      </aside>
    );
  }

  return (
    <aside
      ref={panelRef}
      className={[styles.float, dragging ? styles.floatDragging : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: pos.x,
        top: pos.y,
        width: PANEL_W,
        height: PANEL_H,
      }}
      onPointerMove={onDragPointerMove}
      onPointerUp={onDragPointerUp}
      onPointerCancel={onDragPointerUp}
      aria-label="Params dashboard"
    >
      <div
        className={styles.dragBar}
        onPointerDown={onDragPointerDown}
        title="Drag panel"
      >
        <span className={styles.dragTitle}>{title}</span>
        <span className={styles.dragSub}>dashboard</span>
        {params.length > 0 ? (
          <span className={styles.count}>{params.length}</span>
        ) : null}
        <button
          type="button"
          className={styles.minimizeBtn}
          onClick={() => setMinimized(true)}
          aria-label="Minimize params"
        >
          min
        </button>
        <button
          type="button"
          className={styles.minimizeBtn}
          onClick={() => setOpen(false)}
          aria-label="Close params"
        >
          close
        </button>
      </div>

      <div className={styles.body}>
        {params.length === 0 ? (
          <p className={styles.empty}>{emptyHint}</p>
        ) : (
          groups.map((group) => (
            <section key={group.category} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.category}</h3>
              {group.params.map((param) => (
                <label key={param.id} className={styles.row}>
                  <span className={styles.label}>{param.label}</span>
                  <span className={styles.value}>
                    {formatParamValue(param.value, param.step)}
                  </span>
                  <input
                    type="range"
                    className={styles.slider}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={param.value}
                    disabled={!ready}
                    onChange={(e) => onSlider(param, e.target.value)}
                    aria-label={param.label}
                  />
                </label>
              ))}
            </section>
          ))
        )}
        <p className={styles.hint}>
          Sliders rewrite literals in the editor and re-run. Expressions stay
          code-only.
        </p>
      </div>
    </aside>
  );
}
