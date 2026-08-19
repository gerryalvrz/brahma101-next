<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## What this site is

Personal site of Gerry Alvarez / **brahma101.eth** — [brahma101.cyou](https://brahma101.cyou). Next.js 16 App Router. Audience: DevRel / ecosystem-lead hiring (Web3, agent infra, LATAM) plus readers of the research/art layer.

`docs/SITE_REBUILD_SPEC.md` still describes an **earlier** sectioned homepage (metrics → projects → hackathons → …). **Do not follow that spec for `/` layout.** Current homepage is the Xbox-dashboard Matrix landing below.

## Homepage (`/`) — current structure

**Copy:** `src/data/home.ts` (`homeContent`). Do not hardcode hero/LIVE labels in components.

**Data path:** server `src/app/(site)/page.tsx` loads writing metas → `ArchiveEntry[]` → client `HomeView` (`src/components/home/HomeView.tsx`).

**Above the fold (dashboard):** two columns inside `styles.dashboard`.

1. **Atmosphere (full viewport, behind content):** dim `MatrixRain` + plasma field + `SphereGrid` + `ParticlesBackground`. Decorative `DashboardChassis` in `engineFrame`.
2. **Left — orb column:** welcome line → `XboxOrb` (`/images/brahma101.gif`) → brand `brahma101.eth` → “The Art of” typewriter (`artOfWords`) → `welcomeSub`.
3. **Right — menu column:** `WorkLinks` with three chrome tabs:
   - **LIVE** (default) — Xbox blade folders on a rotary arc. Blades = top-level `work.live` folders. Nested folders open in the file tree under the arc (`live/{folder}/…`); files keep their existing routes/URLs. Wheel / ↑↓ / swipe changes blade (clamped, does not wrap). **Thinking** (last blade) is a portal: click it (or `Archive/` in its tree) to switch to the ARCHIVE tab.
   - **ARCHIVE** — same blade chrome: **Writing** (blogs & articles; two-step select → `/writing/[slug]`), **Research papers** (PDFs; two-step select → `/papers/[slug]`), plus empty libraries for **Images** and **Videos**. Empty writing copy: `work.archiveHint`.
   - **CONTACT ME** — smooth-scrolls to `#contact` (not a mode).

**LIVE folders (order in `homeContent.work.live`):** Agent infra & open source → MotusDAO → Avril → Ecosystem → Locognitive → Thinking (→ ARCHIVE).

**Below the fold:** narrative typewriter (“expect …”) + `narrative` sentence → terminal `ContactBox` (`#contact`, server action) → `Footer`.

`TerminalTyper` exists as a leftover component; it is **not** mounted on `/`.

**Visual system:** neon `#00ff00` / lime-yellow selection, gradient `#0f0c29 → #032B2D → #24243e`, **VT323** display + **Courier New** body, glass blades, outline buttons that invert on hover. Homepage CSS: `src/app/(site)/home.module.css`.

## Routes (IA)

| Route | What it is | Source |
|-------|------------|--------|
| `/` | Dashboard landing | `home.ts` + `HomeView` |
| `/writing` | Post index | `content/writing/*.md` via `src/lib/writing/` |
| `/writing/[slug]` | Terminal reader | same |
| `/papers` | Research PDF index | `content/papers/*.md` + `public/papers/*.pdf` |
| `/papers/[slug]` | PDF reader | same |
| `/art` | Live hydra-synth playground | `src/data/art.ts` + `HydraArt` |
| `/create-music` | Live Strudel playground | `src/data/music.ts` + `StrudelMusic` |
| `/research` | Quiet gateway to rabbit holes | `research/page.tsx` |
| `/locognitive` | React hub of experiment links | `src/data/locognitive.ts` |
| `/e8sel` | E8 S.E.L. | nested `layout.tsx` |
| `/music` | Metacognitive Music | — |
| `/hack` | Hack | nested `layout.tsx` |
| `/prophet-and-the-fool` | Book | — |

Homepage LIVE **Locognitive** → D.E.S. (`/locognitive`) + Images + Generative art + Create music + Metacognitive Music. **Thinking** opens ARCHIVE. `/research`, `/e8sel`, `/hack`, `/prophet-and-the-fool` stay as routes (contact `pages/` and `/research`), not LIVE blades.

**Generative art** for this rebuild is `/art` (hydra-synth sketches in `src/data/art.ts`). Do **not** open, rewrite, or summarize `public/experiments/` or DES HTML — those are large static blobs served as-is from the Locognitive hub.

## Writing / ARCHIVE

File-based Markdown + GFM. Filename = slug. Frontmatter: `title`, `date` (YYYY-MM-DD), `summary`, `tags`, `draft`. Drafts hidden in production. Supabase `posts` unused.

**Papers:** `content/papers/{slug}.md` + matching `public/papers/{slug}.pdf`. Same frontmatter. Loader: `src/lib/papers/`.

**How to publish writing:** project skill `.cursor/skills/writing-archive/SKILL.md` (explicit invoke). Also `content/writing/README.md` and `content/papers/README.md`.

## Livecoding (React)

- **Art (`/art`):** live `hydra-synth` canvas (not a fork of the full hydra editor). Client-only; `detectAudio: false` until toolbar audio. Hydra Assist: local quick-fixes + Venice `POST /api/hydra/assist` (`VENICE_API_KEY`). Docs pack: `src/data/hydraAssistDocs.ts`.
- **Create music (`/create-music`):** custom Strudel UI. Loads `@strudel/web` IIFE from `/public/vendor/strudel/` at runtime (not bundled — Turbopack cannot resolve its SharedWorker). Refresh vendor with `npm run copy:strudel` (also `postinstall`). AGPL. Strudel Assist: local quick-fixes + Venice `POST /api/strudel/assist`. Docs pack: `src/data/strudelAssistDocs.ts`.

## Locognitive

React hub at `/locognitive`. Legacy experiment HTML is served unchanged from `public/experiments/` (DES, tipper, glitch, mario, NFT pages). Link to those URLs; do not port them to React.

## Metadata

`(site)/layout.tsx` sets default OG/title. Nested `layout.tsx` where needed (`hack`, `locognitive`, `e8sel`).
