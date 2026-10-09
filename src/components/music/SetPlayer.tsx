"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { MusicSet } from "@/data/sets";
import { setYear } from "@/data/sets";
import styles from "./SetPlayer.module.css";

const SEEK_BACK = 10;
const SEEK_FWD = 30;
const VOL_STEPS = 10;

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function readStoredVolume() {
  if (typeof window === "undefined") return 0.85;
  const raw = window.localStorage.getItem("brahma-music-vol");
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.85;
}

export default function SetPlayer({ set }: { set: MusicSet }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(set.durationSec);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVolume(readStoredVolume());
  }, []);

  useEffect(() => {
    if (!set.audioUrl) {
      setError("Audio coming soon.");
      setReady(false);
      return;
    }

    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = set.audioUrl;
    audioRef.current = audio;
    setPlaying(false);
    setCurrent(0);
    setReady(false);
    setError(null);

    const onLoaded = () => {
      setReady(true);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => setCurrent(audio.currentTime);
    const onEnded = () => {
      if (audio.loop) {
        void audio.play();
        return;
      }
      setPlaying(false);
    };
    const onErr = () =>
      setError("Audio unavailable — upload may still be pending on R2.");

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onErr);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onErr);
      audioRef.current = null;
    };
  }, [set.audioUrl, set.durationSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = repeat;
  }, [repeat]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
  }, [rate]);

  if (!set.audioUrl) return null;

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setError("Playback blocked — click play again.");
    }
  }

  function stop() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
    setCurrent(0);
  }

  function seekBy(delta: number) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Math.min(
      duration,
      Math.max(0, audio.currentTime + delta)
    );
    setCurrent(audio.currentTime);
  }

  function seekFromClientX(clientX: number) {
    const audio = audioRef.current;
    const bar = barRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrent(audio.currentTime);
  }

  function onBarPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  }

  function onBarPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    seekFromClientX(e.clientX);
  }

  function setVolumeLevel(level: number) {
    const next = Math.min(1, Math.max(0, level));
    setVolume(next);
    setMuted(false);
    try {
      window.localStorage.setItem("brahma-music-vol", String(next));
    } catch {
      /* ignore */
    }
  }

  function cycleRate() {
    const order = [1, 1.25, 1.5, 0.75];
    const i = order.indexOf(rate);
    setRate(order[(i + 1) % order.length] ?? 1);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const volLit = muted ? 0 : Math.round(volume * VOL_STEPS);
  const status = !ready ? "LOAD" : playing ? "PLAY" : current > 0 ? "PAUSE" : "READY";

  return (
    <article className={styles.deck} aria-label="Media bay player">
      <div className={styles.chrome}>
        <span className={styles.status}>
          <span
            className={`${styles.led} ${playing ? styles.ledOn : ""}`}
            aria-hidden
          />
          MEDIA BAY · {status}
        </span>
        <span>
          {set.category ?? "SET"} · {setYear(set)}
        </span>
      </div>

      <div className={styles.grid}>
        <div className={styles.orbWrap} aria-hidden>
          <div
            className={`${styles.orbRing} ${playing ? styles.orbRingPlaying : ""}`}
          />
          <div
            className={styles.orb}
            style={
              set.coverUrl
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,20,8,0.55)), url(${set.coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {set.coverUrl ? null : "TDJ"}
          </div>
        </div>

        <div className={styles.main}>
          <div className={styles.meta}>
            <span className={styles.artist}>{set.artist}</span>
            <h2 className={styles.title}>{set.title}</h2>
            <div className={styles.tags}>
              {set.label ? <span className={styles.tag}>{set.label}</span> : null}
              {set.blurb ? <span className={styles.tag}>{set.blurb}</span> : null}
              <span className={styles.tag}>MP3 · 192K</span>
            </div>
          </div>

          <div className={styles.scrub}>
            <div
              ref={barRef}
              className={styles.bar}
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration)}
              aria-valuenow={Math.floor(current)}
              aria-label="Seek"
              onPointerDown={onBarPointerDown}
              onPointerMove={onBarPointerMove}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") seekBy(SEEK_FWD);
                if (e.key === "ArrowLeft") seekBy(-SEEK_BACK);
              }}
            >
              <div className={styles.fill} style={{ width: `${progress}%` }} />
              <div className={styles.thumb} style={{ left: `${progress}%` }} />
            </div>
            <div className={styles.times}>
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className={styles.transport}>
            <button
              type="button"
              className={styles.btn}
              onClick={() => seekBy(-SEEK_BACK)}
              disabled={!ready}
              aria-label={`Rewind ${SEEK_BACK} seconds`}
              title={`−${SEEK_BACK}s`}
            >
              ◀◀
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPlay} ${playing ? styles.btnActive : ""}`}
              onClick={toggle}
              disabled={!ready && !error}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={stop}
              disabled={!ready}
              aria-label="Stop"
            >
              ■
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={() => seekBy(SEEK_FWD)}
              disabled={!ready}
              aria-label={`Fast forward ${SEEK_FWD} seconds`}
              title={`+${SEEK_FWD}s`}
            >
              ▶▶
            </button>
            <button
              type="button"
              className={`${styles.btn} ${repeat ? styles.btnActive : ""}`}
              onClick={() => setRepeat((v) => !v)}
              aria-pressed={repeat}
              aria-label="Repeat"
            >
              REPEAT
            </button>
            <button
              type="button"
              className={`${styles.btn} ${muted ? styles.btnActive : ""}`}
              onClick={() => setMuted((v) => !v)}
              aria-pressed={muted}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? "MUTE" : "VOL"}
            </button>
            <button
              type="button"
              className={styles.btn}
              onClick={cycleRate}
              aria-label="Playback speed"
              title="Playback speed"
            >
              {rate}×
            </button>
          </div>
        </div>

        <div className={styles.volCol}>
          <span className={styles.volLabel}>VOL</span>
          <div
            className={styles.volLadder}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
            aria-label="Volume"
          >
            {Array.from({ length: VOL_STEPS }, (_, i) => {
              const step = i + 1;
              return (
                <button
                  key={step}
                  type="button"
                  className={`${styles.volStep} ${step <= volLit ? styles.volStepOn : ""}`}
                  onClick={() => setVolumeLevel(step / VOL_STEPS)}
                  aria-label={`Volume ${step * 10}%`}
                />
              );
            })}
          </div>
          <span className={styles.volPct}>
            {muted ? "00" : String(Math.round(volume * 100)).padStart(2, "0")}
          </span>
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
    </article>
  );
}
