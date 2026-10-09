"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MusicSet } from "@/data/sets";
import { AudioFftBridge } from "@/lib/music/audioFft";
import { isAppleMobile } from "@/lib/music/mediaSession";
import {
  defaultSet,
  readPlayback,
  resolveSet,
  writePlayback,
} from "@/lib/music/playbackStore";
import SetPlayer from "@/components/music/SetPlayer";
import styles from "./MusicPlayerDock.module.css";

type PlayOpts = {
  autoplay?: boolean;
  /** Seek here after load (defaults to saved position for this set). */
  resumeAt?: number;
};

type MusicPlayerContextValue = {
  current: MusicSet | null;
  dockOpen: boolean;
  /** False until localStorage hydrate finishes (avoids SSR mismatch). */
  playbackReady: boolean;
  /** Open the persistent dock with this set. */
  playSet: (set: MusicSet, opts?: PlayOpts) => void;
  /** Show the dock UI again (audio keeps whatever state it has). */
  openDock: () => void;
  /** Hide the dock UI — music keeps playing. */
  close: () => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }
  return ctx;
}

export function useMusicPlayerOptional() {
  return useContext(MusicPlayerContext);
}

export default function MusicPlayerProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Keep SSR and first client paint identical — hydrate from localStorage after mount.
  const [playbackReady, setPlaybackReady] = useState(false);
  const [current, setCurrent] = useState<MusicSet | null>(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [playNonce, setPlayNonce] = useState(0);
  const [resumeAt, setResumeAt] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const positionRef = useRef(0);
  const fftBridge = useRef<AudioFftBridge | null>(null);
  /** Avoid re-seeking when merely re-showing the dock. */
  const playerSession = useRef(0);

  useEffect(() => {
    const bridge = new AudioFftBridge();
    bridge.ensureShim();
    fftBridge.current = bridge;
    return () => {
      bridge.dispose();
      fftBridge.current = null;
    };
  }, []);

  useEffect(() => {
    const saved = readPlayback();
    const set = resolveSet(saved?.setId) ?? defaultSet();
    if (set) {
      setCurrent(set);
      const pos = saved?.setId === set.id ? (saved.position ?? 0) : 0;
      setResumeAt(pos);
      positionRef.current = pos;
    }
    setPlaybackReady(true);
  }, []);

  const persistPosition = useCallback((setId: string, position: number) => {
    positionRef.current = position;
    writePlayback({ setId, position });
  }, []);

  const playSet = useCallback((set: MusicSet, opts?: PlayOpts) => {
    const saved = readPlayback();
    const nextResume =
      opts?.resumeAt ?? (saved?.setId === set.id ? saved.position : 0);
    setCurrent(set);
    setResumeAt(nextResume);
    positionRef.current = nextResume;
    writePlayback({ setId: set.id, position: nextResume });
    playerSession.current += 1;
    setDockOpen(true);
    if (opts?.autoplay !== false && set.audioUrl) {
      setPlayNonce((n) => n + 1);
    }
  }, []);

  const openDock = useCallback(() => {
    if (!current) {
      const saved = readPlayback();
      const set = resolveSet(saved?.setId) ?? defaultSet();
      if (!set) return;
      setCurrent(set);
      setResumeAt(saved?.setId === set.id ? saved.position : 0);
    }
    setDockOpen(true);
  }, [current]);

  const close = useCallback(() => {
    if (current) {
      writePlayback({ setId: current.id, position: positionRef.current });
    }
    // Hide UI only — SetPlayer stays mounted so audio continues.
    setDockOpen(false);
  }, [current]);

  const onPosition = useCallback(
    (t: number) => {
      if (!current) return;
      persistPosition(current.id, t);
    },
    [current, persistPosition]
  );

  const onAudioReady = useCallback((audio: HTMLAudioElement) => {
    if (isAppleMobile()) return;
    const bridge = fftBridge.current;
    if (!bridge) return;
    void bridge.attach(audio).catch((err) => {
      console.warn("[music] FFT attach failed — playback still works", err);
    });
  }, []);

  const onBeforePlay = useCallback(async () => {
    if (isAppleMobile()) return;
    await fftBridge.current?.resume();
  }, []);

  const value = useMemo(
    () => ({ current, dockOpen, playbackReady, playSet, openDock, close }),
    [current, dockOpen, playbackReady, playSet, openDock, close]
  );

  const hasAudio = Boolean(current?.audioUrl);

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}

      {playbackReady && !dockOpen ? (
        <button
          type="button"
          className={`${styles.fab} ${isPlaying ? styles.fabLive : ""}`}
          onClick={openDock}
          aria-label="Open music player"
          title={isPlaying ? "Music playing — open player" : "Music"}
        >
          ♪
        </button>
      ) : null}

      {/* Mount only after hydrate so SSR HTML matches the first client paint. */}
      {playbackReady && hasAudio && current ? (
        <div
          className={dockOpen ? styles.dock : styles.dockHidden}
          aria-hidden={!dockOpen}
        >
          <SetPlayer
            key={`${current.id}-${playerSession.current}`}
            set={current}
            playNonce={playNonce}
            startAt={resumeAt}
            onClose={close}
            onPosition={onPosition}
            onPlayingChange={setIsPlaying}
            onAudioReady={onAudioReady}
            onBeforePlay={onBeforePlay}
          />
        </div>
      ) : null}

      {playbackReady && dockOpen && current && !hasAudio ? (
        <div className={styles.dock}>
          <div className={styles.pending} role="status">
            <div className={styles.pendingChrome}>
              <span>MEDIA BAY · WAIT</span>
              <button
                type="button"
                className={styles.pendingClose}
                onClick={close}
                aria-label="Hide player"
              >
                ✕
              </button>
            </div>
            <p className={styles.pendingArtist}>{current.artist}</p>
            <h2 className={styles.pendingTitle}>{current.title}</h2>
            <p className={styles.pendingHint}>
              Audio coming soon — cover / vibe only for now.
            </p>
          </div>
        </div>
      ) : null}
    </MusicPlayerContext.Provider>
  );
}
