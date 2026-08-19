/**
 * Homepage content — mirrors the classic brahma101 landing.
 * LIVE / ARCHIVE blades are folders. Nested folders are WorkFolder children;
 * links are WorkFile leaves. Writing posts are injected into ARCHIVE at render.
 */

export type ProjectStatus = "live" | "active" | "dev" | "beta";

export interface QuickLink {
  label: string;
  href: string;
  external?: boolean;
}

export type WorkFile = {
  kind: "file";
  id: string;
  label: string;
  href: string;
  external?: boolean;
};

export type WorkFolder = {
  kind: "folder";
  id: string;
  label: string;
  children: WorkNode[];
};

export type WorkNode = WorkFile | WorkFolder;

/** LIVE blade that switches the chrome to ARCHIVE (Thinking → record). */
export type ArchivePortalBlade = {
  kind: "archive-portal";
  id: string;
  label: string;
};

/** ARCHIVE blade with no files yet (papers / images / videos). */
export type ArchiveLibraryBlade = {
  kind: "library";
  id: string;
  label: string;
  hint: string;
};

/** ARCHIVE blade that renders the writing track list instead of a file tree. */
export type ArchiveWritingBlade = {
  kind: "writing";
  id: "writing";
  label: string;
};

export type LiveBlade = WorkFolder | ArchivePortalBlade;
export type ArchiveBlade =
  | ArchiveWritingBlade
  | ArchiveLibraryBlade
  | WorkFolder;

export type WorkBlade = LiveBlade | ArchiveBlade;

export interface WorkContent {
  liveLabel: string;
  archiveLabel: string;
  contactLabel: string;
  live: LiveBlade[];
  archive: ArchiveBlade[];
  /** Empty-state text when the writing archive has no published entries */
  archiveHint: string;
}

export function isWorkFolder(node: WorkNode | WorkBlade): node is WorkFolder {
  return node.kind === "folder";
}

export function isWorkFile(node: WorkNode): node is WorkFile {
  return node.kind === "file";
}

export function isArchivePortal(
  blade: WorkBlade
): blade is ArchivePortalBlade {
  return blade.kind === "archive-portal";
}

export function isArchiveLibrary(
  blade: WorkBlade
): blade is ArchiveLibraryBlade {
  return blade.kind === "library";
}

export function isArchiveWriting(
  blade: WorkBlade
): blade is ArchiveWritingBlade {
  return blade.kind === "writing";
}

export function liveFolders(live: LiveBlade[]): WorkFolder[] {
  return live.filter(isWorkFolder);
}

/** Slim, client-safe slice of a writing post for the ARCHIVE list. */
export interface ArchiveEntry {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  draft: boolean;
}

