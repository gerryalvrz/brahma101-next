import type { Metadata } from "next";
import HydraArt from "@/components/art/HydraArt";

export const metadata: Metadata = {
  title: "Art",
  description:
    "Livecoded generative visuals powered by hydra-synth — brahma101 research layer.",
};

export default function ArtPage() {
  return <HydraArt />;
}
