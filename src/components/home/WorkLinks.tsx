"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { WorkContent } from "@/data/home";
import styles from "@/app/(site)/home.module.css";

type WorkMode = "now" | "archive";

type WorkLinksProps = {
  work: WorkContent;
};

/**
 * Folders sit on a rotary arc (≈2–5 o'clock) with nodes on the dial and blades
 * to the right, per the Xbox dashboard breakdown:
 * https://ejosue.com/i-tried-recreating-the-xbox-startup-ui-on-ios-heres-what-i-learned/
 *
 * Everything animates on `transform`/`opacity` only, and every folder stays
 * mounted — items outside the window park just off the arc at zero opacity so
 * they slide in rather than pop into existence.
 */

/** Folders visible on either side of the selection. */
const WINDOW = 2;
/** Degrees between neighbouring folder slots on the dial. */
const ANGLE_STEP = 30;
/**
 * The arc is an ellipse, not a circle: the dashboard staggers items far more
 * vertically than horizontally, so a circular arc pushes the outer folders
 * much too far left.
 */
const ARC_RADIUS_X = 88;
const ARC_RADIUS_Y = 132;
/** Half the dial node's width — shifts the arc point onto the node centre. */
const NODE_OFFSET = 19;

/**
 * Bars are deliberately uneven lengths, as in the dashboard. Keyed to the
 * folder's own index so a bar never changes width when the selection moves
 * (width is a layout property; animating it would defeat the point).
 */
const BAR_LENGTHS = [1, 0.93, 0.99, 0.9, 0.96];

/** Wheel delta to accumulate before advancing one folder. */
const WHEEL_THRESHOLD = 42;
/** Matches the blade transition so one flick cannot outrun the animation. */
const WHEEL_COOLDOWN_MS = 260;
/** Horizontal drag distance per folder step. */
const DRAG_STEP_PX = 56;

function arcStyle(rel: number, index: number): CSSProperties {
  // Park distant folders one slot past the window so they travel in from
  // roughly the right place instead of appearing mid-arc.
  const slot = Math.max(-WINDOW - 1, Math.min(WINDOW + 1, rel));
  const distance = Math.abs(rel);
  const beyondWindow = distance > WINDOW;

  const rad = (slot * ANGLE_STEP * Math.PI) / 180;
  // 0° = east (3 o'clock); negative = up (toward 12)
  const x = ARC_RADIUS_X * Math.cos(rad);
  const y = ARC_RADIUS_Y * Math.sin(rad);

  let opacity: number;
  if (beyondWindow) opacity = 0;
  else if (rel === 0) opacity = 1;
  // Items above the selection fade hardest; below stays more legible.
  else if (rel < 0) opacity = 0.42;
  else opacity = 0.8 - (rel - 1) * 0.16;

  return {
    // No rotation: every bar in the dashboard is dead level. The arc reads
    // through the vertical stagger of the nodes, not through tilted bars.
    transform: `translate3d(${x - NODE_OFFSET}px, calc(${y}px - 50%), 0)`,
    opacity,
    pointerEvents: beyondWindow ? "none" : "auto",
    zIndex: 5 - Math.min(distance, 5),
    "--bar-length": BAR_LENGTHS[index % BAR_LENGTHS.length],
  } as CSSProperties;
}

