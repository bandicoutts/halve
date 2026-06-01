# Codebase Audit — 2026-05-31

Multi-agent read-only audit across 7 domains (engine, security, accessibility, backend/data, Next.js/performance, design-system, code-quality), plus an independent engine verification run. **No P0s found.** This is the living tracker — check items off as they land.

**Severity:** P0 = exploitable / broken-in-prod / data-loss · P1 = serious correctness or security gap · P2 = should-fix robustness/quality · P3 = minor/polish.

**How we work it:** code changes land in batches, each verified (`tsc`, tests, preview) and committed. Items that mutate prod infra — **applying DB migrations, deploying edge functions, changing Vercel/Supabase config, and `git push`** — are NOT auto-done; they're surfaced for explicit sign-off.

---

## ▶ Resume here (read this first)

**To pick up in a fresh session:** read this file + root `CLAUDE.md`, then do the next batch. To verify logged-in screens, `POST /api/dev-login?secret=<DEV_LOGIN_SECRET from apps/web/.env.local>` (see the `auth-verification-dev-login` memory).

**Suggested batch order** (✅ = shipped):
1. ✅ **Quick-wins** — SEC-1, A11Y-4/5/6/8, CQ-4 *(commits `07cc982`, `318bab0`)*
2. ✅ **Accessibility P1s** — A11Y-1 (grid semantics), A11Y-2 (live regions), A11Y-3 (modal focus-trap). Shipped — see entries below.
3. ✅ **EPIC-B — one clock** — BE-1, BE-3, NXT-1. Consumer pages + hero label now use the single `getLocalToday()` clock; `local-date.ts` unit-tested. *(Edge-function minting side stays under EPIC-A; BE-3 backfill migration written + applied 2026-05-31.)*
4. ✅ **EPIC-A — puzzle pipeline** — ENG-1/3, BE-2, CQ-1/3 (+CQ-5, BE-5). One canonical `generateDaily(date)` policy in `@parity/engine` now drives every producer; redundant web seeder deleted; edge function + `/play` fallback are date-deterministic; cron-failure monitor added. *(Edge function deployed + monitor migration applied 2026-05-31; cron re-verified.)*
5. ✅ **Streak + home perf** — CQ-2 (extract tested `lib/streak.ts`), NXT-2 (home redundant getUser + unbounded fetch), NXT-3 (sequential→parallel home queries). Shipped — see entries below.
6. 🔄 **Remaining P2/P3** — ✅ NXT-4 (branded `error.tsx`/`not-found.tsx` + `notFound()` for missing archive puzzles), ✅ A11Y-7 (`<main>` landmark + skip link + one `<h1>` per screen), ✅ SEC-3 (`display_name` capped at all three layers; DB migration applied 2026-05-31). Still open: SEC-2, BE-4, DS-1 (+DS-2/3/4), CQ-6, A11Y-9/10/11, ENG-2/4, SEC-5/6/7, NXT-5/6.

