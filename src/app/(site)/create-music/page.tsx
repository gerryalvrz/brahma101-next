import type { Metadata } from "next";
import StrudelMusic from "@/components/music/StrudelMusic";

export const metadata: Metadata = {
  title: "Create Music",
  description:
    "Livecoded algorithmic music powered by Strudel — brahma101 research layer.",
};

export default function CreateMusicPage() {
  return <StrudelMusic />;
}
