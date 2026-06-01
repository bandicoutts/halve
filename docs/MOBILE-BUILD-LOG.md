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
| 7 | Play board | ✅ done & committed |
| 8 | Win screen | ✅ done & committed |
| 9 | First-run flow | ✅ done & committed |
| 10 | Archive | ✅ done & committed |
| 11 | Stats | ✅ done & committed |
| 12 | Practice | ✅ done & committed |
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

---

## Phase 7 — Play board ✅ (2026-06-01)

**What shipped — `lib/screens/play/`:**
- `play_provider.dart` — the game core, ported 1:1 from the web `useGame` + `useTimer`:
  - `PlayArgs` (date / isPractice / difficulty, with `==`/`hashCode` so the load de-dupes) → `playLoadProvider` (`FutureProvider.autoDispose.family<PlayLoad, PlayArgs>`). Loads **daily** (`fetchByDate(today)`), **archive** (`fetchByDate(date)`), or **practice** (`fetchPracticePuzzle(difficulty)`). Daily/archive **fall back to the offline puzzle cache** when the fetch throws or the row is missing (D3 — a failed fetch is the offline signal, same as Home); a genuinely-absent puzzle throws `PlayUnavailable`. Practice never caches and carries a **null `puzzleId`** (never recorded — Phase 0).
  - `PlayController` (`AutoDisposeFamilyNotifier<PlayState, Puzzle>`, keyed by the loaded puzzle) holds the working `Grid`, the undo stack (`history`), `usedHint`, and the count-up timer. `tap` cycles empty→disc→ring→empty (`validator.cycle`) on non-given cells; `hint` reveals a random empty cell via `validator.localHint` and flags `usedHint`; `undo` pops history. The timer is a `Timer.periodic(1s)` started on the first interaction, stopped on solve (`validator.isSolved` = complete ∧ no violations), and cancelled via `ref.onDispose`. `PlayResult` + `formatDuration` (`m:ss`) are the Win hand-off payload.
- `play_board.dart` — `PlayBoard` (6×6) ported faithfully from `Board.tsx`/`Cell.tsx`: `SymbolDisc`/`SymbolRing` cells at `cellSize·0.6`, radius-`cell` corners, the four visual states (**given** = sunken, no border, locked; **error** = `wrongTint` fill + 2px `wrong` border; **filled** = raised surface + cell shadow; **empty** = raised surface + 1px hairline), a press-scale of 0.94, and the `EqNeBadge` `=`/`≠` signs absolutely positioned over the gap between their two cells (`edgeSignSize = max(20, cell·0.42)`). Each cell carries a `ValueKey('cell-$r-$c')` for testability + a screen-reader label.
- `play_screen.dart` — replaces the placeholder. `async.when` over `playLoadProvider`: **loading** (back bar + spinner), **error** (back bar + "Puzzle unavailable" + Reload), **data** → `_PlayView`. `_PlayView` = back+difficulty top bar, an optional slim "Offline — playing a saved puzzle" banner, the `AppTypography.timer` (tabular, turns `correct`-green on solve), the centered square board (`cellSize = floor(side/6.8)`, `gap = max(6, floor(cell·0.16))` via `LayoutBuilder` — mirrors the web `ResizeObserver` math), the Undo (disabled when the stack is empty)/Hint controls, and a "How to play" footer (→`/tutorial`). On the first solve it records (daily/archive + signed-in only; guests/practice are a silent no-op), clamps `durationMs` to ≥1, waits a brief win-mark beat (skipped under reduced motion), then `context.push('/win', extra: PlayResult)`.
- `lib/widgets/play_glyphs.dart` — `UndoGlyph` (Lucide `rotate-ccw`) + `HintGlyph` (Lucide `lightbulb`), traced 1:1 as `IconTheme`-aware stroked painters (same pattern as `FlameIcon`), so `HalveIconButton`'s state coloring applies. Exported from the widgets barrel.
- `lib/screens/win/win_screen.dart` — a **minimal Phase-8 hand-off placeholder**: brand mark + "Solved in m:ss" (tabular display) + difficulty + "See your stats"/"Back to today" CTAs. Accepts the `PlayResult` (null-safe for a cold deep link). The Phase-8 build adds the keepsake card, share sheet, streak nudge, and "next puzzle in" countdown.
- `router/app_router.dart` — added `Routes.win = '/win'` + the `GoRoute` building `WinScreen` from `state.extra`.

**Decisions (logged in `docs/DECISIONS.md`, "MOBILE Phase 7"):** game state in an autoDispose family Notifier keyed by the puzzle (timer inside it, cancelled on dispose); a separate FutureProvider for loading with the D3 offline-cache fallback on the board itself; solve → record (guests/practice no-op, duration ≥1) → `/win` via `PlayResult`; bespoke Lucide undo/hint glyphs replacing the Phase-3 interim Material chrome.

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → **90/90** (the prior 83 + 7 new in `test/screens/play/play_screen_test.dart`: tap-cycle empty→disc→ring→empty, a forced three-in-a-row highlights the offending cells while an uninvolved cell stays raised, undo reverts, hint fills the lone empty + records with `usedHint:true`, completing the grid records the solve and shows `WinScreen`, **practice solves are NOT recorded**, and the timer starts on first interaction and counts up). The Phase-3 shell test was updated (the `/play` route now renders the real board — asserts the timer at `0:00` instead of the old placeholder text — and stubs `fetchByDate`). Tests disable animations to skip the win-mark delay and unmount the tree to cancel the running timer (no pending-timer failures).

