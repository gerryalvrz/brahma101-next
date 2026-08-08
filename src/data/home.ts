/**
 * Homepage content — mirrors the classic brahma101 landing.
 * Portfolio section types remain for unused portfolio/* components.
 */

export type ProjectStatus = "live" | "active" | "dev" | "beta";

export interface QuickLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface HeroContent {
  brand: string;
  welcome: string;
  welcomeSub: string;
  artOfWords: string[];
  expectWords: string[];
  narrative: string;
  quickLinks: QuickLink[];
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

export interface HomeContent {
  hero: HeroContent;
}

export const homeContent: HomeContent = {
  hero: {
    brand: "brahma101.eth",
    welcome: "Welcome to the dance of Dimensions",
    welcomeSub: "No one to hold accountable, but yourself.",
    artOfWords: ["(r)evolution", "creation"],
    expectWords: ["chaos", "(r)evolution"],
    narrative: "Weaving the unseen threads of reality into manifested forms.",
    quickLinks: [
      { label: "MotusDAO", href: "https://www.motusdao.org", external: true },
      { label: "CeloMexico", href: "https://celo.mx", external: true },
      { label: "Metacognitive Music", href: "/music" },
      { label: "Locognitive", href: "/locognitive" },
      { label: "E8 S.E.L.", href: "/e8sel" },
      {
        label: "Impact Market Maker",
        href: "https://imm-jet.vercel.app/",
        external: true,
      },
      { label: "Avril", href: "https://app.avril.life", external: true },
      {
        label: "NeonPayments",
        href: "https://neonpayments.vercel.app/",
        external: true,
      },
      {
        label: "Dormitorios",
        href: "https://dormitorios.plazabasilica.cc",
        external: true,
      },
      {
        label: "Metaverso",
        href: "https://metaverso.motusdao.org/",
        external: true,
      },
      {
        label: "Agentic Marketing OS",
        href: "https://marketing-os.motusdao.org/",
        external: true,
      },
      {
        label: "MotusContextProtocol",
        href: "https://github.com/Motus-DAO/MotusContextProtocol-MCP",
        external: true,
      },
      {
        label: "MotusAI",
        href: "https://chat.motusdao.org/",
        external: true,
      },
      {
        label: "Prism Protocol",
        href: "https://prism-protocol-seven.vercel.app/",
        external: true,
      },
      {
        label: "Clinical Research Agents",
        href: "https://agents.motusdao.org/",
        external: true,
      },
      {
        label: "Root Agent SDK",
        href: "https://github.com/Motus-DAO/RootAgent",
        external: true,
      },
      {
        label: "EVVM",
        href: "https://github.com/Motus-DAO/EVVM-tryout",
        external: true,
      },
      {
        label: "Psychat Polkadot & XXNetwork",
        href: "https://polka-psychat.vercel.app/",
        external: true,
      },
      {
        label: "Psychat Solana",
        href: "https://psychat.motusdao.org/",
        external: true,
      },
      {
        label: "EIP-HNFT",
        href: "https://ethereum-magicians.org/t/erc-to-be-assigned-hnft-human-non-fungible-token-standard/26048",
        external: true,
      },
      {
        label: "CeloLatamHubs",
        href: "https://latamhubs.lat/",
        external: true,
      },
      {
        label: "RootRouter",
        href: "https://rootrouter.motusdao.org/",
        external: true,
      },
    ],
  },
};