export default function WorkLinks({ work }: WorkLinksProps) {
  const groups = work.now;
  const [mode, setMode] = useState<WorkMode>("now");
  const [selectedIndex, setActiveIndex] = useState(0);
  const baseId = useId();
  const arcRef = useRef<HTMLDivElement>(null);

  const maxIndex = Math.max(0, groups.length - 1);
  const activeIndex = Math.min(selectedIndex, maxIndex);

  // Native wheel/pointer handlers read the selection without re-subscribing.
  const activeIndexRef = useRef(0);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const active = groups[activeIndex];

  const step = useCallback(
    (direction: number) => {
      setActiveIndex((current) => {
        const next = current + direction;
        // Clamped, not wrapped: lets the wheel hand scrolling back to the page
        // at either end instead of spinning forever.
        return Math.max(0, Math.min(groups.length - 1, next));
      });
    },
    [groups.length]
  );

  useEffect(() => {
    const el = arcRef.current;
    if (!el) return;

    let accumulated = 0;
    let unlockAt = 0;
    let idleTimer: ReturnType<typeof setTimeout>;

    const onWheel = (event: Event) => {
      const wheel = event as globalThis.WheelEvent;
      if (Math.abs(wheel.deltaY) < 1) return;

      const direction = wheel.deltaY > 0 ? 1 : -1;
      const index = activeIndexRef.current;
      const atEdge =
        (direction > 0 && index >= groups.length - 1) ||
        (direction < 0 && index <= 0);

      // At either end, stop swallowing the gesture so the page scrolls on.
      if (atEdge) return;
      wheel.preventDefault();

      accumulated += wheel.deltaY;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        accumulated = 0;
      }, 140);

      const now = performance.now();
      if (now < unlockAt) return;
      if (Math.abs(accumulated) < WHEEL_THRESHOLD) return;

      accumulated = 0;
      unlockAt = now + WHEEL_COOLDOWN_MS;
      step(direction);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      clearTimeout(idleTimer);
      el.removeEventListener("wheel", onWheel);
    };
  }, [groups.length, step]);

  // Horizontal drag steps the dial. Vertical is left alone so touch devices
  // keep normal page scrolling (see `touch-action: pan-y` on the stage).
  const dragOrigin = useRef<{ x: number; index: number } | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    dragOrigin.current = { x: event.clientX, index: activeIndex };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = dragOrigin.current;
    if (!origin) return;
    const steps = Math.round((origin.x - event.clientX) / DRAG_STEP_PX);
    const next = Math.max(
      0,
      Math.min(groups.length - 1, origin.index + steps)
    );
    if (next !== activeIndexRef.current) setActiveIndex(next);
  }

  function endDrag() {
    dragOrigin.current = null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        step(1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        step(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(groups.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={styles.workBlock}>
      <div
        className={styles.workToggle}
        role="tablist"
        aria-label="Work timeline"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "now"}
          className={`${styles.workToggleBtn} ${
            mode === "now" ? styles.workToggleActive : ""
          }`}
          onClick={() => setMode("now")}
        >
          {work.nowLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "archive"}
          className={`${styles.workToggleBtn} ${
            mode === "archive" ? styles.workToggleActive : ""
          }`}
          onClick={() => setMode("archive")}
        >
          {work.archiveLabel}
        </button>
      </div>

      {mode === "now" ? (
        <div className={styles.xboxDeck} role="tabpanel">
          {/* Rotary arc stage — folders only; files live below */}
          <div
            ref={arcRef}
            className={styles.arcStage}
            role="listbox"
            tabIndex={0}
            aria-label="Project folders"
            aria-activedescendant={
              active ? `${baseId}-${active.id}` : undefined
            }
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {groups.map((group, index) => {
              const rel = index - activeIndex;
              const selected = rel === 0;

              return (
                <button
                  key={group.id}
                  id={`${baseId}-${group.id}`}
                  type="button"
                  role="option"
                  // The stage owns the tab stop and tracks selection via
                  // aria-activedescendant, so options are not tab stops.
                  tabIndex={-1}
                  aria-selected={selected}
                  className={`${styles.bladeRow} ${
                    selected ? styles.bladeRowActive : ""
                  }`}
                  style={arcStyle(rel, index)}
                  onClick={() => setActiveIndex(index)}
                >
                  <span
                    className={`${styles.dialNode} ${
                      selected ? styles.dialNodeActive : ""
                    }`}
                    aria-hidden
                  >
                    <span className={styles.dialRingOuter} />
                    <span className={styles.dialRing} />
                    <span className={styles.dialCore} />
                  </span>
                  <span
                    className={`${styles.blade} ${
                      selected ? styles.bladeActive : ""
                    }`}
                  >
                    <span className={styles.bladeLabel}>{group.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Files — dedicated band under the arc (never shares the blade layer) */}
          {active ? (
            <div
              // Remounting on folder change replays the reveal animation.
              key={active.id}
              className={styles.fileTree}
              aria-label={`${active.label} projects`}
            >
              <p className={styles.fileTreePath}>
                <span className={styles.fileTreeRoot}>now</span>
                <span className={styles.fileTreeSep}>/</span>
                <span>{active.label.toLowerCase().replace(/\s+/g, "-")}</span>
              </p>
              <ul className={styles.fileList}>
                {active.projects.map((project, i) => (
                  <li
                    key={project.id}
                    className={styles.fileItem}
                    style={{ "--i": i } as CSSProperties}
                  >
                    <a
                      href={project.href}
                      target={project.external ? "_blank" : undefined}
                      rel={
                        project.external ? "noopener noreferrer" : undefined
                      }
                      className={styles.fileLink}
                    >
                      <span className={styles.fileGlyph} aria-hidden>
                        ▸
                      </span>
                      <span className={styles.fileName}>{project.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className={styles.menuHint}>
            Folders · scroll or ↑↓ · {activeIndex + 1}/{groups.length}
          </p>
        </div>
      ) : (
        <div className={styles.workArchive} role="tabpanel">
          <p className={styles.archiveStubTitle}>ARCHIVE</p>
          <p className={styles.workArchiveHint}>{work.archiveHint}</p>
          <p className={styles.archiveStubNote}>
            Blog articles will live here in a different interface.
          </p>
        </div>
      )}
    </div>
  );
}
