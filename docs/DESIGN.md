# Design system — Lumen

**Direction: refined minimalism.** Generous whitespace, restrained palette, one confident accent, impeccable typography and hierarchy. The bar is the calm, premium feel of Things / Linear — never a generic dashboard or component-library look. Tokens live in `packages/design` and are the single source of truth; Tailwind reads from them via CSS variables.

## Brand device: light/dark duality
The sun/moon duality of the puzzle is the brand. **Light mode = warm "paper"**, **dark mode = deep "ink"**. The mode toggle is part of the identity, not an afterthought.

## Palette (finalize tokens in packages/design)
- Canvas: warm off-white paper (light) / deep ink (dark) — neutrals are **warm**, not cold grey.
- Accent: derived from the **sun** — warm amber-gold. One confident accent only.
- Moon: cool slate-indigo.
- Success / error: used sparingly, only for solve/validation states.

## Symbols
Two symbols, drawn as **custom minimal vector art — never emoji**. Direction options (lock in Phase 2):
1. **Refined celestial (recommended start):** solid warm disc (sun) + cool crescent (moon).
2. Pure geometric: filled circle / hollow ring.
3. Hybrid: geometric core with a subtle celestial gradient.

## Typography
- UI: a characterful grotesque (e.g. Hanken Grotesk / Geist / Söhne-like). **Avoid default Inter everywhere — it's the #1 tell of AI-generated UI.**
- Numbers (timers, stats): a refined **tabular numeral** face.
- Strong, deliberate type hierarchy.

## Layout & motion
- 8pt spacing system; generous whitespace.
- The **6×6 puzzle grid is the hero** of every game screen. `=`/`≠` signs sit on the edges between cells.
- Use asymmetry where it earns attention.
- Motion is tactile and confirming, never decorative: cell tap cycles empty → sun → moon → empty; a satisfying solve animation; subtle haptics on mobile; restrained transitions.

## Anti-AI-aesthetic guardrails (hard no's)
No purple/blue gradients · no glassmorphism · no everything-centered layouts · no default Inter · no generic card grids · no emoji as iconography. Commit to **one signature element** and consistent restraint.

## Screens (v1)
Onboarding/how-to-play · Home (daily entry + streak) · Puzzle board · Solve/win + shareable card · Practice (difficulty select) · Stats/profile · Auth. The full Claude Design wireframe prompt is in the build plan.