**Follow-ups:**
1. Not yet runtime-verified on a device/simulator this session (widget tests cover the interactions). A `flutter run` to eyeball the board sizing, the disc/ring/edge rendering, the violation tint, and the undo/hint glyphs is recommended before shipping; the backend must be live (`--dart-define` creds + applied migrations + seeded practice pool) for non-offline data.
2. The Win screen is a placeholder — Phase 8 builds the real keepsake/share/streak/countdown from the `PlayResult` (which already carries `solution`, `size`, `difficulty`, `durationMs`, `usedHint`, `puzzleId`, `date`, and the `RecordSolveResult` for the network-retry path).
3. No abandon-confirm sheet yet (web shows "Leave this puzzle?" on back with moves in progress). Deferred to polish (Phase 18) — back currently exits directly.

---

## Handoff prompt → Phase 8 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 7 + Phase 8 plan section; skim 0–6). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: the mobile wireframes at ~/Downloads/halve (4).zip — unzip and read app/screens/play.jsx (the `HalveWin` + `ShareSheet` components — keepsake card, streak nudge, signed-in "Synced" state, share payload) and app/HANDOFF.md §4 (Win screen — streak nudge + signed-in state). These are the CORRECT disc/ring designs — packages/design/handoff/ is the OLD fire/water build, do not use it. Also read apps/web/src/components/screens/WinScreen.tsx for the canonical layout/animation/share-text to mirror.

Context in place: design system (lib/theme + lib/widgets — reuse HalveButton/HalveIconButton/HalveTopBar/HalveMark/SymbolDisc/SymbolRing/SafeScaffold + context.halveColors/halveShadows), app shell, data layer, the on-device validator, and the Play board (Phase 7). The Play board already navigates to /win with a PlayResult (lib/screens/play/play_provider.dart: kind, difficulty, durationMs, formattedTime, usedHint, solution, size, puzzleId, date, saveResult:RecordSolveResult?). WinScreen (lib/screens/win/win_screen.dart) is currently a minimal placeholder consuming PlayResult. analyze + 90 tests green.

