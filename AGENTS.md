<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Site rebuild (2026)

- **Homepage (`/`):** Xbox-dashboard-inspired Matrix landing. Copy in `src/data/home.ts`. Atmosphere: dim `MatrixRain` + full-bleed `SphereGrid` + plasma + quiet particles. Hero: orb/`brahma101.gif` + brand left; NOW menu is folder blades (`work.now`) with project “files” listed under the active folder. ARCHIVE is a blog stub for later. `TerminalTyper` below the fold.
- **Visual system (from legacy `brahma101` index):** neon `#00ff00` / lime-yellow selection, gradient `#0f0c29 → #032B2D → #24243e`, **VT323** display + **Courier New** body, sphere-grid atmosphere, glass blade menu bars, outline buttons that invert on hover.
- **IA:** `/research` links to `/create-music`, `/art`, `/music`, `/locognitive`, `/e8sel`, `/hack`, `/prophet-and-the-fool`. Homepage NOW folder **Livecoding** → Create music + Generative art. `/writing` is a stub until MDX (see `docs/SITE_REBUILD_SPEC.md`, `content/writing/README.md`).
- **Art (`/art`):** Live `hydra-synth` canvas (not a fork of the full hydra editor). Sketches live in `src/data/art.ts`; UI in `src/components/art/HydraArt.tsx`. Client-only; `detectAudio: false`.
- **Create music (`/create-music`):** Live Strudel playground (custom UI). Patterns in `src/data/music.ts`; UI in `src/components/music/StrudelMusic.tsx`. Loads `@strudel/web` IIFE from `/public/vendor/strudel/` at runtime (not bundled — Turbopack cannot resolve its SharedWorker). Refresh vendor with `npm run copy:strudel` (also `postinstall`). AGPL.
- **Locognitive:** React hub at `/locognitive` (`src/data/locognitive.ts`). Legacy experiment HTML is served as-is from `public/experiments/` (DES, tipper, glitch, mario, NFT pages) — do not rewrite those into React.
- **Metadata:** `(site)/layout.tsx` sets default OG/title; legacy client routes use nested `layout.tsx` where needed (`hack`, `locognitive`, `e8sel`).
