import type { Metadata } from "next";
import MusicPortfolio from "@/components/music/MusicPortfolio";
import { musicSets, setsContent } from "@/data/sets";

export const metadata: Metadata = {
  title: setsContent.title,
  description: "Self-hosted DJ sets — Metacognitive Music.",
};

export default function MusicPage() {
  return <MusicPortfolio sets={musicSets} />;
}
