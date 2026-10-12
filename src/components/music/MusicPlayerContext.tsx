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
import { usePathname } from "next/navigation";
import type { MusicSet } from "@/data/sets";
import { musicSets } from "@/data/sets";
import { AudioFftBridge } from "@/lib/music/audioFft";
import { isAppleMobile } from "@/lib/music/mediaSession";
import {
  defaultSet,
  readPlayback,
  resolveSet,
  writePlayback,
} from "@/lib/music/playbackStore";
import { type MusicTrack } from "@/components/ui/music-player";
import SetPlayer from "@/components/music/SetPlayer";
import SiteMusicPlayer from "@/components/music/SiteMusicPlayer";
import styles from "./MusicPlayerDock.module.css";

function setsToTracks(sets: MusicSet[]): MusicTrack[] {
  return sets
    .filter((s): s is MusicSet & { audioUrl: string } => Boolean(s.audioUrl))
    .map((s) => ({
      title: s.title,
      artist: s.hoverArtist || s.artist,
      src: s.audioUrl,
      artwork: s.coverUrl,
    }));
}

function isMusicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/music" || pathname.startsWith("/music/");
}

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
  const pathname = usePathname();
  const onMusicPage = isMusicRoute(pathname);
  const tracks = useMemo(() => setsToTracks(musicSets), []);

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

  const startIndex = useMemo(() => {
    if (!current?.audioUrl) return 0;
    const i = tracks.findIndex((t) => t.src === current.audioUrl);
    return i >= 0 ? i : 0;
  }, [current, tracks]);

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

  const onSiteTrackChange = useCallback((track: MusicTrack) => {
    const match = musicSets.find((s) => s.audioUrl === track.src);
    if (match) {
      setCurrent(match);
      writePlayback({ setId: match.id, position: positionRef.current });
    }
  }, []);

  const value = useMemo(
    () => ({ current, dockOpen, playbackReady, playSet, openDock, close }),
    [current, dockOpen, playbackReady, playSet, openDock, close]
  );

  const hasAudio = Boolean(current?.audioUrl);

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}

      {/* Site-wide glass player — icon by default, draggable, expand on tap. */}
      {playbackReady && !onMusicPage && tracks.length > 0 ? (
        <SiteMusicPlayer
          tracks={tracks}
          startIndex={startIndex}
          autoPlay={isPlaying}
          accentColor="#a6ff1f"
          onTrackChange={onSiteTrackChange}
          glassClassName={styles.sitePlayerGlass}
        />
      ) : null}

      {/* Media Bay dock — /music only (Hydra FFT + resume). */}
      {onMusicPage && playbackReady && !dockOpen ? (
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
      {onMusicPage && playbackReady && hasAudio && current ? (
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

      {onMusicPage && playbackReady && dockOpen && current && !hasAudio ? (
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