export interface HeroContent {
  brand: string;
  welcome: string;
  welcomeSub: string;
  artOfWords: string[];
  expectWords: string[];
  narrative: string;
  /** @deprecated portfolio fields — kept optional for portfolio/Hero.tsx */
  name?: string;
  role?: string;
  positioning?: string;
  pills?: string[];
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface MetricCard {
  id: string;
  title: string;
  lines: string[];
}

export interface ProjectCard {
  name: string;
  status: ProjectStatus;
  description: string;
  href: string;
}

export interface HackathonItem {
  title: string;
  detail?: string;
}

export interface MediaPlaceholder {
  title: string;
  description: string;
}

export interface WritingPlaceholder {
  title: string;
  description: string;
}

export interface CommunityItem {
  name: string;
  role: string;
}

export interface ContactLink {
  label: string;
  href: string;
}

export interface AboutContent {
  paragraphs: string[];
  researchCta: string;
  researchHref: string;
}

export interface ContactFormContent {
  title: string;
  subtitle: string;
}

export interface HomeContent {
  hero: HeroContent;
  work: WorkContent;
  contact: ContactFormContent;
}

export const homeContent: HomeContent = {
  hero: {
    brand: "brahma101.eth",
    welcome: "Welcome to the dance of Dimensions",
    welcomeSub: "No one to hold accountable, but yourself.",
    artOfWords: ["(r)evolution", "creation"],
    expectWords: ["chaos", "(r)evolution"],
    narrative: "Weaving the unseen threads of reality into manifested forms.",
  },
  work: {
    liveLabel: "LIVE",
    archiveLabel: "ARCHIVE",
    contactLabel: "CONTACT ME",
    archiveHint: "No entries in the archive yet.",
    live: [
      {
        kind: "folder",
        id: "oss",
        label: "Agent infra & open source",
        children: [
          {
            kind: "file",
            id: "rootrouter",
            label: "RootRouter",
            href: "https://rootrouter.motusdao.org/",
            external: true,
          },
          {
            kind: "file",
            id: "MotusContextProtocol",
            label: "MotusContextProtocol",
            href: "https://github.com/Motus-DAO/MotusContextProtocol-MCP",
            external: true,
          },
          {
            kind: "file",
            id: "root-agent",
            label: "Root Agent",
            href: "https://github.com/Motus-DAO/RootAgent",
            external: true,
          },
          {
            kind: "file",
            id: "prism",
            label: "Prism Protocol",
            href: "https://prism-protocol-seven.vercel.app/",
            external: true,
          },
          {
            kind: "folder",
            id: "research-harness",
            label: "Research Harness",
            children: [
              {
                kind: "file",
                id: "hugs-id-research",
                label: "HUGS ID research",
                href: "https://github.com/gerryalvrz/hugs-id-research",
                external: true,
              },
              {
                kind: "file",
                id: "motusdao-research-harness",
                label: "MotusDAO research harness",
                href: "https://github.com/gerryalvrz/motusdao-research-harness",
                external: true,
              },
            ],
          },
        ],
      },
      {
        kind: "folder",
        id: "motusdao",
        label: "MotusDAO",
        children: [
          {
            kind: "file",
            id: "motusdao-landing",
            label: "Landing",
            href: "https://www.motusdao.org",
            external: true,
          },
          {
            kind: "file",
            id: "motusdao-app",
            label: "App",
            href: "https://app.motusdao.org",
            external: true,
          },
          {
            kind: "file",
            id: "motusai",
            label: "MotusAI",
            href: "https://chat.motusdao.org/",
            external: true,
          },
          {
            kind: "file",
            id: "motusdao-agents",
            label: "Agents",
            href: "https://agents.motusdao.org/",
            external: true,
          },
          {
            kind: "file",
            id: "metaverso",
            label: "Metaverso",
            href: "https://metaverso.motusdao.org/",
            external: true,
          },
          {
            kind: "file",
            id: "motusdao-docs",
            label: "Docs",
            href: "https://motusdao.gitbook.io/enter-motusdao",
            external: true,
          },
          {
            kind: "file",
            id: "eip-hnft",
            label: "HNFT EIP",
            href: "https://ethereum-magicians.org/t/erc-to-be-assigned-hnft-human-non-fungible-token-standard/26048",
            external: true,
          },
        ],
      },
      {
        kind: "folder",
        id: "avril",
        label: "Avril",
        children: [
          {
            kind: "folder",
            id: "avril-systems",
            label: "avril.systems",
            children: [
              {
                kind: "file",
                id: "dormitorios",
                label: "Dormitorios",
                href: "https://dormitorios.plazabasilica.cc",
                external: true,
              },
            ],
          },
          {
            kind: "folder",
            id: "avril-life",
            label: "avril.life",
            children: [
              {
                kind: "file",
                id: "vibe-founding",
                label: "Vibe Founding",
                href: "https://app.avril.life",
                external: true,
              },
            ],
          },
        ],
      },
      {
        kind: "folder",
        id: "ecosystem",
        label: "Ecosystem",
        children: [
          {
            kind: "folder",
            id: "celomexico",
            label: "CeloMexico",
            children: [
              {
                kind: "file",
                id: "celomexico-site",
                label: "CeloMexico",
                href: "https://celo.mx",
                external: true,
              },
              {
                kind: "file",
                id: "celomexico-academy",
                label: "Academy",
                href: "https://celo.mx/academy",
                external: true,
              },
              {
                kind: "file",
                id: "celomexico-marketplace",
                label: "Marketplace",
                href: "https://celo.mx/marketplace",
                external: true,
              },
              {
                kind: "file",
                id: "celomexico-proyectos",
                label: "Proyectos",
                href: "https://www.celo.mx/proyectos",
                external: true,
              },
              {
                kind: "file",
                id: "neonpayments",
                label: "NeonPayments",
                href: "https://neonpayments.vercel.app/",
                external: true,
              },
            ],
          },
          {
            kind: "file",
            id: "latamhubs",
            label: "CeloLatamHubs",
            href: "https://latamhubs.lat/",
            external: true,
          },
          {
            kind: "folder",
            id: "imm",
            label: "Impact Market Maker (backlog)",
            children: [
              {
                kind: "file",
                id: "imm-site",
                label: "Site",
                href: "https://imm-jet.vercel.app/",
                external: true,
              },
              {
                kind: "file",
                id: "imm-docs",
                label: "Docs",
                href: "https://docs.google.com/document/d/1aTUaVFSvcLJ_LIiKt6X9Z7BQ7SIKJbzDLdpSoh6vdtc/edit?usp=sharing",
                external: true,
              },
            ],
          },
        ],
      },
      {
        kind: "folder",
        id: "locognitive",
        label: "Locognitive",
        children: [
          {
            kind: "file",
            id: "des",
            label: "D.E.S.",
            href: "/locognitive",
          },
          {
            kind: "folder",
            id: "locognitive-images",
            label: "Images",
            children: [
              {
                kind: "file",
                id: "nft-i",
                label: "Collection I",
                href: "/experiments/NFTs.html",
              },
              {
                kind: "file",
                id: "nft-ii",
                label: "Collection II",
                href: "/experiments/nftii.html",
              },
            ],
          },
          {
            kind: "file",
            id: "generative-art",
            label: "Generative Art",
            href: "/art",
          },
          {
            kind: "file",
            id: "create-music",
            label: "Create Music",
            href: "/create-music",
          },
          {
            kind: "file",
            id: "music",
            label: "Metacognitive Music",
            href: "/music",
          },
        ],
      },
      {
        kind: "archive-portal",
        id: "thinking",
        label: "Thinking",
      },
    ],
    archive: [
      { kind: "writing", id: "writing", label: "Writing" },
      {
        kind: "library",
        id: "papers",
        label: "Research papers",
        hint: "No PDFs in the library yet.",
      },
      {
        kind: "library",
        id: "images",
        label: "Images",
        hint: "No images in the library yet.",
      },
      {
        kind: "library",
        id: "videos",
        label: "Videos",
        hint: "No videos in the library yet.",
      },
    ],
  },
  contact: {
    title: "Contact me",
    subtitle:
      "Terminal style contact form. Write your name, email, phone, subject, and message. Then click send.",
  },
};

