# Design system — Halve

**Direction: refined minimalism.** Generous whitespace, restrained palette, one confident accent, impeccable typography and hierarchy. The bar is the calm, premium feel of Things / Linear — never a generic dashboard or component-library look. Tokens live in `packages/design` and are the single source of truth; Tailwind reads from them via CSS variables.

> **Updated 2026-10-02 (BRAND-SYMBOLS-1, see DECISIONS.md):** the board symbols are now two complete hollow rings with different band widths; the website master mark uses matching amber and teal half-rings to form one open circle. Earlier fire/water and disc/ring descriptions remain only in frozen handoff files. Canonical colors remain in `packages/design` — `styles/tokens.css` and `src/tokens.ts`.

## Brand device: two rings, one open centre
The board symbols share a hollow circular form. **Symbol A** is a broad amber ring with a smaller transparent aperture; **symbol B** is a finer teal ring with a larger aperture. Their common outline makes them feel like a deliberate pair, while band width and colour keep them distinguishable at board size. The hole is transparent, so the cell or page surface shows through in paper and ink themes.

The website master mark joins two complementary half-rings into a complete circle. Its centre remains open. The mark connects to *Halve* through the two-part construction, without relying on elemental motifs or a literal yin-yang symbol.

## Palette (locked)
Neutrals are **warm**, never cold grey. Exactly **one accent** (amber); teal is the secondary symbol color, not a UI accent. Feedback colors appear only for correctness and stay distinct from the symbol colors.

| Role | Light (paper) | Dark (ink) |
|---|---|---|
| Page bg | `#F5F0E6` | `#161210` |
| Surface | `#FDFAF3` | `#1F1A15` |
| Surface raised | `#FFFFFF` | `#2A2418` |
| Primary fg | `#211B14` | `#EDE5D7` |
| Secondary fg | `#6E6455` | `#B4A990` |
| Muted fg | `#8A7F6E` | `#9A8F7E` |
| Hairline | `rgba(31,26,20,0.16)` | `rgba(233,223,205,0.15)` |
| **Accent (amber) — also symbol A** | `#DE5F27` | `#E8703A` |
| Accent strong (pressed) | `#C24E1C` | `#F2895A` |
| Accent tint | `rgba(222,95,39,0.12)` | `rgba(232,112,58,0.16)` |
| Symbol B (fine ring) | `#1E9C8F` | `#45BFB2` |
| Correct | `#4E8A66` | `#6FB389` |
| Wrong | `#C0442C` | `#D9553B` |
| Scrim (modal backdrop) | `rgba(10,8,6,0.62)` | `rgba(10,8,6,0.62)` |

Shadows are warm-tinted and soft on paper; **dark mode uses hairlines + surface lightening, not shadow.** Backgrounds are flat warm solids — no gradients, images, textures, or glassmorphism.

## Symbols & master mark
Drawn as **custom minimal vector art — never emoji**. Both board symbols share the same outer radius and use a transparent centre on a `0 0 100 100` viewBox:
- **Symbol A:** amber stroke, centreline radius 32, stroke width 20 — broad band, smaller aperture.
- **Symbol B:** teal stroke, centreline radius 35.75, stroke width 12.5 — finer band, larger aperture.

The **website master mark** (`Mark.tsx`) combines a left amber half-ring and a right teal half-ring, each with a 42-unit outer radius and a 22-unit inner radius. A short background-coloured divider separates the halves only where the ring material touches; the centre remains transparent. The **logo** pairs the mark with the wordmark "Halve".

## Typography (locked, updated 2026-07-03)
- **Three-family editorial system** (Google Fonts, `next/font`): **Newsreader** italic serif for display headlines (`--font-serif`), **Instrument Sans** for body/UI (`--font-sans`), **Spline Sans Mono** for kickers/labels/the timer (`--font-mono`). Replaces the original single-Space-Grotesk system — see DECISIONS.md WEB-DESIGN-1 (2026-07-03). **No Inter.**
- Numbers that change (timer, streak, stats) use **tabular numerals** (`font-variant-numeric: tabular-nums`) so digits never shift width.
- Scale (rem, `--text-*` tokens): h1 2.25 · h2 1.625 · h3 1.25 · body 1 · small 0.875 · label 0.75 (uppercase, `0.18em` tracked). Fluid display sizes via `clamp()`: `--text-display` (section headlines), `--text-hero` (home headline), `--text-jumbo` (win time / big stat numbers), `--text-timer` (play-screen timer).

## Spacing & radii (locked)
- **8-point spacing:** 0 · 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64 · 80 · 96. `--space-*` tokens exist in `packages/design` but components currently write raw px values on the 8pt grid rather than `var(--space-*)` — a deliberate, recorded choice (DECISIONS.md 2026-05-31) to keep spacing consistent app-wide rather than tokenizing one screen at a time. Adopting `var(--space-*)` everywhere is a valid future app-wide pass, not a one-file fix.
- **Radii:** sm 6 · md 10 · **cell 12** · lg 16 · xl 22 (large cards/sheets) · full (pills). Unlike spacing, radius values should always match this scale exactly — an off-scale radius (e.g. 14 or 20) is a bug, not a style choice.

## Icons
The shipped app settled on **text-first controls**, not an icon set: close/undo/hint/restart/share/stats are mono, uppercase, tracked text buttons or pills (`Pill`, `Button` with `variant="secondary"`), matching the editorial voice. Hand-drawn SVGs (`components/ui/icons.tsx`) exist only for a small set of genuinely wordless controls — theme toggle, hamburger/nav, sign-out — using ~1.75px stroke on a 24-unit viewBox to read like Lucide without the dependency. *(No `lucide-react`/CDN import exists in the app — the earlier "Lucide" substitution flag was superseded by this text-first direction. If icon-first controls are wanted for close/undo/hint/share/stats, that's a deliberate design change, not a missing implementation.)* The `=` / `≠` signs are typographic glyphs in a bg-filled capsule on cell edges — not icons.

## Layout & motion
- 8pt spacing system; generous whitespace.
- The **6×6 puzzle grid is the hero** of every game screen. `=`/`≠` signs sit on the edges between cells.
- Home pairs the daily entry with a static, labelled example board, independent of the daily puzzle. On narrow screens the title and play action come first; on desktop they sit beside the board. See `TASTE-REDESIGN-2026-10-01.md` for the audit and verification.
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
