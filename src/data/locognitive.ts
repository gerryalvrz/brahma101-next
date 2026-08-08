/**
 * Locognitive hub links — mirrors brahma101/pages/locognitive.html
 * Experiment HTML is served statically from public/experiments/
 */

export interface LocognitiveLink {
  label: string;
  href: string;
}

export const locognitiveContent = {
  title: "Locognitive",
  collections: [
    { label: "Collection I", href: "/experiments/NFTs.html" },
    { label: "Collection II", href: "/experiments/nftii.html" },
  ] satisfies LocognitiveLink[],
  desTitle: "Dimension Explorer Service (D.E.S.)",
  desLinks: [
    { label: "Fractality", href: "/experiments/DES/transform.html" },
    {
      label: "Tipper Mind Hatch",
      href: "/experiments/tipper___jettison_mind_hatch_3d_model_by_SOFAKINGSADBOI/",
    },
    { label: "Jazzdimension", href: "/experiments/DES/jazzdimension.html" },
    {
      label: "Psychoactive Entropy",
      href: "/experiments/glitch_by_SLAY/index.html",
    },
    { label: "Iterate Reality", href: "/experiments/DES/iterate.html" },
    { label: "Cosmic Spaces", href: "/experiments/DES/cosmic.html" },
    { label: "Quantum Shaggy", href: "/experiments/DES/quantum.html" },
    { label: "Glitchy message", href: "/experiments/DES/glitchy.html" },
    { label: "Neuroreality", href: "/experiments/DES/neuroreality.html" },
    { label: "Psyched ride", href: "/experiments/DES/psyched.html" },
    { label: "Soft ripples", href: "/experiments/DES/ripples.html" },
    { label: "Planet E", href: "/experiments/DES/planet.html" },
    {
      label: "Mario",
      href: "/experiments/super_mario_64_speed_run_edition_by_Monkey_man/index.html",
    },
  ] satisfies LocognitiveLink[],
  drivePreview:
    "https://drive.google.com/file/d/1rpa77ZHDyOwN5h4tx2UpOQiaYwgZ2xI4/preview",
  soundCloudEmbed:
    "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/63156685&color=%2300ff00&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false",
  footerLink: {
    label: "Locognitive",
    href: "/experiments/tryy.html",
  } satisfies LocognitiveLink,
};
