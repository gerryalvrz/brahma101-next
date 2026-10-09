import Link from "next/link";
import type { Metadata } from "next";
import styles from "../music.module.css";

export const metadata: Metadata = {
  title: "Music Archive",
  description: "SoundCloud sets and video — Metacognitive Music archive.",
};

const SOUNDCLOUD_TRACKS = [
  {
    url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1417771822&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true",
    artist: "Locognitive",
    title: "Metacognitive Music pt. 1",
  },
  {
    url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1411503484&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true",
    artist: "Locognitive",
    title: "Metacognitive Music pt. 2",
  },
  {
    url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1825943739&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true",
    artist: "Metacognitive Music",
    title: "Flavor Town Xtravaganza - Locognitive",
  },
  {
    url: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/801013279&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true",
    artist: "Locognitive",
    title: "Quarantine Recording 2020",
  },
];

export default function MusicArchivePage() {
  return (
    <main className={styles.page}>
      <Link href="/music" className={styles.back}>
        ← sets
      </Link>
      <h1 className={styles.title}>Archive</h1>
      <p className={styles.lede}>
        Older SoundCloud drops and video — the live self-hosted sets live on{" "}
        <Link href="/music">/music</Link>.
      </p>

      <section className={styles.section} aria-labelledby="yt-heading">
        <h2 id="yt-heading" className={styles.sectionLabel}>
          Video
        </h2>
        <div className={styles.videoWrap}>
          <iframe
            src="https://www.youtube.com/embed/XzaZOPIYA-Q"
            title="Metacognitive Music video"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="archive-heading">
        <h2 id="archive-heading" className={styles.sectionLabel}>
          SoundCloud
        </h2>
        <div className={styles.scList}>
          {SOUNDCLOUD_TRACKS.map((track) => (
            <div key={track.url} className={styles.scItem}>
              <iframe
                height="166"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                title={`${track.artist} — ${track.title}`}
                src={track.url}
              />
              <div className={styles.scCaption}>
                {track.artist} · {track.title}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
