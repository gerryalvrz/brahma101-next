<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Site rebuild (2026)

- **Homepage (`/`):** Operator portfolio + classic Matrix landing chrome. Copy/links in `src/data/home.ts`. Effects: `MatrixRain`, `ParticlesBackground`, `TerminalTyper`.
- **Visual system (from legacy `brahma101` index):** neon `#00ff00`, gradient `#0f0c29 → #032B2D → #24243e`, **VT323** display + **Courier New** body, green particle spheres, matrix rain @ 0.4 opacity, outline buttons that invert on hover.
- **IA:** `/research` links to `/music`, `/locognitive`, `/e8sel`, `/hack`, `/art`, `/prophet-and-the-fool`. `/writing` is a stub until MDX (see `docs/SITE_REBUILD_SPEC.md`, `content/writing/README.md`).
- **Locognitive:** React hub at `/locognitive` (`src/data/locognitive.ts`). Legacy experiment HTML is served as-is from `public/experiments/` (DES, tipper, glitch, mario, NFT pages) — do not rewrite those into React.
- **Metadata:** `(site)/layout.tsx` sets default OG/title; legacy client routes use nested `layout.tsx` where needed (`hack`, `locognitive`, `e8sel`).