Do Phase 8 — Win screen, per plan Phase 8 (build out lib/screens/win/win_screen.dart from the PlayResult):
1. The keepsake: brand mark "win-mark" settle, "Puzzle No." (dayNo — derive/pass it; today's archive ordinal like Home does, or extend PlayResult), "Solved in" + the big tabular time, and the SolvedBoard card (the full solution rendered as Disc/Ring cells with the staggered cell-pop, the Logo + date header) — match play.jsx HalveWin + WinScreen.tsx.
2. Metadata line: "<difficulty> · <N>-day streak" + (signed-in) a green ● "Synced" dot. Fetch the streak via solveRepository.fetchSolves + the lib/data/streak.dart helpers (daily/archive only; reuse computeStreak). "Next puzzle in <h>m" countdown to local midnight.
3. Streak nudge (signed-out, streak ≥ 3, never dismissed): the tappable "Your N-day streak lives on this device — sign in to keep it safe" row + a 44×44 dismiss × that persists halve:streak-nudge-dismissed to shared_preferences. Tapping the row → /auth.
4. Network-retry: if PlayResult.saveResult?.isNetworkError, show a "Couldn't save — Retry" affordance that re-runs recordSolve (thread a retry path; the Play controller still holds the grid, or pass enough in PlayResult to re-call). alreadySolved is success.
5. Share: a platform-native share sheet (share_plus) with the spoiler-free payload "Halve No. <n> · <time> · <difficulty> · streak <n>\nNo spoilers — play at halve.today" — match ShareSheet in play.jsx. Primary "Share result" + secondary "See your stats" (→/stats); Close → home.

Verify: widget tests for the win states (keepsake renders the solution, streak line, signed-out nudge appears at streak≥3 and dismiss persists, signed-in Synced dot, network-retry re-calls recordSolve — mock solveRepository) + the share payload string; flutter analyze clean + flutter test green (90 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 8 done + add a Phase 9 handoff prompt) and commit/push. Gotchas: no emoji (use the brand mark/glyphs); tabular numerals for time/streak/countdown; m:ss; share text must stay spoiler-free; signOut scope:local; streaks derive from solves; design tokens are the source of truth.
```

---

## Phase 8 — Win screen ✅ (2026-06-01)

**What shipped — `lib/screens/win/`:**
- `win_screen.dart` — the full keepsake, replacing the Phase-7 placeholder. A `ConsumerStatefulWidget` consuming the handed-off `PlayResult`:
  - **Keepsake** — the `win-mark` brand-mark swell (scale 0.7→1, back-out), the uppercase eyebrow (`PUZZLE NO. <n>` / `PRACTICE` / `HALVE`), "Solved in" + the big tabular `display` time, and the framed **SolvedBoard card** (`win-settle` translate-up; a "Halve" logo lockup + the keepsake date header; the full solution rendered as sunken Disc/Ring cells with the staggered **cell-pop** opacity+scale). Matches `play.jsx` `HalveWin` + `WinScreen.tsx`.
  - **Metadata line** — `<difficulty> · <N>-day streak` (streak in accent, tabular) + (signed-in & saved) a green `●` **Synced** dot. Shown for daily when streak > 0.
  - **Streak nudge** (signed-out, daily, streak ≥ 3, not dismissed) — the tappable "Your N-day streak lives on this device — sign in to keep it safe" row (→ `/auth`) + a 44×44 dismiss × that persists `halve:streak-nudge-dismissed` to `shared_preferences`.
  - **Network retry** — when `saveResult.isNetworkError`, a "Couldn't save — Retry" row re-runs `record_solve` (grid == solution, so it re-records straight from the `PlayResult`). `alreadySolved` is success.
  - **Share** — primary **Share result** (Lucide `ShareGlyph`) fires the native `share_plus` sheet with the spoiler-free `buildShareText` payload; secondary kind-aware action (`See your stats` / `Back to archive` / `New puzzle`); Close (×) → home. Daily also shows a "Next puzzle in <h>m" countdown (computed once at build, no timer).
- `win_provider.dart` — `winInfoProvider` (`FutureProvider.autoDispose.family<WinInfo, WinQuery>`) resolves `dayNo` (daily = `fetchArchive(today).length`; archive = the date's 1-based position; practice = null) + `streak` (`computeStreak` over `fetchSolves`, signed-in only). `streakNudgePrefsProvider` (real `shared_preferences` impl that swallows `MissingPluginException`; injectable fake for tests). Pure helpers: `buildShareText`, `difficultyLabel`, `formatKeepsakeDate`, `formatCountdownToMidnight`.
- `lib/widgets/play_glyphs.dart` — added `ShareGlyph` (Lucide `share`, traced 1:1 as a stroked painter, like the Undo/Hint glyphs); exported via the widgets barrel.
- `lib/screens/play/play_provider.dart` — `PlayResult` gained `localDate` (threaded from `PlayLoad.localDate` in `play_screen.dart`) so the win-screen retry can re-call `record_solve`.

**Decisions (logged in `docs/DECISIONS.md`, "MOBILE Phase 8"):** win-metadata is a separate FutureProvider overlaid on the synchronous `PlayResult` (backend never blocks the keepsake); native share via `share_plus` with an extracted, unit-tested spoiler-free payload; the streak-nudge UI + `shared_preferences` persistence are built now but the **guest device-streak source is deferred** (no on-device guest solve log yet → `winInfoProvider` returns streak 0 for guests, so the nudge stays dormant in production until that store lands); retry re-records from the `PlayResult` (solved grid = solution); entrance motion via `TweenAnimationBuilder` + one staggered `AnimationController`, all zero-duration under `reduceMotion`, and the countdown computed once (no periodic timer) so the win screen leaves no pending ticker/timer.

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → **102/102** (the prior 90 + 12 new in `test/screens/win/win_screen_test.dart`: keepsake renders all 36 solution cells as 18 Disc + 18 Ring, difficulty+streak meta, nudge appears at streak≥3 / hidden below 3 / hidden when already dismissed / dismiss-persists-to-prefs, signed-in Synced dot, network-retry re-calls `recordSolve` with the right args, practice eyebrow with no streak/nudge, + 3 `buildShareText` payload cases).

**Follow-ups:**
1. Not yet runtime-verified on a device/simulator this session (widget tests cover the states). A `flutter run` to eyeball the win-mark swell, the staggered cell-pop, the keepsake card shadow, and the real native share sheet is recommended before shipping; the backend must be live for `dayNo`/`streak`/`Synced`.
2. **Guest streak nudge is dormant** until a local guest solve log exists (Phase 9 first-run / later persistence work). The nudge UI, gating (≥3), and dismissal persistence are all wired — only the guest-streak *source* is missing.
3. Practice/archive secondary CTAs route to `/practice` and `/archive`; revisit once those screens (Phases 10/12) are real.

---

## Handoff prompt → Phase 9 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 8 + Phase 9 plan section; skim 0–7). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: the mobile wireframes at ~/Downloads/halve (4).zip — unzip and read app/screens/firstrun.jsx + tutorial.jsx (the first-run / how-to-play flow, the symbol intro, the practice-tutorial board) and app/HANDOFF.md (first-run + tutorial sections; the persistence keys table). These are the CORRECT disc/ring designs — packages/design/handoff/ is the OLD fire/water build, do not use it. Also read apps/web/src/components/screens/ for the canonical tutorial/first-run flow to mirror.

Context in place: design system (lib/theme + lib/widgets — reuse HalveButton/HalveIconButton/HalveTopBar/HalveMark/SymbolDisc/SymbolRing/EqNeBadge/SafeScaffold + context.halveColors/halveShadows), app shell (go_router; /firstrun and /tutorial route to placeholders), data layer, the on-device validator, the Play board (Phase 7), and the Win screen (Phase 8). analyze + 102 tests green. NOTE: the Win-screen streak nudge is wired for guests but currently dormant — there is no on-device guest solve log yet; if Phase 9 introduces local first-run/guest persistence, wire the guest streak source so the nudge activates.

Do Phase 9 — First-run flow, per plan Phase 9 (build out lib/screens/firstrun/ + lib/screens/tutorial/):
1. The first-run gate: on cold start with no prior visit, route to /firstrun (persist a halve:visited-style flag to shared_preferences; mirror the HANDOFF persistence keys). Returning users skip straight to Home.
2. The first-run sequence (match firstrun.jsx): brand/symbol intro (Disc = fills space, Ring = defines space), the core rules in plain language, a "Play your first puzzle" CTA → today's daily, and a low-friction "skip" → Home.
3. The tutorial / how-to-play (match tutorial.jsx): a guided interactive mini-board teaching adjacency + balance + the =/≠ edges, reachable from the "How to play" footers already wired on Home + Play. Reuse the validator for live feedback.
4. Decide + wire whether first-run also offers sign-in (the magic-link AuthScreen is Phase 14 — a placeholder link is fine), and whether completing the tutorial seeds anything.

Verify: widget tests for the first-run gate (visited flag persists, returning users skip) + the tutorial board interactions (reuse the validator); flutter analyze clean + flutter test green (102 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 9 done + add a Phase 10 handoff prompt) and commit/push. Gotchas: no emoji (brand mark/glyphs); design tokens are the source of truth; persist flags to shared_preferences with the HANDOFF keys; streaks derive from solves; signOut scope:local.
```

---

## Phase 9 — First-run flow ✅ (2026-06-01)

**What shipped — `lib/screens/tutorial/` + `lib/screens/firstrun/` + the cold-start gate:**
- `lib/data/onboarding.dart` — the first-run gate flag. `onboardedKey = 'halve:onboarded'`, an `OnboardingStore` interface + `SharedPrefsOnboarding` (guarded, swallows `MissingPluginException`), `onboardingStoreProvider`, and the pure `firstRunInitialLocation({onboarded})` helper (→ `/firstrun` or `/`).
- `lib/main.dart` — reads `halve:onboarded` alongside the cache prefs at startup and passes `firstRunInitialLocation(...)` to `HalveApp(initialLocation:)` → `createAppRouter(initialLocation:)`. Fresh device cold-starts on `/firstrun`; returning users land on Home (no flash, no live redirect).
- `lib/screens/tutorial/tut_fixture.dart` — `Tut4`, the hand-authored 4×4 (solution / givens / four `=`/`≠` edges / the one guided forced move), ported 1:1 from the wireframe `TUT4`.
- `lib/screens/tutorial/teach_board.dart` — `TeachBoard` + `TeachCell`: a size-agnostic square board with absolute edge signs (`EqNeBadge`), per-cell given/entered/empty/**violation** states plus the teaching affordances (accent **highlight** ring, **dim**-the-rest, tappable-**subset**) and a press-scale. `ValueKey('tut-cell-r-c')` per cell for tests.
- `lib/screens/tutorial/tutorial_flow.dart` — `TutorialFlow` (the 5 beats: two-symbol intro → no-crowding → half-and-half → read-the-edges, each with ✓/✗ rule strips, → guided forced-move → free solve; progress dots + a Skip link throughout) and `TutorialWin` (the quiet "You've got it" beat + a framed keepsake of the solved 4×4, win-mark swell). Live conflict feedback + the "N squares in conflict" footer come from `validator.findViolations`; solve detection compares to `Tut4.solution`.
- `lib/screens/firstrun/firstrun.dart` — `FirstRunScreen` hosts `TutorialFlow` → `TutorialWin`; marks the device onboarded on skip **and** on completion; **skip → Home**, **"Play today's puzzle" → the real daily (`/play`)**.
- `lib/screens/tutorial/tutorial_screen.dart` — the footer-launched `/tutorial` (from Home + Play): the same flow, but skip/finish just **pop back** (no gating, no daily re-launch).

**Decisions (logged in `docs/DECISIONS.md`, "MOBILE Phase 9"):** the gate is a one-shot `initialLocation` decision (not a router redirect); one `TutorialFlow` serves both `/firstrun` and `/tutorial` (host decides the exit); the teach board reuses the on-device validator for live feedback (size-agnostic at n=4); the **notification primer + native OS permission prompt are deferred to Phase 15** (they need real `flutter_local_notifications`/permission wiring) — first-run ends by launching the daily instead.

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → **111/111** (the prior 102 + 9 new: `test/data/onboarding_test.dart` — gate helper + `SharedPrefsOnboarding` round-trip; `test/screens/firstrun/firstrun_test.dart` — starts on the tutorial, Skip persists onboarded + lands Home; `test/screens/tutorial/tutorial_flow_test.dart` — walks the lesson steps into the guided solve, the guide cell is the only tappable one + advances, the validator tints a forced conflict, completing the solve fires `onComplete`).

**Follow-ups:**
1. Not yet runtime-verified on a device/simulator this session (widget tests cover the gate + interactions). A `flutter run` (delete the app / clear app data to re-trigger the gate) to eyeball the rule strips, the guided dim/highlight, and the win keepsake is recommended.
2. **Notification primer + native permission prompt deferred to Phase 15** — the wireframe's post-solve primer (value-forward, iOS provisional / Android "Daily puzzle" channel) and the OS prompt land with the notifications wiring.
3. **First-run does not yet offer sign-in.** Plan item 4: the magic-link `AuthScreen` is Phase 14; a sign-in offer in first-run (and wiring the guest-streak source that lights up the Phase-8 win nudge) can be revisited then.
4. The standalone `/tutorial` does not set a separate "tutorial-seen" flag (the web sets `halve-tutorial-seen`); only first-run writes `halve:onboarded`. Add one if a "you've seen this" affordance is wanted later.

---

## Handoff prompt → Phase 10 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 9 + Phase 10 plan section; skim 0–8). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: the mobile wireframes at ~/Downloads/halve (4).zip — unzip and read app/screens/home.jsx (the `Archive` + `MonthPickerSheet` components) and app/HANDOFF.md §5 (Archive — month navigation, day tap, cell visual states, difficulty dots, legend). These are the CORRECT disc/ring designs — packages/design/handoff/ is the OLD fire/water build, do not use it. Also read apps/web/src/components/screens/ArchiveScreen.tsx for the canonical month grid + day-state + solved-intersection logic to mirror.

Context in place: design system (lib/theme + lib/widgets — reuse HalveButton/HalveIconButton/HalveTopBar/HalveMark/SymbolDisc/SymbolRing/SafeScaffold/showHalveBottomSheet + context.halveColors/halveShadows), app shell (go_router; ArchiveScreen is the 2nd tab — currently a PhasePlaceholder), data layer (puzzleRepository.fetchArchive(today) → List<ArchiveDay> ascending + withSolves(days, solves) in-memory intersection; solveRepository.fetchSolves), the local-day helpers (lib/data/local_date.dart), and the on-device validator. analyze + 111 tests green.

Do Phase 10 — Archive, per plan Phase 10 (replace the ArchiveScreen placeholder in lib/screens/archive/):
1. archive_screen.dart + archive_provider.dart. Load: fetchArchive(today) for the dated dailies (ascending) and — when signed in — fetchSolves(user.id), then withSolves(...) to mark solved days + best durations. Derive the available month range from the data (HANDOFF: March–June 2026 in the prototype window).
2. The month calendar grid (match home.jsx Archive + HANDOFF §5): a 7-col weekday grid per month, 56px day cells. Cell states — Solved (accent-tint bg, 1.5px accent border, accent number), Missed (dashed hairline border), Today (2px accent border), Future (dashed + opacity 0.3). Past day cells (solved AND missed) show 1–3 monochrome difficulty dots (easy 1 / medium 2 / hard 3; Difficulty.dots) below the number. Legend row beneath.
3. Month navigation — three equivalent mechanisms: left/right chevrons (muted at the oldest/newest available month), tapping the month label opens a MonthPickerSheet (showHalveBottomSheet; reverse-chronological months, each with solved/total counts, selected month accent-tinted), and a horizontal swipe on the grid (44px threshold; left = older, right = newer).
4. Day tap: today/past solved → /play/:date (or /play for today); missed past day → a day sheet (or straight to /play/:date) to play that archive puzzle; future → no-op. Practice solves never appear here (Phase 0). Tabular numerals for all counts/dates; streaks/solved-state derive from solves.

Verify: widget tests (month grid renders solved/missed/today/future states from mocked providers, difficulty dots, month nav clamps at range ends, day tap routes to /play/:date) + the month-range derivation; flutter analyze clean + flutter test green (111 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 10 done + add a Phase 11 handoff prompt) and commit/push. Gotchas: no emoji; tabular numerals; sentence case; design tokens are the source of truth; streaks/solved-state derive from solves; signOut scope:local.
```

---

## Phase 10 — Archive ✅ (2026-06-01)

**What shipped — `lib/screens/archive/`:**
- `archive_provider.dart` — `archiveDataProvider` (`FutureProvider.autoDispose<ArchiveData>`) loads `fetchArchive(today)` (dated dailies, ascending) and, when signed in, joins `fetchSolves(user.id)` via `withSolves(...)` for solved-state + best durations. A thrown repo / guest mode degrades to an empty, offline grid. `ArchiveData` derives `byDate`, the available `months` range, `currentMonth`, and `monthStats(ym)` from the data — **nothing is hard-coded**. Pure top-level month helpers (`monthsBetween`, `daysInMonth`, `firstWeekdayOffset`, `prevMonth`/`nextMonth` clampers) are unit-tested.
- `archive_screen.dart` — `ArchiveScreen` (`ConsumerStatefulWidget`, view-month state defaulting to today's month, clamped to the range). Renders: a left-aligned "Archive" title; the month-nav row (prev/next `HalveIconButton`s disabled at the range ends + a tappable uppercase month label); the 7-column Sunday-first day grid (`GridView.count`, ~56px cells) with the four cell states (Solved = accent-tint + 1.5px accent border + accent number; Today = 2px accent border; Missed/Future = thin hairline, Future also `opacity 0.3`) and 1–3 monochrome **difficulty dots** (`Difficulty.dots`, `fg1` solved / `fg3` missed) on past+today cells; the inline state **legend**; and an empty/offline notice. Month navigation has all three affordances — chevrons, a `showHalveBottomSheet` `_MonthPicker` (reverse-chronological, solved/total counts, accent-tinted selection), and a horizontal swipe. Day tap **pushes** `/play` (today) or `/play/:date` (past day with a puzzle); future / puzzle-less days are inert. Tabular numerals on all day numbers + counts.

**Decisions (logged in `docs/DECISIONS.md`, "MOBILE Phase 10"):** month range + counts derived from the fetched dailies (not the wireframe's static fixtures); solved-state joined in-memory via `withSolves` (derived from `solves`, never denormalized); three equivalent month-nav affordances; swipe direction follows the **prototype's gesture code** (left = newer / right = older) rather than the §5 prose; day tap pushes the play route so Back returns to Archive; **dashed "missed"/"future" borders are approximated with a solid 1px hairline** — Flutter has no native dashed `Border`; a `CustomPainter` dash is a deferred polish item.

**Verification:** `flutter analyze` → *No issues found!* · `flutter test` → **123/123** (the prior 111 + 12 new in `test/screens/archive/archive_screen_test.dart`: `monthsBetween`/`daysInMonth`/`firstWeekdayOffset`/clamp unit tests + `ArchiveData` range & per-month counts; widget tests for solved/missed/today decorations, difficulty-dot counts, next-clamped-at-current + prev-clamped-at-oldest, the month picker jump, past-day → `/play/:date`, today → `/play`, and the empty notice). The Phase-3 shell test's Archive assertion was updated from the old placeholder text to the real empty notice.

**Follow-ups:**
1. Not yet runtime-verified on a device/simulator this session (widget tests cover the states + nav + routing). A `flutter run` (with the backend live + a seeded month or two of dailies) to eyeball the grid, the difficulty dots, the picker sheet, and the swipe is recommended.
2. **Dashed borders are a solid hairline approximation** — add a `CustomPainter` dashed border if the exact wireframe dash matters.
3. A "missed day" sheet (the HANDOFF mentions an optional day sheet before playing) is not built — a missed/past day taps **straight** into `/play/:date`. Add the intermediate sheet later if wanted.
4. "Puzzle No." per archive day isn't shown on the cell (only the day number + difficulty dots); the win screen already derives the ordinal if a per-cell number is wanted later.

---

## Handoff prompt → Phase 11 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 10 + Phase 11 plan section; skim 0–9). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: the mobile wireframes at ~/Downloads/halve (4).zip — unzip and read app/screens/home.jsx (the `Stats` component) and app/HANDOFF.md (Stats section, if present). These are the CORRECT disc/ring designs — packages/design/handoff/ is the OLD fire/water build, do not use it. Also read apps/web/src/components/screens/StatsScreen.tsx + apps/web/src/lib/streak.ts for the canonical stat definitions (current/longest streak, win %, distribution) to mirror, and lib/data/models/stats.dart (Stats.fromSolves, from Phase 4) + lib/data/streak.dart (computeStreak/computeLongestStreak) which already port the web math.

Context in place: design system (lib/theme + lib/widgets — reuse HalveButton/HalveTopBar/HalveMark/SafeScaffold/Skeleton + context.halveColors/halveShadows), app shell (go_router; StatsScreen is the 3rd tab — currently a PhasePlaceholder), data layer (solveRepository.fetchSolves(userId) → List<SolveRow>; Stats.fromSolves derives current/longest streak; lib/data/streak.dart), the local-day helpers, and — signed-out — there is NO cloud data (guest stats are empty until a local solve log exists; see the Phase 8 win-nudge note). analyze + 123 tests green.

Do Phase 11 — Stats, per plan Phase 11 (replace the StatsScreen placeholder in lib/screens/stats/):
1. stats_screen.dart + stats_provider.dart. Signed-in: fetchSolves(user.id) → derive the headline stats via Stats.fromSolves + lib/data/streak.dart (reconcile Stats.fromSolves with the web's canonical computeStreak/computeLongestStreak — the Phase 4 note flagged Stats.fromSolves as provisional; make them agree). Signed-out: a sign-in prompt (stats live on the account) — there's no guest stats store yet.
2. The headline tiles (match the web StatsScreen + home.jsx Stats): puzzles solved, current streak, longest streak, win % (and/or average/best time as the web defines). Tabular numerals throughout; big numbers in the display/timer face.
3. Any distribution/visual the web shows (e.g. a difficulty or solve-time breakdown) — mirror it if present; otherwise keep to the headline tiles. Use design tokens only.
4. Empty state (signed-in, no solves yet): a calm "Solve your first puzzle" nudge. Loading: Skeleton tiles.

Verify: widget tests (signed-in headline tiles from a mocked solveRepository, signed-out sign-in prompt, empty/loading states) + reconcile-with-web unit tests for the streak/stat derivations (cross-check Stats.fromSolves against computeStreak/computeLongestStreak fixtures); flutter analyze clean + flutter test green (123 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 11 done + add a Phase 12 handoff prompt) and commit/push. Gotchas: no emoji; tabular numerals; sentence case; design tokens are the source of truth; streaks/stats derive from solves (never denormalized); signOut scope:local.
```

---

## Phase 11 — Stats ✅ (2026-06-01)

**What shipped — `lib/screens/stats/` + model update:**
- `stats.dart` (model) — **reconciled with web** in Phase 11: `Stats.fromSolves` now accepts `today` as a `yyyy-MM-dd` String (not `DateTime`) and delegates directly to `computeStreak` / `computeLongestStreak` / `computeLastDays` from `streak.dart` (the web-mirroring functions), ensuring the home streak band and stats screen always agree. Added `last14Days` (`List<bool>`, 14-element boolean presence map), `timeDist` (`List<int>`, 6-bucket solve-time histogram: <2m / 2–3 / 3–4 / 4–5 / 5–6 / 6+m), and `since` (earliest solved day for "since [month] [year]" display). `empty` const + `emptyFor(today)` factory for the zero-solve case.
- `stats_provider.dart` — `StatsData` (signedIn, today, stats?, displayName?) + `statsDataProvider` (`FutureProvider`): signed-out → guest shell; signed-in → `fetchSolves(user.id)` → `Stats.fromSolves`. Display name resolved from auth metadata (`display_name` → `name` → email local-part).
- `stats_screen.dart` — full `StatsScreen` (`ConsumerWidget`) mirroring the web `StatsScreen.tsx`:
  - `HalveTopBar("Statistics")` + scrollable content area.
  - **Identity row**: `_Monogram` (accent-tint circle + initial), displayName, "N solved · since [month] [year]".
  - **StreakHero card**: `FlameIcon` + "Day streak" eyebrow, 66px tabular current streak in accent, best-ever (longest) right-aligned.
  - **14-day calendar grid** (`_Cal14`): two 7-cell rows ("Last week" / "This week"), accent-filled solved, today outlined in fg1, empty in bgSunken.
  - **Solve-time area chart** (`_AreaChart` / `_AreaPainter` `CustomPainter`): catmull-rom smooth curve, area fill in accentTint, peak dot, 6 x-axis labels — matches web `AreaSignature` exactly.
  - **Avg + best time divided card** (`_StatDivided`): two-cell surface tile, tabular 22px values.
  - **Sign out** button (secondary, `AuthRepository.signOut()` which uses `scope: local` per global rule).
  - **Guest state** (`_StatsGuest`): blurred/masked mock backdrop (identity + StreakHero + Cal14 + AreaChart) + "Start your record" CTA + Sign in → `/auth`.
  - **Empty state** (0 solves): `HalveMark` + "Solve your first puzzle" nudge; streak hero still shown (all zeros).
  - **Loading state**: `_LoadingSkeleton` (identity row + hero + 14-day + chart + tile bones via `Skeleton`).
  - **Error state**: calm inline text.

**Decisions (logged in `docs/DECISIONS.md`, "MOBILE Phase 11"):** `Stats.fromSolves` reconciled to use `streak.dart` string-based functions (prior DateTime approach was equivalent but unverified); `today` param changed from `DateTime` to `String` for consistency with `streak.dart` API; guest state mirrors web's blurred-mock pattern exactly; solve-time chart uses catmull-rom (same algorithm as web's `smoothPath`); sign-out routes to `/` via GoRouter.

**Verification:** `flutter analyze` → *2 pre-existing unused-import warnings* (no new issues). `flutter test` → **138/138** (123 prior + 15 new: 9 in `test/screens/stats/stats_screen_test.dart` — guest CTA, auth routing, loading skeleton, streak headline tiles, displayName, avg/best tiles, empty nudge, empty-hides-chart, sign-out button; 6 reconcile unit tests added to `test/data/models_test.dart` — TODAY-SAFE streak survival, full-day-elapsed collapse, disjoint-run longest streak, last14Days length + today-truthy, timeDist 6-bin bucketing, `since` = earliest date).

**Follow-ups:**
1. Runtime verification on device/simulator recommended (widget tests cover all states but visual review of the area chart + blurred guest backdrop is worthwhile).
2. `displayName` comes from auth metadata — the `profiles` table `display_name` column (set by `on_auth_user_created` trigger) is not fetched yet; a `profileRepository.fetchProfile(userId)` call in Phase 13 (Settings/Account) can backfill it.
3. Win % is not shown (web doesn't show it in `StatsScreen.tsx` either — it shows "Played" and "Solved %" in `home.jsx Stats` only); add if a later design revision requests it.

---

## Handoff prompt → Phase 12 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 11 + Phase 12 plan section; skim 0–10). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: the mobile wireframes at ~/Downloads/halve (4).zip — unzip and read app/screens/practice.jsx for the Practice screen design. The correct disc/ring design system is in packages/design/mobile/ (current) — do NOT use packages/design/handoff/ (old fire/water build). Also read apps/web/src/app/practice/ for the web practice flow (if it exists) to understand the server pool approach.

Context in place: design system (lib/theme + lib/widgets), app shell (go_router — /practice and /practice/play routes exist), data layer (puzzleRepository.fetchPracticePuzzle(difficulty, seq?) calls the server pool RPC from Phase 0.2; play board is fully working in lib/screens/play/), and 138 tests green.

Do Phase 12 — Practice, per plan Phase 12:
1. practice_screen.dart + practice_provider.dart. Difficulty segmented control (Easy / Medium / Hard); card shows givens count + typical time + blurb; "Start [difficulty] puzzle" CTA. Fetches from the server pool (NOT local generation — parity rule).
2. /practice/play?difficulty= reuses the play board with kind=practice (no streak side-effects; records a solve row since web does the same, but these don't affect daily streak as they have date=null puzzles).
3. Win screen shows "New puzzle" CTA (instead of daily "Next puzzle at midnight").

Verify: widget test difficulty selection → correct pool fetch param; flutter analyze clean + flutter test green (138 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 12 done + add a Phase 13 handoff prompt) and commit/push. Gotchas: no emoji; tabular numerals; sentence case; design tokens only; practice puzzles come from the server pool (D3); signOut scope:local.
```

---

## Phase 12 — Practice ✅ (2026-06-01)

**What shipped — `lib/screens/practice/`:**
- `practice_provider.dart` — `selectedDifficultyProvider` (`StateProvider.autoDispose<Difficulty>`, defaults to `Difficulty.medium`). Auto-disposed so the picker resets to Medium on each visit.
- `practice_screen.dart` — full difficulty picker screen replacing the Phase-3 placeholder:
  - `HalveTopBar("Practice")` + back.
  - Scrollable "DIFFICULTY" eyebrow + three `_DifficultyCard` widgets (Easy / Medium / Hard) in the wireframe's `practice.jsx` order.
  - **`_DifficultyCard`**: an `AnimatedContainer` with press-state toggle (`_pressed`). Selected: `accentTint` bg + 2px accent border + accent label color. Unselected: `surface` bg + 1px hairline border + fg-1 label. Pressed (unselected): `bgSunken` bg. Right-side `_RadioDot` (22px, 2px border, filled accent + `_CheckPainter` SVG checkmark when selected). Descriptions match the wireframe exactly.
  - **Pinned `_PlayCta`**: bottom area with a 1px hairline top border, `bg` fill, bottom safe-area padding (`MediaQuery.viewPaddingOf`), and a full-width "Play" `HalveButton`. Tapping pushes `Routes.practicePlay(difficulty: selected.wire)`.
- **Win screen already handled**: `_secondaryLabel(PlayKind.practice)` → `'New puzzle'`; `_secondaryRoute(PlayKind.practice)` → `Routes.practice`. No countdown shown. No streak meta/nudge for practice. This was correct from Phase 8 — no changes needed.
- **Play board already handled**: `/practice/play?difficulty=` routes to `PlayScreen(isPractice:true, difficulty:...)` which calls `fetchPracticePuzzle(difficulty)` from the server pool (Phase 0 RPC). `puzzleId` is null → solves are never recorded (Phase 0 decision; no streak side-effects).

**Decisions:**
- CTA label is "Play" (matches the wireframe's `<Button>Play</Button>`) — the plan spec "Start [difficulty] puzzle" is overridden by the actual wireframe copy. No givens count or typical time on the cards (wireframe only shows label + desc).
- Difficulty order follows `Difficulty.values` (easy → medium → hard), matching the wireframe and web convention.
- The `selectedDifficultyProvider` is `autoDispose` (resets to Medium on each visit); if "remember last selection" is wanted later, switch to a non-autoDispose StateProvider backed by shared_preferences.

**Verification:** `flutter analyze` → *2 pre-existing unused-import warnings* (no new issues). `flutter test` → **147/147** (138 prior + 9 new in `test/screens/practice/practice_screen_test.dart`: all three cards render, descriptions visible, default medium sends `difficulty=medium`, selecting easy/hard sends the correct param, Play CTA routes to the stub screen). All 9 tests verify difficulty-selection → correct pool fetch parameter as required.

---

## Handoff prompt → Phase 13 (paste into a fresh session)

```
Continue the Halve Flutter mobile build. Plan of record: ~/.claude/plans/users-davidcoutts-downloads-halve-4-zip-cached-fairy.md. Progress + decisions: docs/MOBILE-BUILD-LOG.md (read the Phase 12 + Phase 13 plan section; skim 0–11). Work on the existing feat/mobile-app branch.

IMPORTANT design reference: the mobile wireframes at ~/Downloads/halve (4).zip — unzip and read app/screens/home.jsx (the Settings / Account sections if present) and app/HANDOFF.md (Settings section + persistence keys table). These are the CORRECT disc/ring designs — packages/design/handoff/ is the OLD fire/water build, do not use it.

Context in place: design system (lib/theme + lib/widgets — reuse HalveButton/HalveIconButton/HalveTopBar/HalveBottomSheet/SafeScaffold + context.halveColors/halveShadows), app shell (go_router; /settings route → SettingsScreen placeholder), data layer (authRepositoryProvider, currentUserProvider, isSignedInProvider), the local-day helpers, and 147 tests green.

Do Phase 13 — Settings, per plan Phase 13:
1. settings_screen.dart. Theme toggle (System / Light / Dark) — store in shared_preferences; override the MaterialApp ThemeMode in main.dart. No toggle in chrome (native rule 2 — this lives only in Settings).
2. Account section (signed-in): display name, "Sign out" (AuthRepository.signOut() with scope:local — global rule). Link to Auth screen for sign-in / link from guest state.
3. App version (package_info_plus). Any other settings present in the wireframe.
4. Fetch profile display name from the profiles table (profileRepository.fetchProfile(userId) — the Phase 11 follow-up).

Verify: widget tests (theme toggle persists to shared_preferences, signed-in account row, guest sign-in prompt, sign-out calls AuthRepository.signOut with local scope); flutter analyze clean + flutter test green (147 still pass). Then update docs/MOBILE-BUILD-LOG.md (mark Phase 13 done + add a Phase 14 handoff prompt) and commit/push. Gotchas: signOut scope:local (global rule); design tokens are the source of truth; no emoji; tabular numerals for version; sentence case.
```
