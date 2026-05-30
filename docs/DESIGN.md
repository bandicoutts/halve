# Design system — Halve

**Direction: refined minimalism.** Generous whitespace, restrained palette, one confident accent, impeccable typography and hierarchy. The bar is the calm, premium feel of Things / Linear — never a generic dashboard or component-library look. Tokens live in `packages/design` and are the single source of truth; Tailwind reads from them via CSS variables.

> **Locked v1 (2026-05-29):** original tokens and type locked from the Claude Design handoff. **Updated 2026-05-30:** symbols and master mark replaced as part of the Halve rebrand (fire/water teardrops → solid circle / ring; split-circle mark). Canonical values live in `packages/design` — `styles/tokens.css` (CSS custom properties) and `src/tokens.ts` (typed mirror). The tables here are the human-readable record; the package is authoritative.

## Brand device: halved circle (solid ↔ ring)
The two game pieces are abstract geometric opposites — a **solid circle** (symbol A, amber) and an **outlined ring** (symbol B, teal). Together they form a complete circle: one fills space, the other defines it. This directly embodies the puzzle's core mechanic — every row and column is exactly half one, half the other. The warm/cool colour contrast provides the fastest visual read across the 36-cell grid. Light + dark modes are supported (warm "paper" / deep "ink"); the signature is the geometric duality, not any elemental metaphor.

## Palette (locked)
Neutrals are **warm**, never cold grey. Exactly **one accent** (amber); teal is the secondary symbol color, not a UI accent. Feedback colors appear only for correctness and stay distinct from the symbol colors.

| Role | Light (paper) | Dark (ink) |
|---|---|---|
| Page bg | `#F6F1E8` | `#14110B` |
| Surface | `#FBF8F1` | `#221D15` |
| Surface raised | `#FFFFFF` | `#2A2418` |
| Primary fg | `#211C15` | `#EFE8D9` |
| Secondary fg | `#6B6253` | `#A79D89` |
| Muted fg | `#9A9080` | `#6E6553` |
| Hairline | `#E4DDCD` | `#352E20` |
| **Accent (amber)** | `#B03E12` | `#E86B38` |
| Accent strong (pressed) | `#943210` | `#D45220` |
| Accent tint | `#F8E4DC` | `#38180E` |
| Symbol A (solid disc) | `#D45220` | `#D45220` |
| Symbol B (ring) | `#2A7A6E` | `#6EC8BC` |
| Correct | `#4E8A66` | `#6FB389` |
| Wrong | `#C2564B` | `#DC7A6E` |

Shadows are warm-tinted and soft on paper; **dark mode uses hairlines + surface lightening, not shadow.** Backgrounds are flat warm solids — no gradients, images, textures, or glassmorphism.

## Symbols & master mark
Drawn as **custom minimal vector art — never emoji**. Both on a `0 0 100 100` viewBox:
- **Symbol A** (solid): `<circle cx="50" cy="50" r="42" fill="--symbol-a" />` — amber filled disc.
- **Symbol B** (ring): `<circle cx="50" cy="50" r="36" stroke="--symbol-b" strokeWidth="12" fill="none" />` — teal outlined ring. Outer radius matches symbol A (42px) for visual balance.

The warm/cool contrast + solid/outline contrast together ensure the two read instantly apart across the 36-cell grid. The **master mark** (`Mark.tsx`, `0 0 100 100`) is a single circle split by a vertical line: left half filled amber (A), right half filled teal (B), with a hairline divider. Directly represents the name *Halve* — one shape, cleanly bisected. The **logo** pairs the mark with the wordmark "Halve" in Space Grotesk 600.

## Typography (locked)
- **Single typeface: Space Grotesk** (Google Fonts), weights 300–700 — wordmark through body. Display/headings 500 with `-0.02em` tracking. **No second typeface. No Inter.** *(Substitution flag: swap to a licensed brand face by replacing `--font-sans` if commissioned.)*
- Numbers that change (timer, streak, stats) use **tabular numerals** (`font-variant-numeric: tabular-nums`) so digits never shift width.
- Scale (px): display 56 · h1 36 · h2 26 · h3 20 · body 16 · small 14 · label 12 (uppercase, `0.08em` tracked) · timer 44.

## Spacing & radii (locked)
- **8-point spacing:** 0 · 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64 · 80 · 96.
- **Radii:** sm 6 · md 10 · **cell 12** · lg 16 · xl 22 (large cards/sheets) · full (pills).

## Icons
UI icons: **Lucide** (CDN), even ~1.75px stroke, 20–22px, color secondary fg — used only where unavoidable (undo, hint, share, settings, chevrons, close, stats, streak flame-as-line-glyph). *(Substitution flag: no icon set was provided; swap if custom icons are commissioned.)* The `=` / `≠` signs are typographic glyphs in a bg-filled capsule on cell edges — not icons.

## Layout & motion
- 8pt spacing system; generous whitespace.
- The **6×6 puzzle grid is the hero** of every game screen. `=`/`≠` signs sit on the edges between cells.
- Use asymmetry where it earns attention.
- Motion is tactile and confirming, never decorative: cell tap cycles empty → A → B → empty; a satisfying solve animation; subtle haptics on mobile; restrained transitions.

## Anti-AI-aesthetic guardrails (hard no's)
No purple/blue gradients · no glassmorphism · no everything-centered layouts · no default Inter · no generic card grids · no emoji as iconography. Commit to **one signature element** and consistent restraint.

## Screens (v1)
Onboarding/how-to-play · Home (daily entry + streak) · Puzzle board · Solve/win + shareable card · Practice (difficulty select) · Stats/profile · Auth. The full Claude Design wireframe prompt is in the build plan.

## Reference: vendored design handoff
The Claude Design handoff is vendored (read-only) at `packages/design/handoff/` — see its `VENDORED.md`. Use it as the pixel + component reference for Phase 2:
- `handoff/ui_kits/app/*.jsx` — working React recreation of all 7 screens + the board, primitives, symbols, and game hook (the component spec).
- `handoff/preview/*.html` — foundation cards (colors, type, spacing, components).
- `handoff/README.md` — **voice & content rules** (sentence case everywhere; `m:ss` times; no emoji; tone words; microcopy examples) — the source of truth for UI copy.

Canonical tokens remain `packages/design` (`styles/tokens.css` + `src/tokens.ts`), never the handoff's copies.
