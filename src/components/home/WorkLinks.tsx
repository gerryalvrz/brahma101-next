"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  isArchiveLibrary,
  isArchivePortal,
  isArchiveWriting,
  isWorkFolder,
  type ArchiveEntry,
  type ArchiveLibraryBlade,
  type WorkContent,
  type WorkFolder,
  type WorkBlade,
} from "@/data/home";
import styles from "@/app/(site)/home.module.css";

type WorkMode = "live" | "archive";

type WorkLinksProps = {
  work: WorkContent;
  /** Writing posts for the ARCHIVE → Writing media-player list (newest first). */
  archive: ArchiveEntry[];
};

/**
 * Folders sit on a rotary arc (≈2–5 o'clock) with nodes on the dial and blades
 * to the right, per the Xbox dashboard breakdown:
 * https://ejosue.com/i-tried-recreating-the-xbox-startup-ui-on-ios-heres-what-i-learned/
 *
 * Everything animates on `transform`/`opacity` only, and every folder stays
 * mounted — items outside the window park just off the arc at zero opacity so
 * they slide in rather than pop into existence.
 *
 * Nested folders stay off the dial: they open in the file tree under the
 * selected blade (path + directory listing).
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
/** Tighter ellipse on narrow viewports so the stack fits above the file tree. */
const ARC_RADIUS_X_MOBILE = 64;
const ARC_RADIUS_Y_MOBILE = 108;
/** Half the dial node's width — shifts the arc point onto the node centre. */
const NODE_OFFSET = 21;

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
/** Touch travel (px) per folder step — vertical primary, horizontal secondary. */
const SWIPE_STEP_PX = 48;
/** Movement before we lock the gesture to dial vs page. */
const AXIS_LOCK_PX = 12;

type ArcRadii = { x: number; y: number };

