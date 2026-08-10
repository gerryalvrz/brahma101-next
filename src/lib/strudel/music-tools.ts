import {
  musicLessons,
  musicSketches,
  type MusicPattern,
} from "@/data/music";
import {
  buildShareUrl,
  diceMutate,
  readCodeFromUrl,
  stamp,
} from "@/lib/hydra/art-tools";

export const allMusicPatterns: MusicPattern[] = [
  ...musicLessons,
  ...musicSketches,
];

export { buildShareUrl, diceMutate, readCodeFromUrl, stamp };

export function pickRandomPattern(): MusicPattern {
  return allMusicPatterns[
    Math.floor(Math.random() * allMusicPatterns.length)
  ];
}

export function downloadText(
  filename: string,
  text: string,
  mime = "text/plain"
) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
