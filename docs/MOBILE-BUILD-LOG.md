# Halve Mobile — Build Log

Progress tracker for the Flutter mobile app build. One row per phase; details + the next-session handoff prompt appended as each phase completes. Plan of record: `~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md`.

**Working rhythm:** each phase is executed (largely delegated), verified, logged here, then committed/pushed. The session is then cleared and the handoff prompt below is pasted into a fresh session for the next phase.

## Status

| Phase | Title | Status |
|------:|-------|--------|
| 0 | Backend parity (record_solve RPC, practice pool, web align, auth deep-link) | ✅ done & committed |
| 1 | Monorepo scaffold | ✅ done & committed |
| 2 | Design system | ✅ done & committed |
| 3 | App shell | ✅ done & committed |
| 4 | Supabase integration | ✅ done & committed |
| 5 | On-device validator | ✅ done & committed |
| 6 | Home screen | ✅ done & committed |
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

---

## Phase 2 — Design system ✅ (2026-06-01)

**New reference used:** the user supplied a mobile-specific design handoff (`~/Downloads/halve (4).zip`) — HTML/JSX wireframes of all app screens in the **correct disc/ring brand** (the vendored `packages/design/handoff/` kit is the older fire/water build and is now superseded for mobile visuals). Key files: `app/HANDOFF.md` (screen specs, tap targets, nav z-stack, persistence keys), `app/halve.css` (token mirror), `app/screens/symbols.jsx` (Disc/Ring/Mark/Button/IconButton primitives, ported 1:1 here). The zip lives in Downloads, not the repo — it informs Phase 2 **and Phase 3 (app shell)** and beyond; pull it back in next session.

**What shipped — `lib/theme/`:**
- `app_colors.dart` — `HalvePalette` (raw reference values) + `HalveColors` `ThemeExtension` with **every** semantic token from `tokens.css` (surfaces, fg-1/2/3, hairlines, accent + strong/tint/on, symbol-a/b, correct/wrong + tints) as `const light`/`dark`. `symbolA` identical both themes; `symbolB` shifts (teal `#2A7A6E` → teal-bright `#6EC8BC`). **Repo `tokens.css` wins over the wireframe's drifted `halve.css`:** light fg-3 = `clay-550 #746B5A`, dark fg-3 = `dust-400 #928873` (AA-compliant), not the wireframe's `clay-500`/`dust-500`.
- `app_spacing.dart` (`AppSpacing.s0…s11`, 8-pt) · `app_radii.dart` (`sm6/md10/cell12/lg16/xl22/full999` + `*R` `BorderRadius` helpers).
- `app_typography.dart` — Space Grotesk styles (display56/h1 36/h2 26/h3 20 w500; body16; small14; label12 w600 +0.08em; timer44 w500 tabular). em→px letter-spacing pre-multiplied. `tabular()` helper (tnum + ss01). `textTheme(HalveColors)` maps onto Material slots. **Weight driven via `FontVariation('wght', …)` on the bundled variable font** (see decision below).
- `app_shadows.dart` — `HalveShadows` `ThemeExtension` (sm/md/lg/cell `List<BoxShadow>` per theme), CSS box-shadow → BoxShadow offset/blur/spread.
- `app_theme.dart` — `AppTheme.light()/dark()`: M3 `ColorScheme` from tokens, `scaffoldBackgroundColor=bg`, `textTheme`, **no ripple** (`NoSplash` + transparent splash/highlight — primitives confirm with a press-scale, per motion rules), registers both extensions. `context.halveColors` / `context.halveShadows` accessors.
- `theme.dart` — barrel export.

**What shipped — `lib/widgets/`:**
- `symbols.dart` — `SymbolDisc` (CustomPainter, r=0.42·size fill), `SymbolRing` (stroke 0.12·size at r=0.36 → outer 0.42 matches disc), `HalveMark` (circle bisected by vertical hairline, left amber / right teal). All default to theme symbol colors, accept overrides.
- `halve_button.dart` — `HalveButton` (primary/secondary, press-scale 0.97 @120ms, `full`, `leadingIcon`, disabled→opacity 0.4). `halve_icon_button.dart` — `HalveIconButton` (48px circular, press-scale 0.94, `active` accent ring, `Semantics`). `eq_ne_badge.dart` — `EqNeBadge` (`=`/`≠` glyph in bg-filled capsule + sm shadow). `skeleton.dart` — `Skeleton` (opacity 1↔0.42 breathing fade, **no shimmer**). `halve_bottom_sheet.dart` — `showHalveBottomSheet()` (surfaceRaised, 24px top radius, scrim; iOS drag handle).
- `widgets.dart` — barrel. `main.dart` now boots the real light/dark themes (`ThemeMode.system`) with a holding screen exercising Mark + Disc + Ring (full shell is Phase 3).

