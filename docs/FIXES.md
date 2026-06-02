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
