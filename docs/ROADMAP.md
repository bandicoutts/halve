# Roadmap

Phases & milestones. Check off as completed.

## Phase 0 — Foundation
- [x] Discovery + approved build plan
- [x] Context docs (ARCHITECTURE, GAME-RULES, DESIGN, DECISIONS, ROADMAP) + root CLAUDE.md
- [ ] Claude Design wireframes generated (prompt in build plan)
- [ ] Init pnpm monorepo skeleton (`apps/web`, `packages/engine`, `packages/design`, `supabase/`)

## Phase 1 — Engine (`packages/engine`)
- [ ] Board representation + constraint validators
- [ ] Human-style deduction solver
- [ ] Uniqueness checker (backtracking)
- [ ] Generator (unique + deduction-only)
- [ ] Difficulty scoring → Easy/Medium/Hard
- [ ] Fuzz tests asserting invariants

## Phase 2 — Design system + board UI
- [ ] Tokens in `packages/design`, wired into Tailwind
- [ ] Lock symbol direction + typefaces
- [ ] Interactive board component (tap-cycle, undo, hint)
- [ ] Core interactions + solve animation
- [ ] Wireframes → high-fidelity screens

## Phase 3 — App shell + Supabase
- [ ] Next.js routes + layout shell
- [ ] Supabase Auth (email + social)
- [ ] Schema + RLS migrations
- [ ] Daily-puzzle edge function (scheduled)
- [ ] Practice generation

## Phase 4 — Retention + sharing
- [ ] Streaks/stats derived from `solves`
- [ ] Shareable result card
- [ ] Onboarding tutorial (4×4)

## Phase 5 — Mobile (Flutter)
- [ ] Port engine to Dart
- [ ] Flutter app against shared backend