**Decision (logged in `docs/DECISIONS.md`): Space Grotesk bundled, `google_fonts` dropped.** `google_fonts` now hard-throws with `allowRuntimeFetching=false` and wants per-weight static assets (`SpaceGrotesk-Medium.ttf` …), but upstream ships only the variable font. Bundled `assets/fonts/SpaceGrotesk-VariableFont_wght.ttf` (+ `OFL.txt`) as a normal Flutter font family, weight via `FontVariation`. Offline, deterministic, no FOUT, one fewer dep. `pubspec.yaml`: removed `google_fonts`, added `flutter.fonts` entry.

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → **16/16 pass** (12 goldens: HalveButton primary/secondary, SymbolDisc/Ring, EqNeBadge eq/ne — each light+dark; 3 HalveColors-per-brightness; 1 Phase-1 smoke). `dart run build_runner build` → 0 outputs (no annotations). Goldens generated with the bundled font loaded via `test/flutter_test_config.dart` (real glyphs, not tofu) inside a `Material` harness (no debug underline). Visually eyeballed: amber pill, teal-bright ring on ink, `≠` capsule, hairline secondary button — all faithful.

**Follow-ups / heads-up:**
1. Goldens are committed under `test/widgets/goldens/`; regenerate with `flutter test --update-goldens` if the font or primitives change. They render with the bundled font so they're stable cross-machine, but CI runs on Linux — if antialiasing differs, re-baseline on CI once.
2. `flutter_local_notifications` SwiftPM deprecation notice persists (non-blocking; Phase 15).

---

## Handoff prompt → Phase 3 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 2 section first; skim Phase 0–1). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: a mobile design handoff is at ~/Downloads/halve (4).zip — unzip it and read app/HANDOFF.md + app/screens/*.jsx. These are the CORRECT disc/ring wireframes for the whole app (the repo's packages/design/handoff/ is the older fire/water build — do NOT use it for mobile visuals). HANDOFF.md §"Navigation architecture" gives the exact z-index screen stack, entry points, and tap-target minimums; app/screens/nav.jsx + home.jsx (HalveApp shell) + frames/*.jsx show the intended shell. The Phase 2 design system (lib/theme + lib/widgets, both themes, analyze+test green) is in place — reuse HalveButton/HalveIconButton/HalveBottomSheet/Skeleton/Symbol*/EqNeBadge and the context.halveColors/halveShadows accessors; never hardcode colors/spacing.

Do Phase 3 — App shell, per plan Phase 3:
1. main.dart — ProviderScope → Supabase.initialize → MaterialApp.router. themeMode: ThemeMode.system (Settings override comes in Phase 13). (Supabase init can be a stub/guarded until Phase 4 wires real env — keep flutter run working.)
2. router/app_router.dart — go_router routes: / (home), /play, /play/:date, /archive, /stats, /practice, /practice/play?difficulty=, /settings, /auth, /tutorial, /firstrun. StatefulShellRoute for the Home/Archive/Stats bottom-tab branches.
3. Platform-adaptive bottom tab bar (anchored, not floating): iOS = bare labelled icons; Android = M3 NavigationBar with accent-pill active indicator. Auto-hide nav during Play (Play is a full-screen route outside the shell; its header = back + difficulty only). Match app/screens/nav.jsx.
4. SafeScaffold wrapper using MediaQuery.viewPadding (status bar + home indicator); reduced-motion aware via MediaQuery.disableAnimations.
5. Screens stay as placeholders (filled in Phases 6–14) — this phase is navigation + chrome only.

