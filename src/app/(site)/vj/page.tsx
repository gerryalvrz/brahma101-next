import type { Metadata } from "next";
import VjStudio from "@/components/vj/VjStudio";

export const metadata: Metadata = {
  title: "VJ Studio",
  description:
    "Mix a local video with hydra-synth shaders. Preview is 1920×540 (32:9).",
};

export default function VjPage() {
  return <VjStudio />;
}
