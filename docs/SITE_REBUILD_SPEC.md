# Brahma101.cyou — Personal Site Rebuild Spec (working doc)

Condensed from the full Claude brief. **Single source of truth** for structure; edit `src/data/home.ts` for copy without touching layout logic.

## Goals

- **Primary audience:** DevRel / Ecosystem Lead hiring managers (Web3 protocols, agent infra, LATAM).
- **Secondary:** Technical readers who discover the Brahma101 / research layer.
- **Rule:** First viewport = operator credibility (shipped work, metrics). Mystical identity = typography, motion, discoverable easter eggs — not homepage IA.

**IA reference (structure only):** [paulburg-com](https://github.com/PaulBurgEth/paulburg-com) — Hero → Work → Media → Writing → Projects → Communities → About.

## Visual identity (summary)

- Dark / cypherpunk base; mono-leaning headers, readable body sans.
- Motion: subtle; never block content or accessibility.
- `brahma101.gif`: not dominant on new `/` — About or `/research` context.
- `/art`: stub for future Hydra fork.

## Execution phases

### Phase A — Credibility front door (`/`)

| Sub-phase | Scope | Done when |
|-----------|--------|-----------|
| **A1** | Hero + Track record + anchors | Metrics grid live; CTAs scroll to `#contact` / `#projects` |
| **A2** | Projects + Hackathons + Media placeholders | All driven by `src/data/home.ts` |
| **A3** | Writing stub + Communities + About + Contact + footer | About copy human; contact links work |
| **A4** | Meta/OG, Lighthouse polish, tone down conflicting effects | Deploy clean |

**Home sections (order):** Hero → Track record → Active projects → Hackathons → Media → Writing → Communities → About → Contact → Footer.

### Phase B — Research / easter egg layer

- `/research` index linking to `/music`, `/locognitive`, `/e8sel`, `/hack`, `/art`, `/prophet-and-the-fool`.
- Polish existing routes; no removal.

### Phase C — Content engine

- MDX (or equivalent) at `/writing`; first real posts; optional newsletter later.

### Deferred (do not build until needed)

- Personal mentorship/services pages  
- Newsletter signup without content  
- i18n toggle  
- Dashboard / auth  

## Implementation rules

1. Content lives in **`src/data/home.ts`** (typed); components stay dumb.
2. Mobile-first: 375 / 768 / 1280.
3. Existing routes `/music`, `/locognitive`, `/e8sel`, `/hack` must keep working.
4. Update **`AGENTS.md`** when IA or conventions change.

## Repo map

| Path | Role |
|------|------|
| `src/data/home.ts` | All homepage + stub list copy |
| `src/components/portfolio/*` | Section components |
| `src/app/(site)/page.tsx` | Composes homepage |
| `src/app/(site)/writing/page.tsx` | Writing index stub |
| `src/app/(site)/research/page.tsx` | Gateway to easter eggs |
| `content/writing/` | Future MDX/posts (Phase C) |
