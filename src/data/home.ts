/**
 * Homepage content — mirrors the classic brahma101 landing.
 * `work.now` = folder groups; each group's `projects` = files.
 * ARCHIVE is reserved for blog (separate UI later).
 */

export type ProjectStatus = "live" | "active" | "dev" | "beta";

export interface QuickLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface WorkProject {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

export interface WorkGroup {
  id: string;
  label: string;
  projects: WorkProject[];
}

export interface WorkContent {
  nowLabel: string;
  archiveLabel: string;
  contactLabel: string;
  now: WorkGroup[];
  /** Placeholder until blog UI ships */
  archiveHint: string;
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
    nowLabel: "LIVE",
    archiveLabel: "ARCHIVE",
    contactLabel: "CONTACT",
    archiveHint: "Writing / blog interface coming soon.",
    now: [
      {
        id: "agent-infra",
        label: "Agent infra",
        projects: [
          {
            id: "motusai",
            label: "MotusAI",
            href: "https://chat.motusdao.org/",
            external: true,
          },
          {
            id: "mcp",
            label: "MotusContextProtocol",
            href: "https://github.com/Motus-DAO/MotusContextProtocol-MCP",
            external: true,
          },
          {
            id: "root-agent",
            label: "Root Agent SDK",
            href: "https://github.com/Motus-DAO/RootAgent",
            external: true,
          },
          {
            id: "marketing-os",
            label: "Agentic Marketing OS",
            href: "https://marketing-os.motusdao.org/",
            external: true,
          },
          {
            id: "clinical-agents",
            label: "Clinical Research Agents",
            href: "https://agents.motusdao.org/",
            external: true,
          },
          {
            id: "rootrouter",
            label: "RootRouter",
            href: "https://rootrouter.motusdao.org/",
            external: true,
          },
        ],
      },
      {
        id: "ecosystem",
        label: "Ecosystem / LATAM",
        projects: [
          {
            id: "motusdao",
            label: "MotusDAO",
            href: "https://www.motusdao.org",
            external: true,
          },
          {
            id: "celomexico",
            label: "CeloMexico",
            href: "https://celo.mx",
            external: true,
          },
          {
            id: "latamhubs",
            label: "CeloLatamHubs",
            href: "https://latamhubs.lat/",
            external: true,
          },
          {
            id: "metaverso",
            label: "Metaverso",
            href: "https://metaverso.motusdao.org/",
            external: true,
          },
        ],
      },
      {
        id: "products",
        label: "Products",
        projects: [
          {
            id: "avril",
            label: "Avril",
            href: "https://app.avril.life",
            external: true,
          },
          {
            id: "neonpayments",
            label: "NeonPayments",
            href: "https://neonpayments.vercel.app/",
            external: true,
          },
          {
            id: "imm",
            label: "Impact Market Maker",
            href: "https://imm-jet.vercel.app/",
            external: true,
          },
          {
            id: "prism",
            label: "Prism Protocol",
            href: "https://prism-protocol-seven.vercel.app/",
            external: true,
          },
        ],
      },
      {
        id: "livecoding",
        label: "Livecoding",
        projects: [
          {
            id: "create-music",
            label: "Create music",
            href: "/create-music",
          },
          {
            id: "generative-art",
            label: "Generative art",
            href: "/art",
          },
        ],
      },
      {
        id: "research",
        label: "Research / art",
        projects: [
          { id: "locognitive", label: "Locognitive", href: "/locognitive" },
          { id: "e8sel", label: "E8 S.E.L.", href: "/e8sel" },
          { id: "music", label: "Metacognitive Music", href: "/music" },
        ],
      },
      {
        id: "earlier",
        label: "Earlier work",
        projects: [
          {
            id: "dormitorios",
            label: "Dormitorios",
            href: "https://dormitorios.plazabasilica.cc",
            external: true,
          },
          {
            id: "psychat-solana",
            label: "Psychat Solana",
            href: "https://psychat.motusdao.org/",
            external: true,
          },
          {
            id: "psychat-polka",
            label: "Psychat Polkadot & XX",
            href: "https://polka-psychat.vercel.app/",
            external: true,
          },
          {
            id: "eip-hnft",
            label: "EIP-HNFT",
            href: "https://ethereum-magicians.org/t/erc-to-be-assigned-hnft-human-non-fungible-token-standard/26048",
            external: true,
          },
          {
            id: "evvm",
            label: "EVVM",
            href: "https://github.com/Motus-DAO/EVVM-tryout",
            external: true,
          },
        ],
      },
    ],
  },
  contact: {
    title: "Contact me",
    subtitle:
      "Terminal style contact form. Write your name, email, phone, subject, and message. Then click send.",
  },
};
