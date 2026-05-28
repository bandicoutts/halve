# Parity

Premium daily logic-puzzle web app — a 6×6 binary Latin-square puzzle (two opposite pieces, **fire & water**; adjacency + balance + `=`/`≠` edge constraints; unique deduction-only solutions). The name comes from the balance rule. Web-first (Next.js + Supabase + Vercel); Flutter mobile later.

## Repo map (pnpm monorepo)
- `apps/web` — Next.js 16 app (only frontend for now)
- `packages/engine` — pure TS puzzle generator + solver + validators (no deps, no DOM)
- `packages/design` — design tokens (color/space/type); single source of truth for styling
- `supabase/` — migrations, edge functions, seed
- `docs/` — context docs (read on demand, see below)

## Read docs only when relevant
- `docs/ARCHITECTURE.md` — system overview, data model, request flows
- `docs/GAME-RULES.md` — puzzle rules + engine spec (solver/generator/difficulty)
- `docs/DESIGN.md` — design system (tokens, type, motion, anti-AI guardrails)
- `docs/DECISIONS.md` — decision log; **append a new entry in the same commit as any architectural change**
- `docs/ROADMAP.md` — phases & milestone checklist

## Conventions (delta vs global CLAUDE.md)
Global Next.js 16 / Supabase / TypeScript rules apply and are not repeated here. Project-specific:
- The **design tokens in `packages/design` are the source of truth** — never hardcode colors/spacing in components.
- `packages/engine` is framework-agnostic and must stay fully unit-tested; UI depends on it, not vice versa.
- Streaks/stats are **derived from the `solves` table**, never denormalized.
