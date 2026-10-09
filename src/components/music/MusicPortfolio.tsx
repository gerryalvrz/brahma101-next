"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { MusicSet } from "@/data/sets";
import { formatSetDate, setsContent } from "@/data/sets";
import {
  MUSIC_VIZ_OFF,
  musicVizContent,
  musicVizPresets,
} from "@/data/musicViz";
import MusicHydraBg from "@/components/music/MusicHydraBg";
import { useMusicPlayer } from "@/components/music/MusicPlayerContext";
import { scrambleTo } from "@/components/music/scrambleText";
import styles from "./MusicPortfolio.module.css";

const VIZ_ORDER = [MUSIC_VIZ_OFF, ...musicVizPresets.map((p) => p.id)];

type RowRefs = {
  artist: HTMLSpanElement | null;
  album: HTMLSpanElement | null;
  category: HTMLSpanElement | null;
  label: HTMLSpanElement | null;
  year: HTMLSpanElement | null;
};

function TimeDisplay({ timeZone }: { timeZone: string }) {
  const [parts, setParts] = useState({ h: "", m: "", ap: "" });

  useEffect(() => {
    const tick = () => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: true,
        hour: "numeric",
        minute: "numeric",
      });
      const map = Object.fromEntries(
        formatter.formatToParts(new Date()).map((p) => [p.type, p.value])
      );
      setParts({
        h: map.hour ?? "",
        m: map.minute ?? "",
        ap: map.dayPeriod ?? "",
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return (
    <time className={`${styles.corner} ${styles.bottomRight}`}>
      {parts.h}
      <span className={styles.blink}>:</span>
      {parts.m} {parts.ap}
    </time>
  );
}

function ProjectRow({
  set,
  index,
  isActive,
  isNowPlaying,
  onEnter,
  onSelect,
  itemRef,
}: {
  set: MusicSet;
  index: number;
  isActive: boolean;
  isNowPlaying: boolean;
  onEnter: (index: number, cover?: string) => void;
  onSelect: (set: MusicSet) => void;
  itemRef: (el: HTMLLIElement | null) => void;
}) {
  const refs = useRef<RowRefs>({
    artist: null,
    album: null,
    category: null,
    label: null,
    year: null,
  });
  const cancelScramble = useRef<Array<() => void>>([]);

  /** Resting row vs hover-reveal (artist → hoverArtist). */
  const resting = {
    artist: set.artist,
    album: set.title,
    category: set.category ?? "DJ SET",
    label: set.label ?? "Metacognitive Music",
    year: formatSetDate(set),
  };
  const revealed = {
    ...resting,
    artist: set.hoverArtist,
  };

  useEffect(() => {
    cancelScramble.current.forEach((c) => c());
    cancelScramble.current = [];

    const target = isActive ? revealed : resting;
    if (isActive) {
      (Object.keys(target) as Array<keyof typeof target>).forEach((key) => {
        const el = refs.current[key];
        if (el) cancelScramble.current.push(scrambleTo(el, target[key]));
      });
    } else {
      (Object.keys(target) as Array<keyof typeof target>).forEach((key) => {
        const el = refs.current[key];
        if (el) el.textContent = target[key];
      });
    }

    return () => {
      cancelScramble.current.forEach((c) => c());
      cancelScramble.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scramble on active toggle only
  }, [isActive]);

  return (
    <li
      ref={itemRef}
      className={`${styles.item} ${isActive ? styles.active : ""} ${isNowPlaying ? styles.nowPlaying : ""}`}
      onMouseEnter={() => onEnter(index, set.coverUrl)}
      onFocus={() => onEnter(index, set.coverUrl)}
      onClick={() => onSelect(set)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(set);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${set.audioUrl ? "Play" : "Preview"} ${set.hoverArtist} — ${set.title}`}
    >
      <span
        ref={(el) => {
          refs.current.artist = el;
        }}
        className={`${styles.cell} ${styles.artist}`}
      >
        {resting.artist}
      </span>
      <span
        ref={(el) => {
          refs.current.album = el;
        }}
        className={`${styles.cell} ${styles.album}`}
      >
        {resting.album}
      </span>
      <span
        ref={(el) => {
          refs.current.category = el;
        }}
        className={`${styles.muted} ${styles.category}`}
      >
        {resting.category}
      </span>
      <span
        ref={(el) => {
          refs.current.label = el;
        }}
        className={`${styles.muted} ${styles.label}`}
      >
        {resting.label}
      </span>
      <span
        ref={(el) => {
          refs.current.year = el;
        }}
        className={`${styles.muted} ${styles.year}`}
      >
        {resting.year}
      </span>
    </li>
  );
}

export default function MusicPortfolio({ sets }: { sets: MusicSet[] }) {
  const {
    playSet,
    openDock,
    current: nowPlaying,
    dockOpen,
    playbackReady,
  } = useMusicPlayer();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [bgUrl, setBgUrl] = useState<string | undefined>();
  const [bgVisible, setBgVisible] = useState(false);
  const [vizId, setVizId] = useState(musicVizPresets[0]?.id ?? MUSIC_VIZ_OFF);
  const seeded = useRef(false);

  const bgRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Array<HTMLLIElement | null>>([]);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTl = useRef<gsap.core.Timeline | null>(null);

  /** On /music, open the dock at the saved position (or first set). */
  useEffect(() => {
    if (!playbackReady || seeded.current) return;
    seeded.current = true;
    if (dockOpen) return;
    if (nowPlaying) {
      openDock();
      return;
    }
    const first = sets.find((s) => s.audioUrl) ?? sets[0];
    if (first) playSet(first, { autoplay: false });
  }, [playbackReady, sets, playSet, openDock, nowPlaying, dockOpen]);

  useEffect(() => {
    sets.forEach((s) => {
      if (!s.coverUrl) return;
      const img = new Image();
      img.src = s.coverUrl;
    });
  }, [sets]);

  function cycleViz(dir: 1 | -1) {
    const i = Math.max(0, VIZ_ORDER.indexOf(vizId));
    const next = (i + dir + VIZ_ORDER.length) % VIZ_ORDER.length;
    setVizId(VIZ_ORDER[next] ?? MUSIC_VIZ_OFF);
  }

  const vizLabel =
    vizId === MUSIC_VIZ_OFF
      ? musicVizContent.offLabel
      : (musicVizPresets.find((p) => p.id === vizId)?.label ?? vizId);

  const stopIdle = useCallback(() => {
    if (idleTl.current) {
      idleTl.current.kill();
      idleTl.current = null;
      itemsRef.current.forEach((el) => {
        if (el) gsap.set(el, { opacity: 1 });
      });
    }
  }, []);

  const startIdle = useCallback(() => {
    if (idleTl.current || sets.length === 0) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
    itemsRef.current.forEach((el, i) => {
      if (!el) return;
      const hideAt = i * 0.05;
      const showAt = sets.length * 0.025 + i * 0.05;
      tl.to(el, { opacity: 0.08, duration: 0.12, ease: "power2.inOut" }, hideAt);
      tl.to(el, { opacity: 1, duration: 0.12, ease: "power2.inOut" }, showAt);
    });
    idleTl.current = tl;
  }, [sets.length]);

  const armIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (activeIndex === -1) startIdle();
    }, 4000);
  }, [activeIndex, startIdle]);

  useEffect(() => {
    armIdle();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      stopIdle();
    };
  }, [armIdle, stopIdle]);

  const onEnter = useCallback(
    (index: number, cover?: string) => {
      stopIdle();
      if (idleTimer.current) clearTimeout(idleTimer.current);
      setActiveIndex(index);
      setBgUrl(cover);
      setBgVisible(true);
      const bg = bgRef.current;
      if (!bg) return;
      bg.style.transition = "none";
      bg.style.transform = "translate(-50%, -50%) scale(1.18)";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bg.style.transition =
            "opacity 0.55s ease, transform 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          bg.style.transform = "translate(-50%, -50%) scale(1)";
        });
      });
    },
    [stopIdle]
  );

  const onLeaveList = useCallback(() => {
    setActiveIndex(-1);
    setBgVisible(false);
    armIdle();
  }, [armIdle]);

  return (
    <div className={styles.root}>
      {vizId !== MUSIC_VIZ_OFF ? <MusicHydraBg presetId={vizId} /> : null}

      <div
        ref={bgRef}
        className={`${styles.bg} ${bgUrl ? "" : styles.bgPlaceholder}`}
        style={{
          opacity: bgVisible ? 1 : 0,
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        }}
        aria-hidden
      />
      <div className={styles.veil} aria-hidden />

      <main
        className={`${styles.main} ${activeIndex !== -1 ? styles.mainHasActive : ""}`}
        onMouseLeave={onLeaveList}
      >
        <h1 className={styles.srOnly}>{setsContent.title}</h1>
        <ul className={styles.list} role="list">
          {sets.map((set, index) => (
            <ProjectRow
              key={set.id}
              set={set}
              index={index}
              isActive={activeIndex === index}
              isNowPlaying={nowPlaying?.id === set.id}
              onEnter={onEnter}
              onSelect={(s) => {
                playSet(s, { autoplay: Boolean(s.audioUrl) });
              }}
              itemRef={(el) => {
                itemsRef.current[index] = el;
              }}
            />
          ))}
        </ul>
      </main>

      <aside className={styles.corners}>
        <div className={`${styles.corner} ${styles.topLeft}`}>
          <span className={styles.square} aria-hidden />
          <Link href="/">{setsContent.backLabel}</Link>
        </div>
        <nav className={`${styles.corner} ${styles.topRight}`}>
          <Link href={setsContent.archiveHref}>{setsContent.archiveLabel}</Link>
          {" · "}
          <Link href="/create-music">create</Link>
        </nav>
        <div className={`${styles.corner} ${styles.bottomLeft}`}>
          {setsContent.location}
        </div>
        <TimeDisplay timeZone={setsContent.timeZone} />
      </aside>

      <div className={styles.vizBar} role="group" aria-label="Hydra background">
        <button
          type="button"
          className={styles.vizBtn}
          onClick={() => cycleViz(-1)}
          aria-label="Previous viz"
        >
          ◀
        </button>
        <button
          type="button"
          className={`${styles.vizBtn} ${styles.vizLabel}`}
          onClick={() => cycleViz(1)}
          title="Cycle Hydra background"
        >
          {musicVizContent.pickerLabel} · {vizLabel}
        </button>
        <button
          type="button"
          className={styles.vizBtn}
          onClick={() => cycleViz(1)}
          aria-label="Next viz"
        >
          ▶
        </button>
      </div>

    </div>
  );
}
