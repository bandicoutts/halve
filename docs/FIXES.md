# Fix Backlog — Halve

Consolidated from three reviews run 2026-06-02:
- **WEB** — Next.js + Supabase production-readiness review
- **MOB** — Flutter production-readiness review
- **CROSS** — Cross-platform parity review

All 15 items shipped. ✓

---

| # | Area | Severity | Type | Description | Commit |
|---|---|---|---|---|---|
| 1 | WEB | P1 Bug | 1-line fix | `getLocalToday()` in archive — UTC vs local-day mismatch | `fix(web): use getLocalToday()…` |
| 2 | MOB | P1 Bug | Data layer | Stats display name reads profiles table, not stale auth metadata | `fix(mobile): stats display name…` |
| 3 | WEB | Security | 2-line fix | `server-only` guard on supabase client + fail-closed cron auth | `security: server-only guard…` |
| 4 | MOB | Infrastructure | ~20 lines | Cancel route `StreamSubscription` + centralize prefs keys | `refactor(mobile): cancel route…` |
| 5 | MOB | Performance | Refactor | Synchronous haptics flag — remove SharedPreferences from tap hot path | `perf(mobile): synchronous haptics…` |
| 6 | MOB | Bug / Decision | 1-line fix | Full iOS notification permission so reminders are visible | `fix(mobile): request full iOS…` |
| 7 | CROSS | UX Parity | ~5 lines | Web share text aligned with mobile — difficulty, streak, footer | `feat(web): align share text…` |
| 8 | MOB | Performance | Repository refactor | Server-side COUNT queries — stop fetching full archive for ordinal/count | `perf(mobile): server-side COUNT…` |
| 9 | CROSS | Dedup | Refactor | Deduplicate `_months` (mobile) and streak logic (web) | `refactor: deduplicate _months…` |
| 10 | CROSS | UX Parity | Data model | Stats "since" falls back to account creation date when no solves | `fix(mobile): stats "since"…` |
| 11 | WEB | Performance | Async | Parallelize independent Supabase queries in play/[date] and archive | `perf(web): parallelize…` |
| 12 | MOB | Modernization | Provider API | Migrate `ThemeModeNotifier` to Riverpod 2.x `Notifier` API | `refactor(mobile): migrate ThemeModeNotifier…` |
| 13 | WEB | Test coverage | New tests | Unit tests for `record-solve` and `save-display-name` server actions | `test(web): unit tests…` |
| 14 | WEB | Resilience | New files | Route-level error boundaries for stats, archive, play/[date] | `feat(web): route-level error boundaries…` |
| 15 | BOTH | Nits | Cleanup | Redundant cast, magic numbers, named keys | `refactor: nits…` |

---

## Round 2 — 5-pass deep dive (2026-06-02)

All 51 items shipped. ✓ Retraction: MOB-1 P2-1 (`Stats.fromSolves` test gap) — coverage confirmed in `test/data/models_test.dart`.

