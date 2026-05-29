---
name: parity-design
description: Use this skill to generate well-branded interfaces and assets for Parity, the premium daily logic-puzzle app, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key starting points:
- `README.md` — brand context, content fundamentals, visual foundations, iconography, and a file index.
- `colors_and_type.css` — all design tokens (light "paper" + dark "ink" themes, type scale, spacing, radii, shadows). Import this first.
- `assets/` — the fire/water game symbols, the equilibrium mark, and the app icon.
- `ui_kits/app/` — a working, interactive recreation of the app; lift components from here.
- `preview/` — small specimen cards for every foundation.

Non-negotiables: warm neutrals (never cold grey), one amber-red fire accent, Space Grotesk with tabular numerals, the light/dark duality, an 8-pt spacing system, and the 6×6 grid as the hero. No gradients, no glassmorphism, no emoji, sentence case everywhere.
