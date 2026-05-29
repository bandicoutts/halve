# Design system — Parity

**Direction: refined minimalism.** Generous whitespace, restrained palette, one confident accent, impeccable typography and hierarchy. The bar is the calm, premium feel of Things / Linear — never a generic dashboard or component-library look. Tokens live in `packages/design` and are the single source of truth; Tailwind reads from them via CSS variables.

> **Locked v1 (2026-05-29):** tokens, type, and the fire/water symbols + master mark below are locked from the Claude Design handoff. The canonical values live in `packages/design` — `styles/tokens.css` (CSS custom properties) and `src/tokens.ts` (typed mirror). The tables here are the human-readable record; the package is authoritative.

## Brand device: elemental balance (fire ↔ water)
The two game pieces are **opposites** — a warm **flame** and a cool **droplet** — embodying the puzzle's `≠` rule and the name *Parity*. Warm vs cool is also the fastest visual "read" across the 36-cell grid. Light + dark modes are supported as a feature (warm "paper" / deep "ink"), but the signature is the elemental duality, not luminance.

## Palette (locked)
Neutrals are **warm**, never cold grey. Exactly **one accent** (fire); water is a secondary identity color, not a UI accent. Feedback colors appear only for correctness and stay distinct from fire/water.

| Role | Light (paper) | Dark (ink) |
|---|---|---|
| Page bg | `#F6F1E8` | `#14110B` |
| Surface | `#FBF8F1` | `#221D15` |
| Surface raised | `#FFFFFF` | `#2A2418` |
| Primary fg | `#211C15` | `#EFE8D9` |
| Secondary fg | `#6B6253` | `#A79D89` |
| Muted fg | `#9A9080` | `#6E6553` |
| Hairline | `#E4DDCD` | `#352E20` |
| **Accent (fire)** | `#B03E12` | `#E86B38` |
| Accent strong (pressed) | `#943210` | `#D45220` |
| Accent tint | `#F8E4DC` | `#38180E` |
| Fire symbol (disc) | `#D45220` | `#D45220` |
| Water symbol | `#2A7A6E` | `#6EC8BC` |
| Correct | `#4E8A66` | `#6FB389` |
| Wrong | `#C2564B` | `#DC7A6E` |

Shadows are warm-tinted and soft on paper; **dark mode uses hairlines + surface lightening, not shadow.** Backgrounds are flat warm solids — no gradients, images, textures, or glassmorphism.

## Symbols & master mark (locked)
Drawn as **custom minimal vector art — never emoji** (see `packages/design/assets/`). Both are teardrops on a `0 0 100 100` viewBox — genuine opposites:
- **Fire** (`symbol-fire.svg`): an amber-red teardrop pointing **up**, fill `#D45220`.
- **Water** (`symbol-water.svg`): a cool-teal teardrop pointing **down**, fill themed (`#2A7A6E` paper / `#6EC8BC` ink).

The warm/cool contrast does most of the work, so the two read instantly apart across the 36-cell grid. The **master mark** (`mark.svg`, `0 0 140 100`) places the upward flame and the downward droplet either side of a short warm→cool **bridge** expressing equilibrium — they sit side by side, never overlapping into a blob (the failure mode of the old sun+moon mark). The **app icon** (`app-icon.svg`) is the mark on a rounded `#F6F1E8` tile and stays crisp at 44px.

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
- Motion is tactile and confirming, never decorative: cell tap cycles empty → fire → water → empty; a satisfying solve animation; subtle haptics on mobile; restrained transitions.

## Anti-AI-aesthetic guardrails (hard no's)
No purple/blue gradients · no glassmorphism · no everything-centered layouts · no default Inter · no generic card grids · no emoji as iconography. Commit to **one signature element** and consistent restraint.

## Screens (v1)
Onboarding/how-to-play · Home (daily entry + streak) · Puzzle board · Solve/win + shareable card · Practice (difficulty select) · Stats/profile · Auth. The full Claude Design wireframe prompt is in the build plan.
