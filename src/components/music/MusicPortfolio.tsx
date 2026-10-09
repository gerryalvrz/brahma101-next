"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { MusicSet } from "@/data/sets";
import { setYear, setsContent } from "@/data/sets";
import SetPlayer from "@/components/music/SetPlayer";
import { scrambleTo } from "@/components/music/scrambleText";
import styles from "./MusicPortfolio.module.css";

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
  onEnter,
  onSelect,
  itemRef,
}: {
  set: MusicSet;
  index: number;
  isActive: boolean;
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

  const values = {
    artist: set.artist,
    album: set.title,
    category: set.category ?? "SET",
    label: set.label ?? "SELF HOSTED",
    year: setYear(set),
  };

  useEffect(() => {
    cancelScramble.current.forEach((c) => c());
    cancelScramble.current = [];

    if (isActive) {
      (Object.keys(values) as Array<keyof typeof values>).forEach((key) => {
        const el = refs.current[key];
        if (el) cancelScramble.current.push(scrambleTo(el, values[key]));
      });
    } else {
      (Object.keys(values) as Array<keyof typeof values>).forEach((key) => {
        const el = refs.current[key];
        if (el) el.textContent = values[key];
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
      className={`${styles.item} ${isActive ? styles.active : ""}`}
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
      aria-label={`${set.audioUrl ? "Play" : "Preview"} ${set.artist} — ${set.title}`}
    >
      <span
        ref={(el) => {
          refs.current.artist = el;
        }}
        className={`${styles.cell} ${styles.artist}`}
      >
        {values.artist}
      </span>
      <span
        ref={(el) => {
          refs.current.album = el;
        }}
        className={`${styles.cell} ${styles.album}`}
      >
        {values.album}
      </span>
      <span
        ref={(el) => {
          refs.current.category = el;
        }}
        className={`${styles.muted} ${styles.category}`}
      >
        {values.category}
      </span>
      <span
        ref={(el) => {
          refs.current.label = el;
        }}
        className={`${styles.muted} ${styles.label}`}
      >
        {values.label}
      </span>
      <span
        ref={(el) => {
          refs.current.year = el;
        }}
        className={`${styles.muted} ${styles.year}`}
      >
        {values.year}
      </span>
    </li>
  );
}

export default function MusicPortfolio({ sets }: { sets: MusicSet[] }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [playing, setPlaying] = useState<MusicSet | null>(
    () => sets.find((s) => s.audioUrl) ?? null
  );
  const [bgUrl, setBgUrl] = useState<string | undefined>();
  const [bgVisible, setBgVisible] = useState(false);

  const bgRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Array<HTMLLIElement | null>>([]);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    sets.forEach((s) => {
      if (!s.coverUrl) return;
      const img = new Image();
      img.src = s.coverUrl;
    });
  }, [sets]);

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
              onEnter={onEnter}
              onSelect={(s) => {
                if (s.audioUrl) setPlaying(s);
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

      {playing ? (
        <div className={styles.dock}>
          <SetPlayer set={playing} />
        </div>
      ) : null}
    </div>
  );
}
