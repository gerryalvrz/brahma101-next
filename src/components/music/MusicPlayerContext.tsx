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
import SetPlayer from "@/components/music/SetPlayer";
import styles from "./MusicPlayerDock.module.css";

type MusicPlayerContextValue = {
  current: MusicSet | null;
  /** Open the persistent dock with this set. Autoplays when it has audio. */
  playSet: (set: MusicSet, opts?: { autoplay?: boolean }) => void;
  /** Stop audio and hide the dock. */
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
  const [current, setCurrent] = useState<MusicSet | null>(null);
  const [playNonce, setPlayNonce] = useState(0);
  const fftBridge = useRef<AudioFftBridge | null>(null);

  useEffect(() => {
    const bridge = new AudioFftBridge();
    bridge.ensureShim();
    fftBridge.current = bridge;
    return () => {
      bridge.dispose();
      fftBridge.current = null;
    };
  }, []);

  const playSet = useCallback((set: MusicSet, opts?: { autoplay?: boolean }) => {
    setCurrent(set);
    if (opts?.autoplay !== false && set.audioUrl) {
      setPlayNonce((n) => n + 1);
    }
  }, []);

  const close = useCallback(() => {
    setCurrent(null);
  }, []);

  const onAudioReady = useCallback((audio: HTMLAudioElement) => {
    // iOS: keep a plain HTMLAudioElement so lock-screen / background
    // playback works. MediaElementSource + AudioContext often kills it.
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
    () => ({ current, playSet, close }),
    [current, playSet, close]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {current ? (
        <div className={styles.dock}>
          {current.audioUrl ? (
            <SetPlayer
              set={current}
              playNonce={playNonce}
              onClose={close}
              onAudioReady={onAudioReady}
              onBeforePlay={onBeforePlay}
            />
          ) : (
            <div className={styles.pending} role="status">
              <div className={styles.pendingChrome}>
                <span>MEDIA BAY · WAIT</span>
                <button
                  type="button"
                  className={styles.pendingClose}
                  onClick={close}
                  aria-label="Close player"
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
          )}
        </div>
      ) : null}
    </MusicPlayerContext.Provider>
  );
}