| # | Area | Severity | Type | Description | Commit |
|---|---|---|---|---|---|
| 16 | MOB | P0 Bug | 1-line | `SCHEDULE_EXACT_ALARM` + `USE_EXACT_ALARM` missing from manifest — exact alarms silently fall back to inexact on Android 12+ | `fix(mobile): auth deep links…` |
| 17 | MOB | P0 Bug | Refactor | `GoRouterExtraCodec` for `PlayResult` — OS process restore nulls `state.extra`; Win screen goes blank after backgrounding | `feat(mobile): GoRouterExtraCodec…` |
| 18 | MOB | P1 Bug | ~5 lines | `SolveRow.fromRow`: `!` operators throw on any null `solved_at`/`duration_ms` row, crashing home/stats/archive | `fix(mobile): SolveRow.fromRow null-tolerant` |
| 19 | WEB | P1 Security | New file | Two independent `SAFE_REDIRECT_PATHS` arrays in `proxy.ts` + `onboarding/page.tsx` must stay in sync — open-redirect risk if they diverge | `refactor(web): shared safe-redirect…` |
| 20 | WEB | P1 Bug | ~15 lines | `computeNextIn()` targets local midnight, not UTC 00:05 — wrong countdown for all non-UTC users | `fix(web): next-puzzle countdown…` |
| 21 | MOB | P1 Perf | 1 line | `winInfoProvider` calls `fetchArchive` (O(n) rows) just to get day index — `fetchPuzzleCount` is the O(1) fix | `perf(mobile): fetchPuzzleCount…` |
| 22 | WEB | P2 Perf | ~5 lines | `generateDaily` runs on every `/play` request and is discarded when DB has a row — should only run in the miss branch | `perf(web): generateDaily in miss branch` |
| 23 | MOB | P1 Dead code | ~15 lines | `_EmailInput` `Focus` wrapper + `_focused` state are unreachable — `focusedBorder` supersedes `enabledBorder` while focused | `refactor(mobile): remove dead focus…` |
| 24 | MOB | P1 Comment | 1 line | `firstrun.dart` iOS comment says "provisional (quiet)" but code requests full permission | `docs(mobile): fix iOS comment…` |
| 25 | MOB | P3 Comment | 2 lines | `onBackgroundNotificationTap` comment mischaracterises terminated-vs-foreground notification routing | `docs(mobile): fix background tap comment` |
| 26 | WEB | P3 Bug | ~5 lines | `Cell.tsx` drag-off leaves cell stuck at `scale(0.94)` — `mouseup` fires on release target, not press target | `fix(web): Cell drag-off stuck scale` |
| 27 | MOB | P2 Dedup | ~5 lines | Identical 3-branch difficulty label switch in `home_screen`, `win_provider`, `practice_screen` | `refactor(mobile): Difficulty.label…` |
| 28 | MOB | P1 Dedup | ~10 lines | Three identical `_monthNames` lists — export `kMonthNames` from `local_date.dart` | `refactor(mobile): kMonthNames…` |
| 29 | MOB | P1 Dedup | ~10 lines | Identical `_CheckPainter` `CustomPainter` copied in `practice_screen` + `auth_screen` | `refactor(mobile): CheckGlyph widget` |
| 30 | MOB | P1 Dedup | ~15 lines | Three divergent `m:ss` formatters with different rounding — same solve shows different times on different screens | `refactor(mobile): unified formatMs` |
| 31 | WEB | P2 Dedup | ~5 lines | `WinScreen.formatDate` + `ArchiveScreen.fmtDateLabel` are local-TZ re-implementations of the existing UTC-safe `formatDateLabel` | `refactor(web): shared formatDateLabel` |
| 32 | MOB | P0 Refactor | Large | Raw px/sp values hardcoded in every widget file instead of `AppSpacing`/`AppTypography`/`AppLayout` tokens | `refactor(mobile): token discipline pass` |
| 33 | MOB | P1 Arch | ~10 lines | `HapticsService.instance` + `NotificationService.instance` are static singletons — no Riverpod override path blocks test injection | `refactor(mobile): Riverpod providers…` |
| 34 | MOB | P1 Bug | ~5 lines | `ref.read(profileRepositoryProvider)` inside provider bodies — untracked; provider won't re-run on dependency change | `fix(mobile): ref.watch profile…` |
| 35 | MOB | P1 Perf | ~20 lines | `SharedPrefsStreakNudge` calls `getInstance()` fresh in every `isDismissed` + `setDismissed` — two plugin round-trips per Win load | `perf(mobile): inject SharedPrefs…` |
| 36 | MOB | P1 Perf | ~20 lines | `_SettingsScreenState` calls `getInstance()` inside every tap handler — plugin round-trip on each reminder chevron tap | `perf(mobile): cache SharedPrefs…` |
| 37 | WEB | P2 A11y | ~5 lines | `AccountMenu` doesn't close on Tab — menu stays open behind page, trapping keyboard users | `fix(web): AccountMenu Tab key` |
| 38 | MOB | P2 A11y | ~5 lines | `_StepButton` reminder time picker is 32×32 — below 44pt iOS / 48dp Android minimum tap target | `fix(mobile): _StepButton tap target` |
| 39 | WEB | P2 Visual | ~10 lines | Dark-mode FOUC on cold load — `useState("light")` renders white before `useEffect` reads `localStorage` | `fix(web): dark-mode FOUC…` |
| 40 | WEB | P3 Visual | CSS only | `HomeScreen` JS matchMedia stack causes layout shift on ≤380px — SSR always renders side-by-side | `fix(web): CSS flex-wrap HomeScreen` |
| 41 | WEB | P2 Perf | ~5 lines | `HomeUserContent` + `BoardScreen.recordAndFetch` fetch all solves with no date limit — grows 1 row/day | `perf(web): bound solves 60 days` |
| 42 | MOB | P2 Perf | ~15 lines | `findViolations` called in `build()` — recomputes on every 1-second timer tick, not just grid mutations | `perf(mobile): findViolations in state` |
| 43 | MOB | P2 Perf | ~15 lines | `AnimatedBuilder` wraps entire 6×6 `_SolvedBoard` — rebuilds all 36 cells on every animation frame | `perf(mobile): leaf-level animation` |
| 44 | MOB | P2 Bug | ~5 lines | `_AreaPainter.shouldRepaint` uses `!=` on `List<int>` — reference equality always true for new instances | `fix(mobile): listEquals shouldRepaint` |
| 45 | MOB | P2 Bug | ~3 lines | `TextEditingController` in `_editDisplayName` never disposed — leaked on every settings dialog open | `fix(mobile): dispose controller` |
| 46 | WEB | P2 Test | ~50 lines | `useGame` hook has zero tests — `computeErrors` adjacency/balance/edge logic unverified except by manual play | `test(web): useGame hook tests` |
| 47 | WEB | P2 Test | ~40 lines | `proxy.ts` OAuth callback (sole session-creation path) has zero test coverage — three security-relevant branches untested | `test(web): proxy.ts coverage` |
| 48 | WEB | P2 Test | ~20 lines | Server action tests don't assert `.eq()` arguments — an IDOR change would pass; no duplicate-submit sequence test | `test(web): server-action IDOR…` |
| 49 | MOB | P2 Test | ~30 lines | `play_screen_test` only covers success — loading skeleton, `_UnavailableView`, and error→retry flow untested | `test(mobile): play screen states` |
| 50 | MOB | P2 Test | ~40 lines | Settings toggle tests only check rendering — haptics/notification schedule/cancel behavior untested (required #33 first) | `test(mobile): settings toggles` |
| 51 | WEB | P2 New files | ~30 lines | `/practice`, `/practice/play`, `/tutorial` have no `loading.tsx` or `error.tsx` — errors escalate to root boundary | `feat(web): route loading + error…` |
| 52 | MOB | P2 UX | ~10 lines | `themeModeKey`, `onboardedKey`, `streakNudgeDismissedKey` live outside `prefs_keys.dart` despite its "single source of truth" claim | `refactor(mobile): centralise prefs keys` |
| 53 | MOB | P2 UX | 1 line | `_StatsGuest` mock backdrop hardcodes `'david'` — visible in App Store screenshots | `fix(mobile): _StatsGuest mock name` |
| 54 | MOB | P3 Bug | ~5 lines | `updateDisplayName` upsert failure is swallowed — provider re-fetches stale name with no user feedback | `fix(mobile): surface updateDisplayName…` |
| 55 | MOB | P2 Dedup | ~20 lines | `_Monogram` (stats) + `_AvatarInitial` (settings) are identical accent-circle widgets with different class names | `refactor(mobile): HalveMonogram widget` |
| 56 | WEB | P2 Bug | ~5 lines | `offsetDay` uses local-TZ `Date` constructor — inconsistent with UTC-safe `formatDateLabel`; footgun for server-side callers | `fix(web): pin offsetDay to UTC` |
| 57 | WEB | P3 Config | 1 line | Every response advertises `X-Powered-By: Next.js` | `fix(web): poweredByHeader: false` |
| 58 | WEB | P3 Config | ~5 lines | `Content-Security-Policy-Report-Only` has no `report-uri` — violation reports are silently dropped | `fix(web): CSP report-uri` |
| 59 | WEB | P3 Dev | ~3 lines | Edge function silently persists wrong difficulty when all 40 generation attempts miss target | `fix(edge): difficulty mismatch warn` |
| 60 | WEB | P3 Dev | ~10 lines | `seed.sql` seeds all 5 dev puzzles with the same alternating-checkerboard solution — non-alternating grid bugs go undetected locally | `fix(seed): diverse puzzle solutions` |
| 61 | WEB | P3 Config | 1 line | `vitest.config.ts` `include` pattern silently skips `*.test.tsx` — component tests exit 0 without running | `fix(config): vitest *.tsx include` |
| 62 | WEB | P3 Visual | ~5 lines | `ThemeProvider` reads `prefers-color-scheme` once on mount — OS auto-schedule theme changes ignored until reload | `fix(theme): OS theme change listener` |
| 63 | MOB | P3 Nits | Cleanup | 7 mobile nits: narration comments, `context.pop()`, `onTapUp` guard, named step constants, platform param, Fuchsia check, pre-computed letterSpacing | `fix(mobile): nit pass` |
| 64 | WEB | P3 Nits | Cleanup | 5 web nits: `parseInt` radix, env comment-strip, `hashSeed` UTF-16 note, migration code-point comment, extract `useRecordSolve` | `nit(web): nit pass` |
| 65 | MOB | P1 Doc | Verify | Device-verify `matchDateTimeComponents.time` + exact alarm recurrence post-force-stop on Android 14 | `docs/DECISIONS.md` |
| 66 | WEB | P3 Security | Migration | `cron_secret` plaintext in `internal_config` — any `SECURITY DEFINER` function running as `postgres` can read it as a side channel | `sec(db): cron_auth_token to Vault` |