**Guardrail (don't auto-do):** `git push`, applying DB migrations to the live DB, deploying the edge function, Vercel/Supabase config. Write the code; surface these for sign-off.

---

## Scorecard

| Domain | Assessment | P1 | P2 | P3 |
|---|---|---|---|---|
| Engine | 🟢 strong | 0 | 1 | 1 |
| Design system | 🟢 strong | 0 | 1 | 3 |
| Security | 🟡 adequate | 1 | 1 | 3 |
| Backend / data | 🟢 strong | 0 | 1 | 1 |
| Next.js / performance | 🟢 strong | 0 | 0 | 2 |
| Code quality / tests | 🟢 strong | 0 | 0 | 1 |
| Accessibility | 🟠 needs-work | 0 | 3 | 4 |

**Independent engine verification (2026-05-31):** a from-scratch rule-checker + backtracking solution-counter (no engine internals) over **360 puzzles** (120 each easy/medium/hard) found 0 rule violations, 0 non-unique, 0 givens-not-⊆-solution, 0 non-deterministic, correct difficulty distribution. Puzzle correctness is confirmed.

---

## ⭐ Cross-cutting epics (fix these as units)

### EPIC-A — Daily-puzzle pipeline: no single source of truth, no monitoring — ✅ done (deployed + applied 2026-05-31)
Groups SEC-2, BE-1, BE-2, CQ-1, CQ-3, ENG-1, ENG-3. The CLI seeder, the second web seeder, the edge function, and the `/play` fallback each derive "today's puzzle" differently (different seeds, different difficulty, one uses `Math.random`); the cron is fire-and-forget with no alerting; the fallback is non-deterministic with no `puzzleId` so solves silently fail and streaks break unseen.
- [x] **Consolidate to ONE seed+difficulty policy** — new `packages/engine/src/daily.ts`: `dailyPolicy(date)` (FNV seed + `easy/medium/hard/medium` cadence from the 2026-01-01 epoch) and `generateDaily(date)` (retries on a fresh deterministic seed, returns `usedSeed`). Re-vendored into the Deno engine via `sync-engine.sh`. 12 unit tests in `daily.test.ts` (determinism, cadence, DST-proof day index, reproducibility, rule-valid+unique output).
- [x] **Edge function: derive seed from the date; retry before 500** — `daily-puzzle/index.ts` now calls `generateDaily(today)` (no more `Math.random`) and stores `usedSeed`; only 500s after `generateDaily` exhausts its retries. *(Deployed 2026-05-31; POST returns 200.)*
- [x] **Cron: capture the response and alert on non-2xx / missing daily row** — migration `20260531040000_monitor_daily_puzzle.sql`: cron now records the pg_net request id; a 00:15 `check_daily_puzzle()` monitor writes to `public.ops_alert` + `RAISE WARNING` when today's row is missing or the call was non-2xx. *(Applied 2026-05-31; monitor verified clean.)*
- [x] **`/play` fallback: deterministic + loud guard** — `play/page.tsx` seeds the offline fallback from `generateDaily(today)` (canonical puzzle, not random) and `console.error`s loudly when the row is genuinely absent vs a DB outage. Verified live: `/play` 200, valid 6×6 grid.
- [x] **Delete the redundant seed script; correct the stale DECISIONS.md claims** — deleted `apps/web/scripts/seed-puzzles.mts` (+ its `seed` npm script; removes the CQ-5 `as any` casts); `scripts/seed-puzzles.ts` rewired onto `generateDaily`. DECISIONS corrected (EPIC-A entry + inline supersede notes).
- *Out of scope (stays open):* **SEC-2** (edge fn `verify_jwt=false` + no rate limit) — orthogonal to the seed/monitoring consolidation; tracked under Security.

### EPIC-B — One canonical clock (UTC-vs-local split) — ✅ consumer side done
Groups BE-1, BE-3, NXT-1. Puzzle is served/gated by UTC date while streaks bucket by local date → UTC+ users near midnight get the N-1 puzzle for an N streak; same root cause renders `new Date()` at render → hydration mismatch.
- [x] **Serve/gate the daily puzzle by the same `getLocalToday()`** — `page.tsx`, `play/page.tsx`, `play/[date]/page.tsx` all replaced `new Date().toISOString()` with `await getLocalToday()` (the cookie-backed clock streaks already use). *(The edge function mints by UTC with no user cookie — that producer-side policy belongs to EPIC-A and stays as-is here.)*
- [x] **Compute the home hero label server-side (fix hydration)** — new `formatDateLabel()` (UTC-pinned, deterministic) runs on the server in `page.tsx`; result passed to `HomeScreen` as a `todayLabel` prop. Client no longer calls `new Date()` at render. Verified live: hero reads "SUNDAY, MAY 31", page returns 200, no hydration error on a clean reload.
- [x] **Test asserting served date == streak "today"** — extracted pure `resolveLocalToday()` from `getLocalToday()`; `apps/web/src/lib/local-date.test.ts` (10 tests, vitest now wired into `apps/web`) covers ±1-day acceptance, forged-future/malformed rejection, the served==streak invariant, `formatDateLabel`, and `solveDay`.

---

## Engine 🟢
- [x] **ENG-1 · P2** — **Done (EPIC-A).** All producers now derive seed + difficulty from the single `generateDaily(date)` policy in `packages/engine/src/daily.ts`. The redundant `apps/web/scripts/seed-puzzles.mts` was deleted.
- [ ] **ENG-2 · P2** — Uniqueness/deduction guarantees are self-referential (generator + tests share `wouldViolate`). Add a committed test that counts solutions with an independent brute-forcer. *(Partially de-risked by the 2026-05-31 independent run; still want it in CI.)* `packages/engine` test suite.
- [x] **ENG-3 · P3** — **Done (EPIC-A).** Edge function now seeds from the date via `generateDaily(today)` (no `Math.random`). Deployed + verified 2026-05-31.
- [ ] **ENG-4 · P3** — `parseGridSpec` doesn't integer-check `r`/`c`, nor cross-check givens⊆solution / edge⇔solution. `apps/web/src/lib/grid-spec.ts:38-45`.

## Security 🟡
- [x] **SEC-1 · P1** — ~~No HTTP security headers / CSP.~~ **Done** (`next.config.ts` `headers()`): HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: off`, and a **Report-Only** CSP (allows inline styles + Supabase). Verified live on the dev server. *Next: watch CSP reports, then switch to enforcing.*
- [ ] **SEC-2 · P2** — daily-puzzle edge fn publicly invocable (`verify_jwt=false`), no rate limit, no failure alerting. `supabase/config.toml:372-373`; `daily-puzzle/index.ts:7-60`. → *EPIC-A.*
- [x] **SEC-3 · P2** — **Done (DB migration awaiting sign-off).** `display_name` is now capped at 40 chars across all three layers. **Client:** `Input.tsx` gained a `maxLength` prop; the onboarding field sets `maxLength={DISPLAY_NAME_MAX}` (+ a client-side `>40` guard). **Server:** the profile write moved off the client into a new `saveDisplayName` server action (`app/actions/save-display-name.ts`) that re-auths, **trims**, and rejects anything outside 1–40 before the `update` — closing the direct-POST bypass. **DB:** migration `20260531050000_display_name_length.sql` adds `check (display_name is null or char_length(display_name) between 1 and 40)`. Shared cap in `lib/display-name.ts`. Verified live: input `maxLength=40`; 62-char value rejected client-side, whitespace-only rejected, `"   Halve Tester   "` persists trimmed (stats shows `"Halve Tester"`). `tsc` clean, 30 tests pass. *Migration applied 2026-05-31 (`supabase db push`).*
- [x] **SEC-4 · P2** — **Done (accept + document).** Decision: the world-readable `grid_spec` solution is **intentionally accepted**. Cross-user/streak cheating is already blocked server-side (`record-solve.ts` re-validates the grid + rejects future-dated puzzles); the residual is **self-cheat only**, affecting just the cheater's own private stats — acceptable because there are **no leaderboards** (v1). Option (b) (split solution behind a SECURITY DEFINER RPC + client rework of win/hint/win-card) is documented as the revisit path *if* competitive features land. Landed: doc-only migration `20260601000000_document_puzzle_solution_readability.sql` (`COMMENT ON POLICY`/`COMMENT ON COLUMN`, no behaviour change, **applied 2026-06-01**) + a DECISIONS entry laying out the full threat model and the rejected (b) design. `init.sql:19-20`.
- [ ] **SEC-5 · P3** — `record-solve` accepts an unvalidated `local_date` (minor streak-day shaping). `record-solve.ts:36,66-72`. Validate against `puzzle.date` / server ±1-day window.
- [ ] **SEC-6 · P3** — Live prod project ref hardcoded in a migration. `20260531010000_fix_daily_puzzle_cron.sql:23`. Public anyway; hygiene only.
- [ ] **SEC-7 · P3** — Moderate transitive CVE: postcss <8.5.10 (build-time, not exploitable here). Bump `next`/postcss on routine cadence.

## Accessibility 🟠
- [x] **A11Y-1 · P1** — **Done.** `Board.tsx` now renders `role="grid"` (with `aria-label`/`aria-readonly`) → `role="row"` → `role="gridcell"`; `Cell.tsx` builds a per-cell `aria-label` (`Row N, column M, <solid|open|empty>[, given][, error]`). Verified live: grid labelled "Puzzle grid, 6 by 6", 6 rows × 36 gridcells, sample cell reads "Row 1, column 1, open, given".
- [x] **A11Y-2 · P1** — **Done.** Added a visually-hidden `role="status" aria-live="polite"` region in `BoardScreen` that announces validation conflicts (`N cells in conflict`) and the solve result (`Puzzle solved in …`); timer is `role="timer"` with an `aria-label`; `WinScreen` save-failure block is `role="alert"`. Verified live: timer reads "Elapsed time 0:00", live region updated to "Puzzle solved in 0:14" on completion.
- [x] **A11Y-3 · P1** — **Done.** New `useFocusTrap` hook (`apps/web/src/hooks/useFocusTrap.ts`): moves focus in, traps Tab, Escape-to-close, restores focus on unmount. Applied to the win overlay (`WinScreen`, `role=dialog`/`aria-modal`/`aria-label`) and the abandon-confirm (`BoardScreen`, `role=dialog`/`aria-modal`/`aria-labelledby`). Verified live: the abandon-confirm opens as an `aria-modal` dialog with focus trapped inside ("Keep playing"), and Escape closes it + restores focus to the Back button. The win overlay was confirmed on a real solve — `dialog "Puzzle complete"` / `aria-modal=true`, focus moved in to the Close button, and the live region announced "Puzzle solved in 4:59."
- [x] **A11Y-4 · P1** — **Done.** Added `--clay-550 #746B5A` (light) and `--dust-400 #928873` (dark) and repointed `--fg-3` to them; old `clay-500`/`dust-500` retained as decorative-only. Measured: light **4.67:1** bg / 4.96 surface; dark **5.37:1** bg / 4.78 surface — both clear AA 4.5:1 and stay below `fg-2` so the hierarchy holds. Synced `tokens.css` + `tokens.ts` (rebuilt `dist`); verified resolved values + both themes in the preview.
- [x] **A11Y-5 · P2** — **Done** (`Input.tsx`): `useId` drives `label htmlFor` ↔ `input id` (verified associated), `aria-invalid` + `aria-describedby` on error, error `<p>` gets `role="alert"`.
- [x] **A11Y-6 · P2** — **Done** (`IconButton.tsx` now floors the hit area at 44px, so every Back/Close button is ≥44 regardless of caller `size`; verified 44×44). The toggle (32h), avatar (32) and sign-in pill (34h) were left as-is — they clear the WCAG **2.2 AA** target-size minimum (24px); 44px is the AAA target, now met for the primary nav buttons.
- [x] **A11Y-7 · P2** — **Done.** `layout.tsx` now wraps `{children}` in `<main id="main-content" tabIndex={-1}>` and adds a `.skip-link` "Skip to content" anchor as the first body child (new `.skip-link`/`.sr-only` utilities + `main:focus{outline:none}` in `globals.css`). Heading hierarchy normalized so **every screen has exactly one `<h1>`**: Stats guest `h2`→`h1`, Tutorial teach-step `h2`→`h1`, and visually-hidden `<h1>`s added where the title only lived in the non-semantic `TopBar` (StatsShell "Statistics", Archive ×2, Tutorial practice/win "How to play", Board "{difficulty} puzzle"). Verified live: `/`, `/stats`, `/tutorial`, `/archive`, `/play` each expose exactly one `<main>` + one `<h1>`; skip link is off-screen until focused, slides into view on focus, and activating it moves focus into `<main>`. `tsc` clean, 30 web tests pass. *Trade-off noted: the per-screen `TopBar` `<header>` now nests in `<main>` → no longer a `banner` landmark (acceptable; it's screen chrome, not a site banner).*
- [x] **A11Y-8 · P2** — **Done** (`Input.tsx`): focus now shows a 3px ring (`accent-tint`, or `wrong-tint` on error) alongside the accent border, replacing the suppressed UA outline.
- [ ] **A11Y-9 · P3** — Theme toggle / SegmentedControl lack state semantics (`role=switch`/`aria-checked`, `aria-pressed`). `ThemeToggle.tsx`, `SegmentedControl.tsx:24-46`.
- [ ] **A11Y-10 · P3** — Decorative Fire/Water symbols announce "solid"/"open" as noise in non-game contexts. `Fire.tsx:14`, `Water.tsx:14`.
- [ ] **A11Y-11 · P3** — Fixed-px typography limits text-only zoom (no rem). App-wide; ties to DS-1.

## Backend / data 🟡
- [x] **BE-1 · P1** — **Done (consumer side).** All three consumer pages (`page.tsx`, `play/page.tsx`, `play/[date]/page.tsx`) now gate by `await getLocalToday()` — the same cookie-backed local-day clock streaks use — so the served puzzle's date == the streak's "today". Covered by `local-date.test.ts`. *The edge function (`daily-puzzle/index.ts:13`) mints by UTC with no user cookie; that producer-side policy is folded into EPIC-A and left unchanged here.*
- [x] **BE-2 · P1** — **Done (EPIC-A; applied 2026-05-31).** Migration `20260531040000_monitor_daily_puzzle.sql` captures the cron's pg_net request id and runs a 00:15 `check_daily_puzzle()` monitor that writes to `public.ops_alert` + `RAISE WARNING` on a missing row / non-2xx. `/play` also `console.error`s loudly when today's row is absent. Applied + verified 2026-05-31 (monitor runs clean, `ops_alert` empty). *Residual → BE-6.*
- [x] **BE-3 · P2** — **Done (applied 2026-05-31).** `solveDay()` now carries an explicit BOUNDARY CAVEAT comment explaining the unrecoverable-local-date limit and why legacy rows stay UTC-bucketed. Backfill migration `20260531030000_backfill_local_date.sql` populates `local_date := (solved_at at time zone 'UTC')::date` for null rows (idempotent). Covered by `solveDay` tests in `local-date.test.ts`.
- [ ] **BE-4 · P2** — No index on `solves.local_date` (latent; only matters once a date-filtered query is added). Add `(user_id, local_date)` when needed.
- [x] **BE-5 · P3** — **Done (EPIC-A).** The cron/edge function now mints via `generateDaily`, which applies the `easy/medium/hard/medium` cadence from `dailyPolicy` instead of hardcoding `medium`. Deployed 2026-05-31.
- [ ] **BE-6 · P3** — Daily-puzzle failure alerting is **passive**: `check_daily_puzzle()` (the BE-2 monitor) records failures to `public.ops_alert` + `RAISE WARNING` (Postgres logs) but there is **no active push** — nobody is notified unless they poll the table/logs. Add a delivery hook (a Supabase DB webhook on `ops_alert` inserts → email/Slack/PagerDuty, or a scheduled digest) so a missed daily mint actually pages someone. `20260531040000_monitor_daily_puzzle.sql`, `public.ops_alert`.

## Next.js / performance 🟡
- [x] **NXT-1 · P1** — **Done.** Removed the client-side `todayLabel()` (`new Date()` at render) from `HomeScreen`; the label is now computed server-side via `formatDateLabel(await getLocalToday())` in `page.tsx` and passed as the `todayLabel` prop. Deterministic, UTC-pinned → no SSR/CSR mismatch. Verified live (hero "SUNDAY, MAY 31", clean reload).
- [x] **NXT-2 · P2** — **Done.** The streamed `HomeUserContent` Suspense child ran its own `getUser()` + `getLocalToday()`, both already resolved by `page.tsx`. It now takes `userId` + `today` as props (no second auth round-trip on the streamed path); the slow all-solves fetch stays in the child so it still streams after the shell. `_components/HomeUserContent.tsx`, `page.tsx`.
- [x] **NXT-3 · P2** — **Done.** The home shell ran the `profiles` lookup and today's-solve check as two *sequential* round-trips after the main `Promise.all`; both depend only on `user` (+ the already-known puzzle id), so they're now a single parallel `Promise.all` — three serial DB hops → two. `page.tsx`.
- [x] **NXT-4 · P2** — **Done.** Added branded root boundaries: `apps/web/src/app/error.tsx` (`"use client"`, Mark + "The balance slipped" + a `unstable_retry`-backed *Try again* and *Back home*; logs the error) and `not-found.tsx` (server component, Mark + "404 / Nothing here" + *Back home* / *Browse the archive*). Both render inside the root layout, so they inherit the theme/font/tokens. `play/[date]/page.tsx` now calls `notFound()` (not `redirect("/archive")`) for a valid, non-future date with no puzzle row or a corrupt `grid_spec` — a genuine 404. *Home (`page.tsx`) and the daily `/play` deliberately **keep** graceful degradation — home renders the unavailable-state hero, `/play` serves the deterministic offline fallback (EPIC-A/CQ-3) — so they intentionally do **not** 404; the new boundaries cover their unexpected throws instead.* Verified live: unmatched URL → real `404`; `/play/1999-01-01` → branded not-found UI (200, streamed, per Next docs); a forced render throw → branded error UI with a working *Try again*. `tsc` clean, 30 web tests pass.
- [ ] **NXT-5 · P3** — Board layout shift: default `cellSize=48` then post-mount resize. `BoardScreen.tsx:256-266`. Size via CSS `clamp()`/aspect-ratio.
- [ ] **NXT-6 · P3** — `proxy` runs `getUser()` on `/api` + server-action requests. `proxy.ts:5-8`. Narrow the matcher to exclude `/api`.

## Design system 🟢
- [ ] **DS-1 · P2** — Type scale & label tracking have drifted off the locked scale (off-scale `13`/`11`/`13.5` px, scattered letter-spacing). App-wide. Do as one normalization pass to `var(--text-*)`/`var(--tracking-label)` (the deferral logged in DECISIONS).
- [ ] **DS-2 · P3** — Off-grid gap values (`7`/`9`/`14`/`18`) break the 8pt system. Round to grid during the DS-1 pass.
- [ ] **DS-3 · P3** — `borderRadius:999` (×21 across 14 files) and `:4` hardcoded instead of `var(--radius-full)` / a token. **Folded into DS-1** (do as one mechanical sweep to avoid scattering churn).
- [ ] **DS-4 · P3** — Sign-out pill & repeated uppercase-label style duplicate derivable primitives. Extend `Button` (size+icon); adopt the `.label`/`<Eyebrow>` primitive.

## Code quality / tests 🟡
- [x] **CQ-1 · P1** — **Done (EPIC-A).** Deleted the divergent `apps/web/scripts/seed-puzzles.mts`; the sole remaining seeder `scripts/seed-puzzles.ts` shares the `generateDaily` policy with the edge function and `/play`, so all producers agree.
- [x] **CQ-2 · P2** — **Done.** Streak math extracted to `apps/web/src/lib/streak.ts` (`offsetDay`, `computeStreak`, `computeLongestStreak`, `computeLastDays`) — the single source for both the home band and stats. 20 vitest cases (`streak.test.ts`): build-up, gaps, today-safe, longest-across-gaps, last-N windowing, and `solveDay` local-date bucketing (stored + legacy-null paths). `computeStreak` is now **today-safe** (counts from yesterday when today isn't solved yet) — a deliberate correctness fix so the streak/band no longer reads 0 before you've solved on a given day. 30 web tests pass.
- [x] **CQ-3 · P2** — **Done (EPIC-A).** `/play` fallback now uses `generateDaily(today).puzzle` (deterministic, canonical for the date) and logs loudly when the DB row is missing. `puzzleId` is still undefined for a genuine offline fallback (no DB row exists to record against — surfaced via `isOffline` + the log), which is correct.
- [x] **CQ-4 · P3** — **Done.** Removed the empty `apps/web/src/app/auth/callback/` directory.
- [x] **CQ-5 · P3** — **Done (EPIC-A).** Resolved by deleting `apps/web/scripts/seed-puzzles.mts` — the file holding both `as any` casts no longer exists.
- [ ] **CQ-6 · P3** — `scripts/` isn't a real workspace package despite a DECISIONS claim; entry is stale. Fix the package wiring or the doc.

---

## Verification / deploy notes (require explicit sign-off, not auto-done)
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is **not** in the Vercel prod/preview env. *(Confirmed 2026-05-31: only the two public keys are set — ✅.)*
- Any new **DB migration** must be reviewed and applied to Supabase manually:
  - **BE-3 backfill** — `20260531030000_backfill_local_date.sql` — ✅ **applied 2026-05-31** (main pushed).
  - **BE-2 monitor (EPIC-A)** — `20260531040000_monitor_daily_puzzle.sql` — ✅ **applied 2026-05-31** (`supabase db push`). Created `ops_alert` + `daily_puzzle_cron_run`, re-scheduled the cron to capture the pg_net request id, added the 00:15 `check_daily_puzzle` monitor. Verified: `check_daily_puzzle()` runs clean (HTTP 204), `ops_alert` empty (no false alarm — today's row present).
  - **SEC-3 CHECK** — `20260531050000_display_name_length.sql` — ✅ **applied 2026-05-31** (`supabase db push`). Adds a `char_length(display_name) between 1 and 40` CHECK (null allowed) on `public.profiles`. The migration's `validate constraint` step (a full-table scan) succeeded, so the constraint is live and all existing rows conform. The client + server-action layers also enforce the cap.
  - **SEC-4 doc-comment** — `20260601000000_document_puzzle_solution_readability.sql` — ✅ **applied 2026-06-01** (`supabase db push`). Comment-only (`COMMENT ON POLICY puzzles_select_all` + `COMMENT ON COLUMN puzzles.grid_spec`); no schema/behaviour change. Records the accepted "solution is world-readable" threat model in the DB itself.
  - BE-4 index — still to be written.
- **Edge-function** changes (EPIC-A `daily-puzzle/index.ts`, re-vendored engine) — ✅ **deployed 2026-05-31** (`supabase functions deploy daily-puzzle`). Verified: POST returns `200 {ok,skipped}` (boots cleanly under Deno → the new `generateDaily` import resolves); the canonical `dailyPolicy('2026-05-31')` reproduces the **exact** seed (3485160892) + difficulty (hard) already in the prod `puzzles` row, so the deploy is consistent with seeded data through 2026-12-31.
- `npm/pnpm audit` (SEC-7) and bumps should run in an unsandboxed context.
