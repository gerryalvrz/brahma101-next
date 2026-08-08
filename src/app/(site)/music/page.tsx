import NeonButton from "@/components/ui/NeonButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metacognitive Music",
  description: "Curated DJ sets and interdimensional circus.",
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

export default function MusicPage() {
  return (
    <main className="flex flex-col items-center min-h-screen p-5">
      <div className="text-center p-5 border-2 border-neon rounded-[10px] bg-black/60 mt-5 w-[90%] max-w-[600px]">
        <h1 className="font-vt323 text-3xl text-neon mb-2.5">
          Metacognitive Music
        </h1>
        <p>
          Enjoy this curated DJ sets to immerse yourself in the
          interdimensional circus!
        </p>

        {/* YouTube embed */}
        <iframe
          className="mt-5 border-none w-[560px] h-[315px] max-w-[90%]"
          src="https://www.youtube.com/embed/XzaZOPIYA-Q"
          allowFullScreen
        />

        {/* SoundCloud players */}
        <div className="my-5 mx-auto text-center w-full max-w-[600px]">
          {SOUNDCLOUD_TRACKS.map((track, i) => (
            <div key={i} className="mb-4">
              <iframe
                width="100%"
                height="300"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={track.url}
              />
              <div className="text-[10px] text-[#cccccc] truncate">
                {track.artist} · {track.title}
              </div>
            </div>
          ))}
        </div>

        <NeonButton href="/">Back to Home</NeonButton>
      </div>
    </main>
  );
}
