# Design system — Parity

**Direction: refined minimalism.** Generous whitespace, restrained palette, one confident accent, impeccable typography and hierarchy. The bar is the calm, premium feel of Things / Linear — never a generic dashboard or component-library look. Tokens live in `packages/design` and are the single source of truth; Tailwind reads from them via CSS variables.

## Brand device: elemental balance (fire ↔ water)
The two game pieces are **opposites** — a warm **flame** and a cool **droplet** — embodying the puzzle's `≠` rule and the name *Parity*. Warm vs cool is also the fastest visual "read" across the 36-cell grid. Light + dark modes are supported as a feature (warm "paper" / deep "ink"), but the signature is the elemental duality, not luminance.

## Palette (finalize tokens in packages/design)
- Canvas: warm off-white paper (light) / deep ink (dark) — neutrals are **warm**, not cold grey.
- **Fire = the single hero accent — amber-red.** One confident accent only.
- **Water = cool teal.**
- Success / error: used sparingly, only for solve/validation states, and kept visually distinct from the fire/water hues.

## Symbols
Two pieces, drawn as **custom minimal vector art — never emoji**:
- **Fire:** a clean, simple flame.
- **Water:** a single droplet.
Keep glyphs simple and iconic; let the warm/cool color contrast do most of the work (over-detailing elemental icons is the trap). The two must read instantly apart when repeated across the grid, and combine into **one balanced master mark** that survives the squint test at 44px — no muddy overlap (the earlier sun+moon mark failed this).

## Typography
- UI: a characterful grotesque (e.g. Hanken Grotesk / Geist / Söhne-like). **Avoid default Inter everywhere — it's the #1 tell of AI-generated UI.**
- Numbers (timers, stats): a refined **tabular numeral** face.
- Strong, deliberate type hierarchy.

## Layout & motion
- 8pt spacing system; generous whitespace.
- The **6×6 puzzle grid is the hero** of every game screen. `=`/`≠` signs sit on the edges between cells.
- Use asymmetry where it earns attention.
- Motion is tactile and confirming, never decorative: cell tap cycles empty → fire → water → empty; a satisfying solve animation; subtle haptics on mobile; restrained transitions.

## Anti-AI-aesthetic guardrails (hard no's)
No purple/blue gradients · no glassmorphism · no everything-centered layouts · no default Inter · no generic card grids · no emoji as iconography. Commit to **one signature element** and consistent restraint.

## Screens (v1)
Onboarding/how-to-play · Home (daily entry + streak) · Puzzle board · Solve/win + shareable card · Practice (difficulty select) · Stats/profile · Auth. The full Claude Design wireframe prompt is in the build plan.
