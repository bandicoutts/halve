# Vendored design handoff — READ-ONLY reference

This folder is a **frozen snapshot** of the Claude Design handoff bundle (`Lumen Design
System-handoff.zip`), vendored into the repo on 2026-05-29 so the Phase 2 UI work has a
durable, version-controlled reference instead of an ephemeral Downloads zip.

## Use it as a pixel + content reference, not as code to ship
- `ui_kits/app/*.jsx` — a working React recreation of all 7 screens (Auth, Onboarding,
  Home, Board, Win, Practice, Stats), plus `Board.jsx`, `primitives.jsx`, `symbols.jsx`,
  `game.jsx`. This is the **component spec** for Phase 2 — recreate the visual output in
  the real Next.js app; don't copy the prototype's structure verbatim.
- `preview/*.html` — design-system foundation cards (colors, type, spacing, components).
- `README.md` — content & voice rules (sentence case, `m:ss` times, no emoji, tone words,
  microcopy examples) and visual foundations. **Source of truth for UI copy.**

## Canonical tokens live OUTSIDE this folder
Do **not** theme against anything in here. The single source of truth for tokens is:
- `packages/design/styles/tokens.css` (CSS custom properties)
- `packages/design/src/tokens.ts` (typed mirror)

`handoff/colors_and_type.css` and `handoff/assets/` are duplicates kept only so the
snapshot stays self-contained. If they ever diverge, the files above win.
