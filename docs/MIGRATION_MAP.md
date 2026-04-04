# Migration Map — brahma101-next

## Source → Target mapping

| Legacy source | Next.js target | Type |
|---|---|---|
| `index.html` | `app/(site)/page.tsx` | Route |
| `pages/music.html` | `app/(site)/music/page.tsx` | Route |
| `pages/hack.html` | `app/(site)/hack/page.tsx` | Route |
| `pages/locognitive.html` | `app/(site)/locognitive/page.tsx` | Route |
| `pages/e8sel.html` | `app/(site)/e8sel/page.tsx` | Route |
| `assets/css/styling.css` | `app/globals.css` + Tailwind tokens | Styles |
| `assets/js/home/matrixrain.js` | `src/components/effects/MatrixRain.tsx` | Client component |
| `assets/js/home/initparticles.js` | `src/components/effects/ParticlesBackground.tsx` | Client component (dynamic import) |
| `assets/js/home/particles-fix.js` | Merged into ParticlesBackground.tsx | Absorbed |
| `assets/js/home/terminal.js` | `src/components/effects/TerminalTyper.tsx` | Client component |
| `assets/js/pages/sphereparticles.js` | `src/components/effects/SphereParticles.tsx` | Client component (Three.js dynamic) |
| `images/brahma101.gif` | `public/images/brahma101.gif` | Static asset |
| `favicon.png` | `public/favicon.png` + `app/favicon.ico` | Static asset |
| VT323 Google Font | `next/font/google` import | Font |
| particles.js CDN | `npm install particles.js` + dynamic import | Dependency |
| three.js CDN | `npm install three` + dynamic import | Dependency |

## Shared patterns to extract as components

| Pattern | Component | Used by |
|---|---|---|
| Back-to-menu button | `src/components/ui/BackButton.tsx` | locognitive, e8sel |
| Neon green button row | `src/components/ui/NeonButton.tsx` | index, music, locognitive |
| Terminal box | `src/components/effects/TerminalBox.tsx` | index |
| Typewriter text | `src/components/effects/TypewriterText.tsx` | index (2 instances) |
| Matrix rain canvas | `src/components/effects/MatrixRain.tsx` | index, locognitive |
| Footer with lunarpunk alert | `src/components/layout/Footer.tsx` | index |
| Glowing image | `src/components/ui/GlowImage.tsx` | index |
| ASCII loader | `src/components/effects/AsciiLoader.tsx` | locognitive |
| Section box with glow | `src/components/ui/GlowBox.tsx` | locognitive, e8sel |

## JS behaviors that must be ported

1. **Matrix rain** — canvas animation with kanji/symbols, semi-transparent fade
2. **particles.js** — background interactive particles (client-only, dynamic import)
3. **Terminal typing** — sequential message loop with blinking cursor
4. **Typewriter "The Art of"** — alternating words with type/delete cycle
5. **Typewriter "expect"** — same pattern, different words
6. **Lunarpunk alert** — `alert()` on footer click (convert to small modal)
7. **ASCII loader** — random ASCII art generation with text overlay, then fade to content (locognitive)
8. **Three.js sphere particles** — interactive 3D particle sphere (e8sel)
9. **Hack simulation** — 3D cubes + matrix + progress bar + fake data window (hack.html)
10. **Anomaly database** — interactive entries with filters, auth prompt, glitch effects (e8sel)

## Deferred (not in phase 1 scope)

| Item | Reason |
|---|---|
| `experiments/` folder | Out of scope per constraints |
| `experiments/DES/` | Archive as experiment |
| NFT collections | Archive as experiment |
| Games/simulations | Archive as experiment |
| Links to experiments from locognitive | Keep as links, point to legacy or placeholder |
