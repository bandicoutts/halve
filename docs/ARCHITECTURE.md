# Architecture

## What this is
Halve — a premium daily logic-puzzle web app (Flutter mobile later). The puzzle is a binary Latin-square: a 6×6 grid filled with two abstract symbols (**solid circle & ring**) under adjacency, balance, and `=`/`≠` edge constraints. See [GAME-RULES.md](GAME-RULES.md) for the rules and engine spec.

## Monorepo map (pnpm workspaces)
```
apps/web            Next.js 16 (App Router) web app
apps/mobile         Flutter app (Android/iOS) — same Supabase backend as web
packages/engine     pure TS: puzzle generator + solver + validators (no deps, no DOM)
packages/design     design tokens (color/space/type) — single source of truth
supabase/           migrations, edge functions, seed
docs/               these context docs
```
The Flutter app re-implements the engine rules in Dart (`packages/engine` logic is not shared at the package level — the Dart port lives in `apps/mobile/lib/`) and shares the same Supabase backend (same `puzzles`/`solves`/`profiles` schema, same `record_solve` RPC).

### Mobile shell structure
The Flutter app uses go_router with a `StatefulShellRoute` for the three main tabs (Today / Archive / Stats). A persistent `_HalveShellBar` (logo + settings) sits above the tab content in `AppShell`; the shell's `SafeArea(top: true)` consumes the status-bar inset so tab screens' own `SafeArea` adds nothing. Full-screen routes (Play, Win, Settings, Tutorial, Auth) live outside the shell and own their own chrome.

## Request flows
- **Daily puzzle:** a scheduled Supabase Edge Function mints one puzzle/day at a fixed difficulty into `puzzles` keyed by date. All users fetch the same row → shared daily.
- **Practice:** puzzle generated on demand (edge function or client — 6×6 generation is cheap).
- **Solve:** on completion, the web app writes a `solves` row. Streaks/stats are **derived** from `solves`, not denormalized.
- **Auth:** Supabase Auth from day one; per-user data protected by RLS.

## Data model (Supabase, RLS-protected)
- `puzzles` — id, date (nullable for practice), difficulty, grid spec (solution + given cells + edge constraints), seed.
- `profiles` — user id (FK auth.users), display name, created_at.
- `solves` — user id, puzzle id, solved_at, duration_ms, used_hint. One row per solve.
- RLS: users read/write only their own `profiles`/`solves`; `puzzles` world-readable, writes restricted to service role / edge function.

## Conventions
- Next.js 16, Supabase, and TypeScript conventions are inherited from the global CLAUDE.md — not repeated here.
- The engine is framework-agnostic and fully unit-tested before any UI consumes it.
