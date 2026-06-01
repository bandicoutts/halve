# Halve Mobile — Build Log

Progress tracker for the Flutter mobile app build. One row per phase; details + the next-session handoff prompt appended as each phase completes. Plan of record: `~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md`.

**Working rhythm:** each phase is executed (largely delegated), verified, logged here, then committed/pushed. The session is then cleared and the handoff prompt below is pasted into a fresh session for the next phase.

## Status

| Phase | Title | Status |
|------:|-------|--------|
| 0 | Backend parity (record_solve RPC, practice pool, web align, auth deep-link) | ✅ done & committed |
| 1 | Monorepo scaffold | ✅ done & committed |
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

## Phase 1 — Monorepo scaffold ✅ (2026-06-01)

**What shipped:**
- `apps/mobile/` — Flutter project created via `flutter create --org today.halve --project-name halve --platforms ios,android`. Bundle id `today.halve`, package name `halve`, iOS + Android only (no web/desktop). `AUTH-DEEPLINK-SETUP.md` preserved untouched.
- `pubspec.yaml` — all Phase 1.2 deps (flutter_riverpod 2.6, riverpod_annotation, supabase_flutter 2.12, go_router 14, google_fonts, firebase_core/messaging, flutter_local_notifications, shared_preferences, share_plus, package_info_plus, url_launcher; dev: build_runner, riverpod_generator, custom_lint, riverpod_lint, flutter_lints 6, mocktail). `pub get` resolves clean; `pubspec.lock` committed.
- `lib/` structure per plan 1.3: `theme/`, `engine/`, `data/{,models,repositories}`, `providers/`, `router/`, `widgets/`, `screens/{home,play,win,archive,stats,practice,settings,auth,tutorial,firstrun}`. Each leaf holds a one-line placeholder `.dart` naming the phase that fills it (keeps the dirs git-tracked + analyzer-clean).
- `lib/main.dart` — minimal `ProviderScope → MaterialApp` holding screen (real shell is Phase 3). `test/widget_test.dart` — boots `HalveApp`, asserts the holding screen renders.
- `analysis_options.yaml` — `flutter_lints` + `custom_lint` plugin (surfaces `riverpod_lint`). Excludes `build/**`, `.dart_tool/**`, generated `*.g.dart`/`*.freezed.dart`. A few extra rules (const constructors, avoid_print).
- Root `package.json` scripts (manual, NOT Melos): `mobile:gen` (build_runner), `mobile:test`, `mobile:analyze` — each `cd apps/mobile && …`.
- `.github/workflows/mobile.yml` — `mobile` job: `subosito/flutter-action@v2` (stable, pinned 3.44.0, cache) → pub get → build_runner → analyze → test. Path-filtered to `apps/mobile/**`; runs on PRs + push to main/feat/mobile-app. `working-directory: apps/mobile`.
- `.gitignore` — Flutter block expanded (ios/Pods, .symlinks, android/.gradle, .flutter-plugins*, apps/mobile/.idea); the flutter-generated `apps/mobile/.gitignore` carries the full per-package set.

**Decisions / notes:**
- **apps/mobile is NOT a pnpm workspace member.** `pnpm-workspace.yaml` globs `apps/*` but matches only dirs with a `package.json`; Flutter has none, so it's auto-excluded — verified via `pnpm ls -r`. No edit to `pnpm-workspace.yaml`.
- Flutter version pinned to **3.44.0** in CI to match the local toolchain (Dart 3.12); revisit when bumping locally.
- Analyzer initially flagged 13k errors from a stale `build/ios/SourcePackages/` (vendored Firebase SwiftPM checkout). Fixed by excluding `build/**` and removing the stale dir — `build/` is gitignored, never analyzed.
- Heads-up (non-blocking): `flutter_local_notifications` doesn't yet support iOS Swift Package Manager — Flutter prints a deprecation notice but CocoaPods still works. Revisit at Phase 15.

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → *All tests passed!* · `dart run build_runner build` → succeeds (0 outputs, no annotations yet). All run locally on Flutter 3.44.0.

---

## Handoff prompt → Phase 2 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read Phase 0 + Phase 1 sections first). Work on the existing feat/mobile-app branch. The apps/mobile Flutter scaffold (deps, lib/ structure, analyze+test green, CI) is in place from Phase 1.

Do Phase 2 — Design system (lib/theme/ + widgets/), per plan Phase 2:
1. app_colors.dart — mirror EVERY semantic token from packages/design/styles/tokens.css as light+dark palettes. Expose non-Material tokens (symbol-a/b, correct/wrong, hairline, tints) via a HalveColors ThemeExtension. Gotcha: symbol-a is identical in both themes; symbol-b shifts (light #2A7A6E → dark #6EC8BC).
2. app_spacing.dart + app_radii.dart — 8-pt scale (0,4,8,12,16,24,32,40,48,64,80,96); radii sm6/md10/cell12/lg16/xl22/full999.
3. app_typography.dart — GoogleFonts.spaceGrotesk TextTheme (display56/h1 36/h2 26/h3 20 w500; body16; small14; label12 w600 +0.08em UPPERCASE; timer44 w500). tabular() helper applying FontFeature.tabularFigures()+ss01 for timer/streak/stats.
4. app_theme.dart — ThemeData.light()/dark() wiring colors+type+HalveColors, useMaterial3:true, press-state splash/highlight tuning.
5. HalveShadows helper (sm/md/lg/cell per theme).
6. widgets/ primitives: HalveButton (press-scale 0.97, 160–220ms, no hover), HalveIconButton (Lucide-style, 1.75px stroke), HalveBottomSheet (platform-aware), Skeleton (calm fade, no shimmer), SymbolDisc/SymbolRing CustomPainters (disc r=42; ring outer 42 stroke 12 → inner r36), EqNeBadge (typographic =/≠ capsule).

Read packages/design/styles/tokens.css and docs/DESIGN.md (+ BRAND-CANON.md guardrails) before coding. Verify: golden tests for HalveButton, SymbolDisc/Ring, EqNeBadge in both themes + a widget test that HalveColors resolves per brightness; flutter analyze clean + flutter test green. Then update docs/MOBILE-BUILD-LOG.md (mark Phase 2 done + add a Phase 3 handoff prompt) and commit/push to feat/mobile-app. Gotcha: design tokens in packages/design are the source of truth — never hardcode colors/spacing.
```
