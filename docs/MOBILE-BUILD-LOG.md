# Halve Mobile — Build Log

Progress tracker for the Flutter mobile app build. One row per phase; details + the next-session handoff prompt appended as each phase completes. Plan of record: `~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md`.

**Working rhythm:** each phase is executed (largely delegated), verified, logged here, then committed/pushed. The session is then cleared and the handoff prompt below is pasted into a fresh session for the next phase.

## Status

| Phase | Title | Status |
|------:|-------|--------|
| 0 | Backend parity (record_solve RPC, practice pool, web align, auth deep-link) | ✅ done & committed |
| 1 | Monorepo scaffold | ⬜ not started |
| 2 | Design system | ⬜ |
| 3 | App shell | ⬜ |
| 4 | Supabase integration | ⬜ |
| 5 | On-device validator | ⬜ |
| 6 | Home screen | ⬜ |
| 7 | Play board | ⬜ |
| 8 | Win screen | ⬜ |
| 9 | First-run flow | ⬜ |
| 10 | Archive | ⬜ |
| 11 | Stats | ⬜ |
| 12 | Practice | ⬜ |
| 13 | Settings | ⬜ |
| 14 | Auth | ⬜ |
| 15 | Notifications | ⬜ |
| 16 | Tablet adaptive layouts | ⬜ |
| 17 | Android specifics | ⬜ |
| 18 | Polish | ⬜ |
| 19 | App store prep | ⬜ |

Legend: ⬜ not started · 🔄 in progress · ✅ done & committed · ⚠️ done, follow-up needed

---

## Phase 0 — Backend parity ✅ (2026-06-01)

**What shipped (files only — no DB push; you apply migrations when ready):**
- `supabase/migrations/20260601040000_record_solve.sql` — `record_solve(p_puzzle_id, p_grid, p_duration_ms, p_used_hint, p_local_date) → jsonb`. plpgsql, `SECURITY DEFINER`, pinned `search_path`, granted to `authenticated`. Faithful port of `apps/web/src/app/actions/record-solve.ts`: auth check, future-date reject, `local_date` ±1-day clamp, cell-by-cell grid==solution compare, `unique_violation` → `{ok:true, alreadySolved:true}`. Returns `{ok:true}` / `{ok:false, error:...}`.
- `supabase/migrations/20260601040100_practice_pool.sql` — `get_practice_puzzle(p_difficulty, p_seq default null) → table(id, difficulty, grid_spec)`. SQL `STABLE`, granted `anon, authenticated`. Selects the dateless pool, stable slot via `row_number() over (order by created_at, id)`; `p_seq` maps modulo pool size (the cross-platform parity / future-competition hook); NULL seq rotates deterministically by UTC day.
- `scripts/seed-practice-pool.ts` + `package.json` `seed-practice-pool` alias — generates N (default 50) dateless puzzles per difficulty via `@parity/engine` and inserts via service-role REST. Top-up idempotent; `--reset` rebuilds. **Not run yet** — run after applying migrations. Requires `pnpm --filter @parity/engine build` first (tsconfig maps `@parity/engine`→`dist`).
- `apps/web` practice now fetches from `get_practice_puzzle` instead of client-side `generatePuzzle()` (parity). Files: `app/practice/play/page.tsx` (now an async server component), new `components/screens/PracticeUnavailable.tsx` fallback, `lib/supabase/types.ts` (added the two RPCs to the hand-maintained `Functions` map), deleted `components/screens/PracticePlayClient.tsx`.
- `apps/mobile/AUTH-DEEPLINK-SETUP.md` — doc for Phase 4/14: scheme decision (`halve://auth-callback` + universal/App Links), Supabase redirect allow-list step, iOS/Android wiring.

**Decisions / corrections made during the phase:**
- **Practice solves are NOT recorded.** The agent initially passed `puzzleId` to the practice board so solves would record — reverted. `record_solve` rejects null-date puzzles, and recording would contaminate the daily streak (derived from `solves.local_date` with no practice filter). Practice now plays without writing a `solves` row, matching prior web behavior. Future practice competition needs its own results path keyed off the practice `puzzle.id` — NOT the `solves` table. (Resolves the plan's open "practice-solve recording" item.)
- Migration timestamps bumped to `…040000`/`…040100` because `…000000`/`…030000` were already taken by existing migrations.

**Verification:** `apps/web` `tsc --noEmit` exits 0 (re-run by me after the fix). Migrations read in full and confirmed faithful to the TS action. Seed-script engine imports resolve. **Not yet verified at runtime** (no DB push) — see follow-ups.

**Follow-ups for you (when ready to bring the backend live):**
1. `supabase db push` (or apply via your migration flow) to the linked project — verify the link first (ops rule).
2. `pnpm --filter @parity/engine build` then `pnpm seed-practice-pool` to populate the pool (otherwise web/app practice shows the graceful "unavailable" fallback).
3. Optional: migrate the web daily/archive solve path to call `record_solve` too, so the TS server action and the RPC don't drift (single source of truth). Left as-is for now.
4. `types.ts` `Functions` map is hand-maintained; if you adopt `supabase gen types` later it'll overwrite this block.

---

## Handoff prompt → Phase 1 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read its Phase 0 section first). Work on the existing feat/mobile-app branch.

Do Phase 1 — Monorepo scaffold:
1. flutter create --org today.halve --platforms ios,android apps/mobile  (apps/mobile already contains AUTH-DEEPLINK-SETUP.md — preserve it; create the Flutter project around/alongside it).
2. pubspec.yaml deps per plan Phase 1.2 (flutter_riverpod, riverpod_annotation, supabase_flutter, go_router, google_fonts, firebase_core, firebase_messaging, flutter_local_notifications, shared_preferences, share_plus, package_info_plus, url_launcher; dev: build_runner, riverpod_generator, custom_lint, riverpod_lint, flutter_lints, mocktail).
3. lib/ folder structure per plan 1.3.
4. analysis_options.yaml (flutter_lints + riverpod_lint/custom_lint).
5. Root convenience scripts (mobile:gen / mobile:test / mobile:analyze) — manual, NOT Melos.
6. CI: GitHub Actions mobile job (subosito/flutter-action → pub get, build_runner, analyze, test).
7. Update .gitignore for Flutter build artifacts.

Verify: flutter analyze clean + flutter test green (default smoke test). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 1 done + add a Phase 2 handoff prompt) and commit/push to feat/mobile-app. Use the same rhythm: delegate the bulk, verify yourself, then commit. Gotcha: this is Flutter, not pnpm — apps/mobile is not a pnpm workspace package; don't add it to pnpm-workspace.yaml.
```