function arcStyle(
  rel: number,
  index: number,
  radii: ArcRadii
): CSSProperties {
  // Park distant folders one slot past the window so they travel in from
  // roughly the right place instead of appearing mid-arc.
  const slot = Math.max(-WINDOW - 1, Math.min(WINDOW + 1, rel));
  const distance = Math.abs(rel);
  const beyondWindow = distance > WINDOW;

  const rad = (slot * ANGLE_STEP * Math.PI) / 180;
  // 0° = east (3 o'clock); negative = up (toward 12)
  const x = radii.x * Math.cos(rad);
  const y = radii.y * Math.sin(rad);

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

function atDialEdge(index: number, direction: number, length: number) {
  return (
    (direction > 0 && index >= length - 1) || (direction < 0 && index <= 0)
  );
}

function pathSegment(label: string) {
  return label
    .toLowerCase()
    .replace(/\s*&\s*/g, "-and-")
    .replace(/\s+/g, "-");
}

type FileTreeProps = {
  rootLabel: string;
  folder: WorkFolder;
  cwd: WorkFolder[];
  onOpenFolder: (folder: WorkFolder) => void;
  onPathIndex: (index: number) => void;
};

function FileTree({
  rootLabel,
  folder,
  cwd,
  onOpenFolder,
  onPathIndex,
}: FileTreeProps) {
  const trail = [folder, ...cwd];
  const current = trail[trail.length - 1];
  const segments = [rootLabel, ...trail.map((item) => pathSegment(item.label))];

  return (
    <div
      key={trail.map((item) => item.id).join("/")}
      className={styles.fileTree}
      aria-label={`${current.label} projects`}
    >
      <p className={styles.fileTreePath}>
        {segments.map((segment, index) => {
          const last = index === segments.length - 1;
          return (
            <span key={`${segment}-${index}`}>
              {index > 0 ? (
                <span className={styles.fileTreeSep}>/</span>
              ) : null}
              {last ? (
                <span className={index === 0 ? styles.fileTreeRoot : undefined}>
                  {segment}
                </span>
              ) : (
                <button
                  type="button"
                  className={`${styles.fileTreeCrumb} ${
                    index === 0 ? styles.fileTreeRoot : ""
                  }`}
                  onClick={() => onPathIndex(index)}
                >
                  {segment}
                </button>
              )}
            </span>
          );
        })}
      </p>
      <ul className={styles.fileList}>
        {current.children.map((node, i) => (
          <li
            key={node.id}
            className={styles.fileItem}
            style={{ "--i": i } as CSSProperties}
          >
            {isWorkFolder(node) ? (
              <button
                type="button"
                className={styles.fileLink}
                onClick={() => onOpenFolder(node)}
              >
                <span className={styles.fileGlyph} aria-hidden>
                  ▸
                </span>
                <span className={styles.fileName}>{node.label}/</span>
              </button>
            ) : (
              <a
                href={node.href}
                target={node.external ? "_blank" : undefined}
                rel={node.external ? "noopener noreferrer" : undefined}
                className={styles.fileLink}
              >
                <span className={styles.fileGlyph} aria-hidden>
                  ▸
                </span>
                <span className={styles.fileName}>{node.label}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WorkLinks({ work, archive }: WorkLinksProps) {
  const router = useRouter();
  const [mode, setMode] = useState<WorkMode>("live");
  const [liveIndex, setLiveIndex] = useState(0);
  const [archiveBladeIndex, setArchiveBladeIndex] = useState(0);
  const [liveCwd, setLiveCwd] = useState<WorkFolder[]>([]);
  const [archiveCwd, setArchiveCwd] = useState<WorkFolder[]>([]);
  const [archiveIndex, setArchiveIndex] = useState(0);
  const archiveListRef = useRef<HTMLUListElement>(null);
  const [radii, setRadii] = useState<ArcRadii>({
    x: ARC_RADIUS_X,
    y: ARC_RADIUS_Y,
  });
  const [touchHint, setTouchHint] = useState(false);
  const baseId = useId();
  const arcRef = useRef<HTMLDivElement>(null);

  const blades: WorkBlade[] = mode === "live" ? work.live : work.archive;
  const maxIndex = Math.max(0, blades.length - 1);
  const selectedIndex = mode === "live" ? liveIndex : archiveBladeIndex;
  const activeIndex = Math.min(selectedIndex, maxIndex);

  // Native wheel/pointer handlers read the selection without re-subscribing.
  const activeIndexRef = useRef(0);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const active = blades[activeIndex];

  const step = useCallback(
    (direction: number) => {
      const setter = mode === "live" ? setLiveIndex : setArchiveBladeIndex;
      const length =
        mode === "live" ? work.live.length : work.archive.length;
      setter((current) => {
        const next = current + direction;
        return Math.max(0, Math.min(length - 1, next));
      });
    },
    [mode, work.live.length, work.archive.length]
  );

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 860px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const sync = () => {
      const mobile = narrow.matches;
      setRadii(
        mobile
          ? { x: ARC_RADIUS_X_MOBILE, y: ARC_RADIUS_Y_MOBILE }
          : { x: ARC_RADIUS_X, y: ARC_RADIUS_Y }
      );
      setTouchHint(mobile || coarse.matches);
    };
    sync();
    narrow.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    setLiveCwd([]);
  }, [liveIndex]);

  useEffect(() => {
    setArchiveCwd([]);
  }, [archiveBladeIndex]);

  useEffect(() => {
    const el = arcRef.current;
    if (!el) return;

    let accumulated = 0;
    let unlockAt = 0;

    const onWheel = (event: Event) => {
      const wheel = event as globalThis.WheelEvent;
      const now = performance.now();
      if (now < unlockAt) {
        event.preventDefault();
        return;
      }

      accumulated += wheel.deltaY;
      if (Math.abs(accumulated) < WHEEL_THRESHOLD) {
        event.preventDefault();
        return;
      }

      const direction = accumulated > 0 ? 1 : -1;
      if (atDialEdge(activeIndexRef.current, direction, blades.length)) {
        accumulated = 0;
        return;
      }

      event.preventDefault();
      accumulated = 0;
      unlockAt = now + WHEEL_COOLDOWN_MS;
      step(direction);
    };

    const onIdle = () => {
      accumulated = 0;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mouseleave", onIdle);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mouseleave", onIdle);
    };
  }, [blades.length, step]);

  /**
   * Touch / pen: vertical swipe mirrors desktop wheel (primary); horizontal
   * swipe still works. Once locked to the dial we capture the pointer; at a
   * dial edge we forward remaining movement to the page so both scroll modes
   * coexist — same contract as the wheel handler.
   */
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastY: number;
    originIndex: number;
    lock: "dial" | "page" | null;
    stepped: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      originIndex: activeIndex,
      lock: null,
      stepped: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;

    const dx = event.clientX - g.startX;
    const dy = event.clientY - g.startY;

    if (!g.lock) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;

      const vertical = Math.abs(dy) >= Math.abs(dx);
      // Swipe up → next folder (same as wheel down / content advancing).
      const direction = vertical
        ? dy < 0
          ? 1
          : -1
        : dx < 0
          ? 1
          : -1;

      if (
        vertical &&
        atDialEdge(activeIndexRef.current, direction, blades.length)
      ) {
        g.lock = "page";
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* capture can fail if the pointer already ended */
        }
        return;
      }

      g.lock = "dial";
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* capture can fail if the pointer already ended */
      }
    }

    if (g.lock === "page") {
      const delta = g.lastY - event.clientY;
      g.lastY = event.clientY;
      if (delta !== 0) window.scrollBy(0, delta);
      return;
    }

    if (g.lock !== "dial") return;

    event.preventDefault();

    const travel =
      Math.abs(dy) >= Math.abs(dx)
        ? g.startY - event.clientY
        : g.startX - event.clientX;
    const steps = Math.round(travel / SWIPE_STEP_PX);
    const next = Math.max(
      0,
      Math.min(blades.length - 1, g.originIndex + steps)
    );
    if (next !== activeIndexRef.current) {
      g.stepped = true;
      suppressClickRef.current = true;
      if (mode === "live") setLiveIndex(next);
      else setArchiveBladeIndex(next);
    }
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    if (g.lock) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    }
    gesture.current = null;
  }

  function openArchiveTab() {
    setMode("archive");
    setArchiveBladeIndex(0);
  }

  function onBladeClick(
    index: number,
    event: ReactMouseEvent<HTMLButtonElement>
  ) {
    if (suppressClickRef.current) {
      event.preventDefault();
      suppressClickRef.current = false;
      return;
    }
    if (mode === "live") {
      const blade = work.live[index];
      if (blade && isArchivePortal(blade)) {
        openArchiveTab();
        return;
      }
      setLiveIndex(index);
    } else {
      setArchiveBladeIndex(index);
    }
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
        if (mode === "live") setLiveIndex(0);
        else setArchiveBladeIndex(0);
        break;
      case "End":
        event.preventDefault();
        if (mode === "live") setLiveIndex(maxIndex);
        else setArchiveBladeIndex(maxIndex);
        break;
      case "Enter":
      case " ":
        if (mode === "live" && active && isArchivePortal(active)) {
          event.preventDefault();
          openArchiveTab();
        }
        break;
      default:
        break;
    }
  }

  /* ---------------------- ARCHIVE (writing) player ---------------------- */

  const archiveMax = Math.max(0, archive.length - 1);
  const activeArchiveIndex = Math.min(archiveIndex, archiveMax);
  const [archiveMoreBelow, setArchiveMoreBelow] = useState(false);
  const writingSelected = active ? isArchiveWriting(active) : false;
  const librarySelected = active ? isArchiveLibrary(active) : false;
  const portalSelected = active ? isArchivePortal(active) : false;

  const openArchiveEntry = useCallback(
    (index: number) => {
      const entry = archive[index];
      if (entry) router.push(`/writing/${entry.slug}`);
    },
    [archive, router]
  );

  const syncArchiveMore = useCallback(() => {
    const el = archiveListRef.current;
    if (!el) return;
    setArchiveMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, []);

  useEffect(() => {
    if (!writingSelected) return;
    const row = archiveListRef.current?.children[activeArchiveIndex];
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: "nearest" });
    }
    syncArchiveMore();
  }, [writingSelected, activeArchiveIndex, syncArchiveMore]);

  function onArchiveKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (archive.length === 0) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setArchiveIndex((i) => Math.min(archiveMax, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setArchiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        event.preventDefault();
        setArchiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setArchiveIndex(archiveMax);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        openArchiveEntry(activeArchiveIndex);
        break;
      default:
        break;
    }
  }

  /** Xbox two-step: first click highlights, click on highlighted row opens. */
  function onArchiveRowClick(index: number) {
    if (index === activeArchiveIndex) {
      openArchiveEntry(index);
    } else {
      setArchiveIndex(index);
    }
  }

  const cwd = mode === "live" ? liveCwd : archiveCwd;
  const setCwd = mode === "live" ? setLiveCwd : setArchiveCwd;
  const rootLabel = (mode === "live" ? work.liveLabel : work.archiveLabel).toLowerCase();

  function writingPlayer() {
    return (
      <div className={styles.workArchive}>
        <div className={styles.archivePlate}>
          <p className={styles.archiveCount}>
            {archive.length} {archive.length === 1 ? "Entry" : "Entries"}
          </p>
          <p className={styles.archiveTitle}>Blogs & articles</p>
        </div>

        {archive.length === 0 ? (
          <p className={styles.workArchiveHint}>{work.archiveHint}</p>
        ) : (
          <>
            <div
              className={styles.archiveDeck}
              role="listbox"
              tabIndex={0}
              aria-label="Archive entries"
              aria-activedescendant={
                archive[activeArchiveIndex]
                  ? `${baseId}-post-${archive[activeArchiveIndex].slug}`
                  : undefined
              }
              onKeyDown={onArchiveKeyDown}
            >
              <ul
                ref={archiveListRef}
                className={styles.archiveList}
                onScroll={syncArchiveMore}
              >
                {archive.map((entry, index) => {
                  const selected = index === activeArchiveIndex;
                  return (
                    <li
                      key={entry.slug}
                      id={`${baseId}-post-${entry.slug}`}
                      role="option"
                      aria-selected={selected}
                      className={`${styles.archiveRow} ${
                        selected ? styles.archiveRowActive : ""
                      }`}
                      onClick={() => onArchiveRowClick(index)}
                    >
                      <span className={styles.archiveNum}>{index + 1}.</span>
                      <span className={styles.archiveRowTitle}>
                        {entry.title}
                        {entry.draft ? (
                          <span className={styles.archiveDraft}> draft</span>
                        ) : null}
                      </span>
                      <span className={styles.archiveDate}>{entry.date}</span>
                    </li>
                  );
                })}
              </ul>
              {archiveMoreBelow ? (
                <span className={styles.archiveMore} aria-hidden>
                  ▼
                </span>
              ) : null}
            </div>
            <p className={styles.menuHint}>
              {touchHint
                ? "Tap to select · tap again to read"
                : "↑↓ select · Enter or click to read"}
            </p>
          </>
        )}
      </div>
    );
  }

  function libraryPanel(blade: ArchiveLibraryBlade) {
    return (
      <div className={styles.workArchive}>
        <div className={styles.archivePlate}>
          <p className={styles.archiveCount}>0 Entries</p>
          <p className={styles.archiveTitle}>{blade.label}</p>
        </div>
        <p className={styles.workArchiveHint}>{blade.hint}</p>
      </div>
    );
  }

  function portalPanel() {
    return (
      <div className={styles.fileTree} aria-label="Open archive">
        <p className={styles.fileTreePath}>
          <span className={styles.fileTreeRoot}>
            {work.liveLabel.toLowerCase()}
          </span>
          <span className={styles.fileTreeSep}>/</span>
          <span>thinking</span>
        </p>
        <ul className={styles.fileList}>
          <li className={styles.fileItem}>
            <button
              type="button"
              className={styles.fileLink}
              onClick={openArchiveTab}
            >
              <span className={styles.fileGlyph} aria-hidden>
                ▸
              </span>
              <span className={styles.fileName}>Archive/</span>
            </button>
          </li>
        </ul>
      </div>
    );
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
          aria-selected={mode === "live"}
          className={`${styles.workToggleBtn} ${
            mode === "live" ? styles.workToggleActive : ""
          }`}
          onClick={() => setMode("live")}
        >
          {work.liveLabel}
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
        <a
          href="#contact"
          className={styles.workToggleBtn}
          onClick={(event) => {
            event.preventDefault();
            document
              .getElementById("contact")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {work.contactLabel}
        </a>
      </div>

      <div className={styles.xboxDeck} role="tabpanel">
        <div
          ref={arcRef}
          className={styles.arcStage}
          role="listbox"
          tabIndex={0}
          aria-label={mode === "live" ? "Project folders" : "Archive folders"}
          aria-activedescendant={
            active ? `${baseId}-${active.id}` : undefined
          }
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {blades.map((blade, index) => {
            const rel = index - activeIndex;
            const selected = rel === 0;

            return (
              <button
                key={blade.id}
                id={`${baseId}-${blade.id}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={selected}
                className={`${styles.bladeRow} ${
                  selected ? styles.bladeRowActive : ""
                }`}
                style={arcStyle(rel, index, radii)}
                onClick={(event) => onBladeClick(index, event)}
              >
                <span
                  className={`${styles.dialNode} ${
                    selected ? styles.dialNodeActive : ""
                  }`}
                  aria-hidden
                >
                  <span className={styles.dialRingOuter} />
                  <span className={styles.dialShell} />
                  <span className={styles.dialRing} />
                  <span className={styles.dialCore} />
                </span>
                <span
                  className={`${styles.blade} ${
                    selected ? styles.bladeActive : ""
                  }`}
                >
                  <span className={styles.bladeLabel}>{blade.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {active && isWorkFolder(active) ? (
          <FileTree
            rootLabel={rootLabel}
            folder={active}
            cwd={cwd}
            onOpenFolder={(next) => setCwd((path) => [...path, next])}
            onPathIndex={(index) => {
              if (index <= 1) setCwd([]);
              else setCwd((path) => path.slice(0, index - 1));
            }}
          />
        ) : null}

        {portalSelected ? portalPanel() : null}

        {writingSelected ? writingPlayer() : null}

        {librarySelected && isArchiveLibrary(active) ? libraryPanel(active) : null}

        {active && (isWorkFolder(active) || portalSelected || librarySelected) ? (
          <p className={styles.menuHint}>
            {touchHint
              ? `Folders · swipe · ${activeIndex + 1}/${blades.length}`
              : `Folders · scroll or ↑↓ · ${activeIndex + 1}/${blades.length}`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
