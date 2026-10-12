"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  MusicPlayer,
  type MusicTrack,
} from "@/components/ui/music-player";
import styles from "./MusicPlayerDock.module.css";

const POS_KEY = "brahma-site-player-pos";
const DRAG_THRESHOLD = 6;

type Pos = { x: number; y: number };

function clampPos(x: number, y: number, w: number, h: number): Pos {
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - w - pad);
  const maxY = Math.max(pad, window.innerHeight - h - pad);
  return {
    x: Math.min(maxX, Math.max(pad, x)),
    y: Math.min(maxY, Math.max(pad, y)),
  };
}

function readPos(): Pos | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pos;
    if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePos(pos: Pos) {
  try {
    window.localStorage.setItem(POS_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

export default function SiteMusicPlayer({
  tracks,
  startIndex = 0,
  autoPlay = false,
  accentColor,
  glassClassName,
  onTrackChange,
}: {
  tracks: MusicTrack[];
  startIndex?: number;
  autoPlay?: boolean;
  accentColor?: string;
  glassClassName?: string;
  onTrackChange?: (track: MusicTrack, index: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  /** True only after the user actually dragged — keeps CSS right/bottom until then. */
  const hasDragged = useRef(false);

  // Show the full glass player by default; circle is opt-in via minimize.
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const saved = readPos();
    if (!saved) return;
    hasDragged.current = true;
    setPos(saved);
  }, []);

  /** Keep a custom position fully on-screen when size/mode changes. */
  useLayoutEffect(() => {
    if (!hasDragged.current || pos == null) return;
    const el = rootRef.current;
    if (!el) return;
    const next = clampPos(pos.x, pos.y, el.offsetWidth, el.offsetHeight);
    if (next.x !== pos.x || next.y !== pos.y) {
      setPos(next);
      writePos(next);
    }
  }, [minimized, pos]);

  useEffect(() => {
    if (!hasDragged.current || pos == null) return;
    const onResize = () => {
      const el = rootRef.current;
      if (!el) return;
      const next = clampPos(pos.x, pos.y, el.offsetWidth, el.offsetHeight);
      setPos(next);
      writePos(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  const artwork = tracks[startIndex]?.artwork ?? tracks[0]?.artwork;

  function beginDrag(e: ReactPointerEvent, fromMinimized: boolean) {
    if (e.button !== 0) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Keep origin in dragRef only — do NOT commit pos until the pointer moves.
    // Committing on pointerdown pinned the expanded player to the icon's
    // top-left and shoved it off the right/bottom edge of the viewport.
    const origin = pos ?? { x: rect.left, y: rect.top };
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    };
    el.setPointerCapture(e.pointerId);
    setDragging(true);
    if (!fromMinimized) e.preventDefault();
  }

  function onPointerMove(e: ReactPointerEvent) {
    const drag = dragRef.current;
    const el = rootRef.current;
    if (!drag || !el || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    hasDragged.current = true;
    setPos(
      clampPos(
        drag.originX + dx,
        drag.originY + dy,
        el.offsetWidth,
        el.offsetHeight
      )
    );
  }

  function endDrag(e: ReactPointerEvent) {
    const drag = dragRef.current;
    const el = rootRef.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    if (drag.moved) {
      suppressClick.current = true;
      const rect = el?.getBoundingClientRect();
      if (rect) {
        const next = clampPos(rect.left, rect.top, rect.width, rect.height);
        setPos(next);
        writePos(next);
      }
    }
    dragRef.current = null;
    setDragging(false);
  }

  function openExpanded() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setMinimized(false);
  }

  function minimize() {
    // If still using CSS right/bottom, stay there as the icon.
    // If dragged, keep the current top-left (clamped after layout).
    setMinimized(true);
  }

  const style =
    hasDragged.current && pos != null
      ? ({ left: pos.x, top: pos.y, right: "auto", bottom: "auto" } as const)
      : undefined;

  return (
    <div
      ref={rootRef}
      className={`${styles.sitePlayer} ${minimized ? styles.sitePlayerMini : ""} ${dragging ? styles.sitePlayerDragging : ""}`}
      style={style}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Keep audio mounted while icon-only */}
      <div
        className={
          minimized ? styles.sitePlayerHidden : styles.sitePlayerExpanded
        }
        aria-hidden={minimized}
      >
        <div
          className={styles.sitePlayerDrag}
          onPointerDown={(e) => beginDrag(e, false)}
          title="Drag player"
          aria-label="Drag player"
        >
          ⋮⋮
        </div>
        <button
          type="button"
          className={styles.sitePlayerMinimize}
          onClick={minimize}
          aria-label="Minimize player to icon"
          title="Minimize"
        >
          −
        </button>
        <MusicPlayer
          tracks={tracks}
          startIndex={startIndex}
          autoPlay={autoPlay}
          accentColor={accentColor}
          defaultCollapsed={false}
          onTrackChange={onTrackChange}
          className={glassClassName}
        />
      </div>

      {minimized ? (
        <button
          type="button"
          className={styles.sitePlayerIcon}
          onPointerDown={(e) => beginDrag(e, true)}
          onClick={openExpanded}
          aria-label="Open music player (drag to move)"
          title="Open player · drag to move"
        >
          {artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artwork} alt="" className={styles.sitePlayerIconArt} />
          ) : (
            <span aria-hidden>♪</span>
          )}
        </button>
      ) : null}
    </div>
  );
}