Verify: widget test that tabs switch branches and that the Play route hides the tab bar; flutter analyze clean + flutter test green (existing 16 tests still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 3 done + add a Phase 4 handoff prompt) and commit/push to feat/mobile-app. Gotcha: signOut must use scope:local; design tokens are the source of truth.
```

---

## Phase 3 — App shell ✅ (2026-06-01)

**What shipped — navigation + chrome (screens stay placeholders until Phases 6–14):**
- `router/app_router.dart` — `createAppRouter()` (go_router). `Routes` constants + helpers (`playDate`, `practicePlay`). **`StatefulShellRoute.indexedStack`** with 3 branches (Home `/`, Archive `/archive`, Stats `/stats`) — each keeps its own nav state. Full-screen routes pushed **outside** the shell: `/play`, `/play/:date`, `/practice`, `/practice/play?difficulty=`, `/settings`, `/auth`, `/tutorial`, `/firstrun`. `AppShell` widget = `Scaffold(body: navigationShell, bottomNavigationBar: HalveBottomNav)`; re-tapping the active tab pops it to root (`goBranch(initialLocation: i==current)`). **Play hides the tab bar by construction** — it's a top-level route, not a shell branch, so the bar is simply absent (no auto-hide logic). Flutter's `Scaffold` lays body above the nav, so no manual content bottom-padding (unlike the web absolute-positioned version).
- `main.dart` — `WidgetsFlutterBinding.ensureInitialized()` → **guarded** `Supabase.initialize` (only if `SUPABASE_URL`/`SUPABASE_ANON_KEY` `--dart-define`s are present; try/caught; logs + continues as guest otherwise — keeps `flutter run` working until Phase 4) → `ProviderScope` → `MaterialApp.router` with `themeMode: ThemeMode.system` (Settings override = Phase 13). Router built once in `State`.
- `widgets/halve_bottom_nav.dart` — `HalveBottomNav`, anchored, platform-adaptive (`app/screens/nav.jsx`): **Android** = M3 `NavigationBar`, active glyph in an `accentTint` pill; **iOS** = bare labelled icons row with hairline top border, active in accent.
- `widgets/nav_glyphs.dart` — `TodayGlyph` (the split-circle brand mark: active fills amber/teal halves, inactive = outlined split circle), `ArchiveGlyph` (calendar), `StatsGlyph` (bars). CustomPainters; active Archive/Stats tint accent, inactive fg-3.
- `widgets/safe_scaffold.dart` — `SafeScaffold` (paints `bg`, `SafeArea` top by default, `safeBottom` opt-in for full-screen routes), + `context.reduceMotion` extension (`MediaQuery.disableAnimationsOf`).
- `widgets/halve_top_bar.dart` — `HalveTopBar` (flat, non-Material chrome): leading back / custom leading, title centered on iOS / left on Android, trailing. Back chevron uses `HalveIconButton`.
- `screens/phase_placeholder.dart` — shared `PhasePlaceholder` (brand mark + title + phase note + action buttons) so every screen is walkable.
- All 11 screen placeholders filled with `SafeScaffold` + `PhasePlaceholder`, wired with real entry points: Home → Play (`push /play`), Practice (`/practice`), Settings gear (`/settings`); Archive → Play today + a sample `/play/2026-05-31`; Practice → `/practice/play?difficulty=medium`; Settings → Auth; First-run → `go /`. `PlayScreen` is generic (daily / `date` / `isPractice`+`difficulty`), header = back + difficulty label only.

**Android build fix (blocker, made here):** the first `flutter run` on Android failed — `flutter_local_notifications` requires **core library desugaring**. Added `isCoreLibraryDesugaringEnabled = true` + `coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")` to `android/app/build.gradle.kts`. (Strictly a Phase 17 "Android specifics" item, but it blocked all Android builds, so fixed now.) iOS built/ran clean.

**Icon note:** incidental chrome icons (back chevron, settings gear) use Material outline icons (`Icons.chevron_left`, `Icons.settings_outlined`) for now — the bespoke Lucide line glyphs land with the real screens (Phases 6–14) where icons carry weight. The signature tab glyphs ARE custom (`nav_glyphs.dart`).

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → **18/18** (the 16 Phase-2 tests + 2 new shell tests: tabs switch Home→Archive→Stats with the bar mounted throughout; `/play` hides `HalveBottomNav` and Back restores it). Ran live on the **iOS simulator (iPhone 17 Pro)** and **Android emulator (API 37)** via `flutter run` — both boot the shell, tabs switch, Play covers full-screen.

**Follow-ups:**
1. `main.dart` runs without Supabase until Phase 4 supplies `--dart-define` creds (or a `.env`/launch config). Auth deep-link wiring is documented in `apps/mobile/AUTH-DEEPLINK-SETUP.md`.
2. Pushed-route page transitions use go_router defaults; `context.reduceMotion` is available to suppress them later if desired (not yet applied).

---

## Handoff prompt → Phase 4 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 3 section first; skim Phase 0–2). Work on the existing feat/mobile-app branch.

