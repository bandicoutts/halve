# Roadmap

Phases & milestones. Check off as completed.

## Phase 0 — Foundation
- [x] Discovery + approved build plan
- [x] Context docs (ARCHITECTURE, GAME-RULES, DESIGN, DECISIONS, ROADMAP) + root CLAUDE.md
- [x] Claude Design wireframes generated (handoff bundle received + design system locked)
- [x] Init pnpm monorepo skeleton (`apps/web` stub, `packages/engine`, `packages/design`, `supabase/` stub)

## Phase 1 — Engine (`packages/engine`)
- [x] Board representation + constraint validators
- [x] Human-style deduction solver
- [x] Uniqueness checker (backtracking)
- [x] Generator (unique + deduction-only)
- [x] Difficulty scoring → Easy/Medium/Hard
- [x] Fuzz tests asserting invariants

## Phase 2 — Design system + board UI
- [x] Tokens in `packages/design`, wired into Tailwind
- [x] Lock symbol direction + typefaces
- [x] Interactive board component (tap-cycle, undo, hint)
- [x] Core interactions + solve animation
- [x] Board screen live at `/` (generated medium puzzle, full interactivity, light/dark toggle)

## Phase 3 — App shell + Supabase
- [x] Next.js routes + layout shell (Home `/`, Board `/play`, Practice `/practice` + `/practice/play`, Stats `/stats`, Auth `/auth` screens)
- [x] Schema + RLS migrations (`puzzles`, `profiles`, `solves`; RLS policies; auto-create profile trigger)
- [x] Daily-puzzle edge function (scheduled, idempotent, mints one puzzle/day)
- [x] Practice generation (client-side `useEffect`, avoids SSR mismatch)
- [x] Supabase Auth wired end-to-end (email + password sign-up/in, magic-link OTP, `/auth/callback` route)
- [x] Daily puzzle fetched from `puzzles` table (currently generated server-side)
- [x] Record solve to `solves` table on win
- [x] Auth-aware home screen (show streak when signed in)

## Phase 4 — Retention + sharing
- [x] Streaks/stats derived from `solves`
- [x] Shareable result card
- [x] Onboarding tutorial (4×4)

## Phase 5 — Mobile (Flutter)
- [ ] Port engine to Dart
- [ ] Flutter app against shared backend
