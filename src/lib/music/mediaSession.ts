import type { MusicSet } from "@/data/sets";

/** iPhone / iPad (incl. iPadOS desktop UA). */
export function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ can report as Mac
  return (
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  );
}

/**
 * Tell iOS this is music playback (not a game/sfx) so it can keep
 * going with the screen locked and show in Control Center.
 */
export function requestPlaybackAudioSession() {
  try {
    const nav = navigator as Navigator & {
      audioSession?: { type: string };
    };
    if (nav.audioSession) {
      nav.audioSession.type = "playback";
    }
  } catch {
    /* unsupported */
  }
}

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (typeof window === "undefined") return pathOrUrl;
  return new URL(pathOrUrl, window.location.origin).href;
}

export function bindMediaSession(
  set: MusicSet,
  handlers: {
    play: () => void | Promise<void>;
    pause: () => void;
    stop: () => void;
    seekBy: (deltaSec: number) => void;
    getPosition: () => { position: number; duration: number; playbackRate: number };
  }
) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    return () => {};
  }

  requestPlaybackAudioSession();

  const artwork = set.coverUrl
    ? [
        {
          src: absoluteUrl(set.coverUrl),
          sizes: "512x512",
          type: "image/jpeg",
        },
      ]
    : [];

  navigator.mediaSession.metadata = new MediaMetadata({
    title: set.title,
    artist: set.hoverArtist || set.artist,
    album: set.label ?? "Metacognitive Music",
    artwork,
  });

  const setHandler = (
    action: MediaSessionAction,
    fn: MediaSessionActionHandler | null
  ) => {
    try {
      navigator.mediaSession.setActionHandler(action, fn);
    } catch {
      /* some actions unsupported on iOS */
    }
  };

  setHandler("play", () => {
    void handlers.play();
  });
  setHandler("pause", () => {
    handlers.pause();
  });
  setHandler("stop", () => {
    handlers.stop();
  });
  setHandler("seekbackward", (details) => {
    handlers.seekBy(-(details.seekOffset ?? 10));
  });
  setHandler("seekforward", (details) => {
    handlers.seekBy(details.seekOffset ?? 30);
  });
  setHandler("seekto", (details) => {
    if (typeof details.seekTime === "number") {
      const { duration } = handlers.getPosition();
      const audioPos = Math.min(duration, Math.max(0, details.seekTime));
      // seekto via relative from current
      const { position } = handlers.getPosition();
      handlers.seekBy(audioPos - position);
    }
  });

  return () => {
    setHandler("play", null);
    setHandler("pause", null);
    setHandler("stop", null);
    setHandler("seekbackward", null);
    setHandler("seekforward", null);
    setHandler("seekto", null);
    try {
      navigator.mediaSession.metadata = null;
    } catch {
      /* ignore */
    }
  };
}

export function updateMediaSessionPlaybackState(
  state: MediaSessionPlaybackState
) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    /* ignore */
  }
}

export function updateMediaSessionPosition(opts: {
  duration: number;
  position: number;
  playbackRate: number;
}) {
  if (
    typeof navigator === "undefined" ||
    !("mediaSession" in navigator) ||
    typeof navigator.mediaSession.setPositionState !== "function"
  ) {
    return;
  }
  try {
    const duration = Math.max(0, opts.duration || 0);
    const position = Math.min(duration, Math.max(0, opts.position || 0));
    navigator.mediaSession.setPositionState({
      duration: duration || undefined,
      position,
      playbackRate: opts.playbackRate || 1,
    });
  } catch {
    /* iOS may throw if duration is 0 / NaN */
  }
}
