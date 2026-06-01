# Vendored design handoff — READ-ONLY reference

This folder is a **frozen snapshot** of the Claude Design handoff bundle (`Lumen Design
System-handoff.zip`), vendored into the repo on 2026-05-29 so the Phase 2 UI work has a
durable, version-controlled reference instead of an ephemeral Downloads zip.

> ## ⚠️ Game-symbol identity is SUPERSEDED
> This snapshot predates the **Halve rebrand (2026-05-30)** by one day. Throughout this
> bundle the two game symbols are described and drawn as **fire** (amber-red teardrop,
> pointing up) and **water** (cool-teal teardrop, pointing down). **That is no longer the
> brand.** The symbols are now two abstract, balance-rule-derived marks: a **solid disc**
> (symbol A, amber) and a **ring / open circle** (symbol B, teal), and the master mark is a
> single circle split vertically. The fire/water teardrops here — both the prose *and* the
> teardrop SVGs in `assets/`, `symbols.jsx`, and `preview/*.html` — are kept only as a
> historical record of the original handoff; **do not reproduce them in the live app.**
>
> For the current symbol identity and master mark, the authoritative sources are:
> - `../../../docs/DESIGN.md` (human-readable design record, incl. the rebrand note)
> - `packages/design/styles/tokens.css` + `packages/design/src/tokens.ts` (canonical tokens
>   — `--symbol-a` = amber disc, `--symbol-b` = teal ring)
>
> Everything else in this snapshot (voice, type, spacing, layout, microcopy, the 8-pt
> system, light/dark duality) remains a valid reference.

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