Context in place: the app shell (go_router StatefulShellRoute for Home/Archive/Stats + full-screen Play/Practice/Settings/Auth routes, adaptive bottom nav, SafeScaffold, guarded Supabase.initialize in main.dart) and the Phase 2 design system. analyze + 18 tests green. Backend parity (Phase 0) shipped the record_solve RPC + get_practice_puzzle pool + auth deep-link doc (apps/mobile/AUTH-DEEPLINK-SETUP.md) — read the Phase 0 section.

Do Phase 4 — Supabase integration (lib/data/), per plan Phase 4:
1. supabase_client.dart — wire the real init (env via --dart-define SUPABASE_URL/SUPABASE_ANON_KEY; the guard already exists in main.dart). createAdminClient NEVER on the client (global rule).
2. auth_repository.dart — magic-link: signInWithOtp(email, emailRedirectTo: <deep link halve://auth-callback>); handle session via onAuthStateChange; expose authStateProvider (Riverpod) → guest vs signed-in. Gotcha: signOut(scope: SignOutScope.local) ALWAYS, never global. Validate any redirect `next` param against a whitelist. Configure the Supabase redirect allow-list + iOS Universal Link / Android App Link per AUTH-DEEPLINK-SETUP.md.
3. models/ — Dart models: Puzzle (size, givens, edges, solution, difficulty), Edge, SolveRow, ArchiveDay, Stats. JSON (de)serialize mirroring grid_spec; cells are int?/0/1/null; validate 6×6.
4. puzzle_repository.dart — fetchDaily(localDate) (puzzles by date, maybeSingle), fetchArchive(today) (date not null, lte today), fetchPracticePuzzle(difficulty, seq?) via get_practice_puzzle RPC. NO client-side daily fallback generation (no Dart generator) — offline = cache (Phase 6), not regeneration.
5. solve_repository.dart — recordSolve({puzzleId, grid, durationMs, usedHint, localDate}) → record_solve RPC (handle alreadySolved + network retry); fetchSolves(userId) for stats/archive/home streak.

Verify: unit tests for model JSON round-trip + mocked (mocktail) repository tests for query shapes and recordSolve error handling; flutter analyze clean + flutter test green (existing 18 pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 4 done + add a Phase 5 handoff prompt) and commit/push to feat/mobile-app. Gotchas: signOut scope:local; never expose service role; streaks derive from solves (never denormalized); design tokens are the source of truth.
```

---

## Phase 4 — Supabase integration ✅ (2026-06-01)

**What shipped — `lib/data/` + `lib/providers/`:**
- `data/supabase_client.dart` — `supabaseUrl`/`supabaseAnonKey` (`--dart-define`), `isSupabaseConfigured`, `initSupabase()` (no-op + returns false when unconfigured → guest mode), `supabase` getter, and **`authRedirectUrl = 'halve://auth-callback'`** (custom scheme; must match the Supabase redirect allow-list — see `AUTH-DEEPLINK-SETUP.md`). `main.dart` now calls `initSupabase()`.
- `data/models/` — `puzzle.dart` (`Difficulty`/`EdgeOrientation`/`EdgeKind` enums, `Edge`, `Puzzle`, typedefs `Cell`/`Grid`/`Solution`). **`Puzzle.tryParse` is a faithful Dart port of the web `parseGridSpec`** (apps/web/src/lib/grid-spec.ts): validates solution 6×6 of 0/1, givens agree with solution, edges in-bounds + consistent with the solution; returns null on any malformation (corrupt row treated like missing). `solve.dart` (`SolveRow`, `RecordSolveResult` with `ok`/`alreadySolved`/`error` + `networkFailure` sentinel for retry). `archive_day.dart` (`ArchiveDay` + `withSolves` join). `stats.dart` (`Stats.fromSolves` — derived current/longest streak by local day, null-`local_date` → UTC-of-`solved_at` fallback per DECISIONS BE-3; **derived, never denormalized**). `models.dart` barrel.
- `data/repositories/` — `AuthRepository` (magic link via `signInWithMagicLink` → `signInWithOtp(emailRedirectTo: authRedirectUrl)`; `onAuthStateChange`; **`signOut(scope: SignOutScope.local)`** — global rule), `PuzzleRepository` (`fetchDaily(localDate)` eq date maybeSingle, `fetchByDate`, `fetchArchive(today)` date-not-null ≤ today ordered, `withSolves` in-memory intersection, `fetchPracticePuzzle(difficulty, seq?)` via `get_practice_puzzle` RPC — **no client-side daily generation**, offline = cache in Phase 6), `SolveRepository` (`recordSolve` via `record_solve` RPC, catches transport errors → `networkFailure`; `fetchSolves(userId)`). RPC param maps extracted as static helpers for testing.
- `providers/providers.dart` — Riverpod (manual, no codegen): `supabaseClientProvider` (throws in guest mode), `authRepositoryProvider`, `puzzleRepositoryProvider`, `solveRepositoryProvider`, `authStateProvider` (StreamProvider; empty stream in guest mode), `currentUserProvider`, `isSignedInProvider`. Guest-safe (no read at startup; screens wire these in Phases 6+).

**Decisions / notes:**
- **Manual Riverpod providers, not codegen** — clearer, zero generated `.g.dart` churn this phase. `@riverpod` codegen is set up (build_runner) and can be adopted later.
- **Repository test strategy:** rather than mock the brittle PostgREST fluent chain, the pure boundaries are unit-tested — model round-trips, `Puzzle.tryParse` rejection cases (bad difficulty, wrong solution size, given/solution disagreement, out-of-bounds edge, edge inconsistent with solution), `RecordSolveResult.fromRpc`, and the extracted RPC param maps. `AuthRepository` IS mocked (mocktail `GoTrueClient`) to lock the two critical contracts: `signOut` uses **local** scope (never global), and the magic link sends the `halve://auth-callback` redirect.
- `record_solve`/`get_practice_puzzle` RPCs themselves shipped in Phase 0 (not pushed to the DB yet — see Phase 0 follow-ups). The Dart side mirrors their signatures exactly.

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → **45/45** (the 18 prior + 27 new: model parse/round-trip/rejection, Stats streaks, `RecordSolveResult` parsing, param builders, mocked auth scope/redirect). App still boots + navigates on iOS sim + Android emulator (data layer is dormant until Phase 6 wires it).

**Follow-ups:**
1. Backend must be live for real data: apply Phase 0 migrations + seed the practice pool (Phase 0 follow-ups), then run with `--dart-define SUPABASE_URL=… --dart-define SUPABASE_ANON_KEY=…`.
2. Deep-link platform config (iOS Associated Domains / Android intent filter) + Supabase allow-list entry still required for magic-link round-trip — `AUTH-DEEPLINK-SETUP.md`, completed in Phase 14.
3. `Stats.fromSolves` streak rule is provisional; Phase 11 reconciles it against the web's canonical `computeStreak`.

---

## Handoff prompt → Phase 5 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 4 section first; skim 0–3). Work on the existing feat/mobile-app branch.

Context in place: design system (lib/theme + lib/widgets), app shell (go_router + adaptive nav), and the data layer (lib/data: models incl. Puzzle/Edge with Cell=int? typedefs, repositories, providers). analyze + 45 tests green.

Do Phase 5 — On-device move validator (lib/engine/validator.dart), per plan Phase 5:
1. Pure Dart, NO Flutter imports (engine-agnostic rule). Reuse the model typedefs from lib/data/models/puzzle.dart (Cell = int?, Grid, Solution, Edge with EdgeOrientation/EdgeKind) — do not redefine them; import the model file (it has no Flutter deps).
2. findViolations(cells, edges) → Set of (row,col) coords: adjacency (3+ same symbol in a row/col run), balance (>3 of a symbol in any line — mark ALL cells of the over-represented symbol in that line), edges (eq/ne violated when BOTH endpoints filled). Adjacency marks all 3 offending cells.
3. isComplete(cells) (no nulls), isValid (no violations), isSolved (complete && valid). cycle(int? v): empty→0→1→empty. localHint(cells, solution) → (r,c,value) for a RANDOM empty cell (Phase 2 decision: hints are fully local, no endpoint).
4. Mirror EXACT semantics from packages/engine/src/validators.ts + board.ts. Gotcha: balance marks all cells of the over-represented symbol in the line; adjacency marks all 3 cells of a run.

Verify (thorough — this is the only ported game logic): unit tests for each constraint pass+fail, combined violations, isSolved true/false, cycle, localHint picks only empty cells; cross-check a couple of fixtures against the TS engine's expected output (read packages/engine/src/validators.test.ts for fixtures). flutter analyze clean + flutter test green (45 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 5 done + add a Phase 6 handoff prompt) and commit/push to feat/mobile-app. Gotcha: pure Dart only in lib/engine; design tokens are the source of truth.
```

---

## Phase 5 — On-device validator ✅ (2026-06-01)

**What shipped — `lib/engine/validator.dart` (pure Dart, no Flutter imports):**
- `findViolations(grid, edges) → Set<Coord>` where `Coord = (int row, int col)` (record value-equality dedupes the set). Adjacency (3-in-a-run h/v → all 3 marked), balance (>half of a symbol in a line → ALL that symbol's cells in the line marked), edges (`eq` match / `ne` differ, only when both endpoints filled). Bounds-safe edge reads via `_at` (mirrors TS `grid[r]?.[c]`).
- `isComplete`, `isValid`, `isSolved`; `cycle(int? v)` empty→0→1→empty; `wouldViolate(...)` fast local prune; `localHint(grid, solution, {Random?})` → `(r,c,value)` for a **random empty cell** (Phase-2 decision: fully on-device, no endpoint), null when complete; `edgeCells(edge)` helper.
- **Reuses the data-layer model types** (`Cell`/`Grid`/`Solution`/`Edge`/`EdgeKind`/`EdgeOrientation` from `lib/data/models/puzzle.dart`, which is pure Dart) rather than redefining them — `lib/engine` imports only that pure file, no Flutter.

**Verification:** ported the canonical 6×6 fixture + assertions straight from `packages/engine/src/validators.test.ts` so the Dart output is **cross-checked against the TS engine**. `flutter analyze` → *No issues found!* · `flutter test` → **60/60** (45 prior + 15 validator: each constraint pass+fail, combined, isSolved/isComplete, eq/ne incl. empty-cell skip, `wouldViolate` triple/balance/edge, `cycle`, `localHint` empty-only + fuzzed + complete→null).

**Note:** keep these semantics in lockstep with `validators.ts`/`board.ts` — any rule change on the engine side must be mirrored here (and vice versa). The generator/solver remain backend-only (no Dart port).

---

## Handoff prompt → Phase 6 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 5 + Phase 6 plan section; skim 0–4). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: the mobile wireframes at ~/Downloads/halve (4).zip — unzip and read app/screens/home.jsx (the `Home` component + its `variant` prop: default/loading/offline/empty) and app/HANDOFF.md §3 (Home additional states). These are the CORRECT disc/ring designs. The repo's packages/design/handoff/ is the OLD fire/water build — do not use it.

Context in place: design system (lib/theme + lib/widgets — reuse HalveButton/Skeleton/HalveMark/SymbolDisc/SymbolRing/HalveTopBar/HalveIconButton + context.halveColors/halveShadows), app shell (go_router, HomeScreen is the first tab — currently a PhasePlaceholder), data layer (lib/data: puzzleRepositoryProvider, solveRepositoryProvider, currentUserProvider/authStateProvider/isSignedInProvider), and the on-device validator (lib/engine/validator.dart). analyze + 60 tests green.

Do Phase 6 — Home screen, per plan Phase 6 (replace the HomeScreen placeholder in lib/screens/home/):
1. home_screen.dart + home_provider.dart. Load: today's puzzle (id/difficulty via fetchDaily(localToday)), total puzzle count (→ "Puzzle No."), yesterday's difficulty, auth state, today's solve (duration). NOTE: there is no Dart local-day helper yet — add one (mirror apps/web/src/lib/local-date.ts: the device-local yyyy-MM-dd) and use it for fetchDaily + streak bucketing.
2. Variants (match home.jsx): normal/not-solved (primary "Play today" CTA + difficulty/puzzle number/date label), solved-today (green check, "Solved in m:ss", "Next puzzle at midnight", secondary "See your stats"), loading (Skeleton primitives), offline (D3: serve cached today puzzle + banner; "unavailable — try again shortly" + reload only if no cache), empty (no puzzle yet).
3. Streak band (signed-in & streak>0): Lucide flame LINE-glyph (no emoji — add the glyph), streak count in accent + tabular numerals, 7 mini-dots (last 7 days). Compute via fetchSolves + the validator-adjacent streak helpers (reuse/extend Stats.fromSolves; mirror web computeStreak/computeLastDays).
4. Secondary cards: Practice (→/practice), Archive ("N puzzles · last <difficulty>" →/archive). Footer "How to play" →/tutorial. Gear →/settings (already wired).
5. Offline cache: persist today + recent puzzles to shared_preferences (D3); sync on reconnect.

Verify: widget tests for each Home variant (mock the providers — override puzzleRepositoryProvider/solveRepositoryProvider/currentUserProvider in a ProviderScope); flutter analyze clean + flutter test green (60 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 6 done + add a Phase 7 handoff prompt) and commit/push. Gotchas: no emoji (flame is a line glyph); tabular numerals for streak/times; m:ss time format; sentence case; design tokens are the source of truth; streaks derive from solves.
```

---

## Phase 6 — Home screen ✅ (2026-06-01)

**What shipped — `lib/screens/home/`:**
- `home_screen.dart` — `HomeScreen` (`ConsumerWidget`) replacing the placeholder. Scrollable, `RefreshIndicator.adaptive` (pull-to-refresh re-runs the loader). Header = `HalveMark` + "Halve" wordmark + settings gear (→`/settings`). Renders one of these variants off `homeDataProvider`:
  - **loading** — `Skeleton` blocks for the streak band (66), meta row (52% w), H1 (78% w), and CTA (full pill); the keep-playing cards still render.
  - **normal / not-solved** — `_MetaRow` (date · difficulty · #number, uppercase tracked), the 44px "Today's puzzle" H1, and a primary **Play today** CTA (→`/play`).
  - **solved-today** — green `check_circle` + "Solved in m:ss" (tabular), "Next puzzle at midnight", secondary **See your stats** (→`/stats`). The CTA is replaced.
  - **offline** (D3) — cache-hit → playable CTA + a slim "Offline — showing a saved puzzle" banner; cache-miss → an inline "Puzzle unavailable — try again shortly" notice (wifi-off glyph) + a **Reload** button (`ref.invalidate`).
  - **empty** — no puzzle row for today → "Today's puzzle isn't ready yet — check back soon."
  - **streak band** (signed-in & streak>0) — accent-tint disc + **`FlameIcon`** (Lucide flame, traced as a stroked line glyph — no emoji), `N` in accent + tabular figures, "day streak", and 7 mini day-dots (last 7 days, today rightmost). Signed-in & streak==0 → the quiet "Start your streak today" nudge (`HalveMark` in a sunken disc). Signed-out → no band.
  - **keep-playing** — Practice card (Disc+Ring motif → `/practice`) and Archive card ("N puzzles · last <difficulty>" → `/archive`). Footer "How to play" → `/tutorial`.
- `home_provider.dart` — `homeDataProvider` (`FutureProvider.autoDispose<HomeData>`) loads in one pass: today's puzzle via `fetchDaily(localToday())` (cached on success), `fetchArchive(today)` for the puzzle number + archive count + **yesterday's difficulty**, and — when signed in — `fetchSolves(user.id)` → streak + last-7 + today's solve duration. Reading the repos throws in guest mode (no creds); that's caught and treated as offline. `puzzleCacheProvider` (defaults in-memory) lives here.

**New shared pieces:**
- `lib/data/local_date.dart` — `localToday()`, `formatDateLabel()` ("Monday, June 1", no `intl`), `solveDay()`, `formatDay()` — Dart mirror of `apps/web/src/lib/local-date.ts`.
- `lib/data/streak.dart` — `offsetDay` / `computeStreak` (TODAY-SAFE) / `computeLongestStreak` / `computeLastDays` — faithful port of `apps/web/src/lib/streak.ts`. (`Stats.fromSolves` from Phase 4 is left for the full Stats screen in Phase 11; Home uses these web-mirroring helpers so streak + last-7 match web exactly.)
- `lib/data/puzzle_cache.dart` — `PuzzleCache` interface, `PrefsPuzzleCache` (shared_preferences, last 7 dailies, re-validated through `Puzzle.tryParse` on read), `InMemoryPuzzleCache` (default + test fake). `Puzzle.toCacheMap()` added to the model. `main.dart` overrides `puzzleCacheProvider` with `PrefsPuzzleCache` after `SharedPreferences.getInstance()`.
- `lib/widgets/flame_icon.dart` — `FlameIcon`, the Lucide flame path traced 1:1 as a stroked `CustomPainter` (defaults to accent). Exported from the widgets barrel.

**Decisions (logged in `docs/DECISIONS.md`, "MOBILE Phase 6"):** offline cache via shared_preferences with an in-memory default + `main.dart` override; **no `connectivity_plus`** — a failed fetch *is* the offline signal; resync = pull-to-refresh / `ref.invalidate` re-fetch (no background listener); streak/date math is a 1:1 web port and stays derived from `solves`.

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → **83/83** (the prior 60 + 8 Home variant widget tests using mocked `puzzleRepositoryProvider`/`solveRepositoryProvider`/`currentUserProvider`/`puzzleCacheProvider`: normal, solved-today, streak band, empty-streak nudge, loading, offline-no-cache, offline-with-cache, empty-no-puzzle; + 5 `local_date` + 10 `streak` unit tests cross-checking the web semantics). The two Phase-3 shell tests were updated (Home now has an "Archive" card that collides with the nav label → nav taps disambiguated via a `HalveBottomNav` descendant finder; the shell test seeds deterministic Home data so "Play today" renders).

**Follow-ups:**
1. Not yet runtime-verified on a device/simulator this session (widget tests cover all variants). A quick `flutter run` to eyeball the flame glyph + spacing is recommended before shipping; backend must be live (`--dart-define` creds + applied migrations) for non-offline data.
2. "Puzzle No." and the Archive card count both use `fetchArchive(today).length` (the ordinal of today's daily). If a distinct global sequence number is wanted later, add a column/RPC.
3. `RefreshIndicator` is the only resync trigger; if a real-time reconnect refresh is wanted, add a lifecycle/connectivity listener in a later polish phase.

---

## Handoff prompt → Phase 7 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 6 + Phase 7 plan section; skim 0–5). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: the mobile wireframes at ~/Downloads/halve (4).zip — unzip and read app/screens/board.jsx + play.jsx (the play board, cell states, header, undo/hint controls) and app/HANDOFF.md (Play/board sections + minimum tap targets). These are the CORRECT disc/ring designs — packages/design/handoff/ is the OLD fire/water build, do not use it. Also read apps/web/src/components/board/BoardScreen.tsx + Board.tsx + Cell.tsx + the useGame reducer for the canonical interaction model to mirror.

Context in place: design system (lib/theme + lib/widgets — reuse HalveButton/HalveIconButton/HalveTopBar/EqNeBadge/SymbolDisc/SymbolRing + context.halveColors/halveShadows), app shell (go_router; /play, /play/:date, /practice/play?difficulty= all route to PlayScreen — currently a placeholder), data layer (Puzzle/Edge models, puzzleRepositoryProvider, solveRepositoryProvider), the on-device validator (lib/engine/validator.dart: findViolations/isComplete/isValid/isSolved/cycle/wouldViolate/localHint), the local-day helpers (lib/data/local_date.dart), and the offline puzzle cache (lib/data/puzzle_cache.dart). analyze + 83 tests green.

Do Phase 7 — Play board, per plan Phase 7 (replace the PlayScreen placeholder in lib/screens/play/):
1. play_screen.dart + play_provider.dart (a Notifier holding the working Grid + timer + undo stack + usedHint). Load the puzzle: daily via fetchDaily(localToday) / a date via fetchByDate / practice via fetchPracticePuzzle(difficulty, seq) — fall back to the offline cache for the daily when fetch fails. Givens are locked.
2. The 6×6 board: SymbolDisc/SymbolRing cells, locked-given styling, tap to cycle (validator.cycle: empty→disc→ring→empty), live violation highlighting (validator.findViolations — adjacency/balance/edge), the =/≠ edge badges (EqNeBadge) between cells. Match board.jsx exactly (cell radius, hairlines, given vs entered contrast, violation tint).
3. Header = back + difficulty label only (no tab bar — Play is full-screen). Controls row: Undo (disabled when the stack is empty) + Hint (validator.localHint → fills a random empty cell, sets usedHint). A monospace tabular timer (AppTypography.timer) running from first interaction.
4. On solve (validator.isSolved): record via solveRepository.recordSolve({puzzleId, grid, durationMs, usedHint, localDate}) — handle alreadySolved + the network-retry path (RecordSolveResult.networkFailure). Practice puzzles are NOT recorded (Phase 0 decision — no puzzleId write). Then route to the Win screen (Phase 8 — a placeholder hand-off is fine; just navigate with the result/duration).

Verify: widget tests (tap cycles a cell, a forced violation highlights, undo reverts, hint fills an empty cell + flags usedHint, isSolved triggers the record call — mock solveRepository) + a timer test; flutter analyze clean + flutter test green (83 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 7 done + add a Phase 8 handoff prompt) and commit/push. Gotchas: practice solves are never recorded; duration clamped to ≥1ms (web parity, the duration_ms>0 check); tabular numerals for the timer; design tokens are the source of truth; keep validator semantics in lockstep with the engine.
```
