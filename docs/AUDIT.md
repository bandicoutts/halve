# Codebase Audit — 2026-05-31

Multi-agent read-only audit across 7 domains (engine, security, accessibility, backend/data, Next.js/performance, design-system, code-quality), plus an independent engine verification run. **No P0s found.** This is the living tracker — check items off as they land.

**Severity:** P0 = exploitable / broken-in-prod / data-loss · P1 = serious correctness or security gap · P2 = should-fix robustness/quality · P3 = minor/polish.

**How we work it:** code changes land in batches, each verified (`tsc`, tests, preview) and committed. Items that mutate prod infra — **applying DB migrations, deploying edge functions, changing Vercel/Supabase config, and `git push`** — are NOT auto-done; they're surfaced for explicit sign-off.

---

## ▶ Resume here (read this first)

**To pick up in a fresh session:** read this file + root `CLAUDE.md`, then do the next batch. To verify logged-in screens, `POST /api/dev-login?secret=<DEV_LOGIN_SECRET from apps/web/.env.local>` (see the `auth-verification-dev-login` memory).

**Suggested batch order** (✅ = shipped):
1. ✅ **Quick-wins** — SEC-1, A11Y-4/5/6/8, CQ-4 *(commits `07cc982`, `318bab0`)*
2. ⬜ **Accessibility P1s** — A11Y-1 (grid semantics), A11Y-2 (live regions), A11Y-3 (modal focus-trap). Self-contained to `board/` + `WinScreen`; good multi-agent candidate.
3. ⬜ **EPIC-B — one clock** — BE-1, BE-3, NXT-1. Pure correctness (the UTC-vs-local midnight bug).
4. ⬜ **EPIC-A — puzzle pipeline** — ENG-1/3, BE-1/2, CQ-1/3. Highest impact; writes an edge-function change (deploy stays manual).
5. ⬜ **Remaining P2/P3** — SEC-2/3/4, NXT-2/3/4, BE-4, DS-1 (+DS-2/3/4), CQ-2/5/6, A11Y-7/9/10/11, ENG-2/4, SEC-5/6/7, BE-5, NXT-5/6.

**Guardrail (don't auto-do):** `git push`, applying DB migrations to the live DB, deploying the edge function, Vercel/Supabase config. Write the code; surface these for sign-off.

---

## Scorecard

| Domain | Assessment | P1 | P2 | P3 |
|---|---|---|---|---|
| Engine | 🟢 strong | 0 | 2 | 2 |
| Design system | 🟢 strong | 0 | 1 | 3 |
| Security | 🟡 adequate | 1 | 3 | 3 |
| Backend / data | 🟡 adequate | 2 | 2 | 1 |
| Next.js / performance | 🟡 adequate | 1 | 3 | 2 |
| Code quality / tests | 🟡 adequate | 1 | 2 | 3 |
| Accessibility | 🟠 needs-work | 4 | 4 | 4 |

**Independent engine verification (2026-05-31):** a from-scratch rule-checker + backtracking solution-counter (no engine internals) over **360 puzzles** (120 each easy/medium/hard) found 0 rule violations, 0 non-unique, 0 givens-not-⊆-solution, 0 non-deterministic, correct difficulty distribution. Puzzle correctness is confirmed.

---

## ⭐ Cross-cutting epics (fix these as units)

### EPIC-A — Daily-puzzle pipeline: no single source of truth, no monitoring
Groups SEC-2, BE-1, BE-2, CQ-1, CQ-3, ENG-1, ENG-3. The CLI seeder, the second web seeder, the edge function, and the `/play` fallback each derive "today's puzzle" differently (different seeds, different difficulty, one uses `Math.random`); the cron is fire-and-forget with no alerting; the fallback is non-deterministic with no `puzzleId` so solves silently fail and streaks break unseen.
- [ ] Consolidate to ONE seed+difficulty policy keyed on the date, in a shared engine/lib helper, used by all producers
- [ ] Edge function: derive seed from the date; retry generation on a fresh seed before returning 500
- [ ] Cron: capture the response and alert on non-2xx / missing daily row
- [ ] `/play` fallback: seed deterministically from the date; guard loudly when today's row is absent
- [ ] Delete the redundant seed script; correct the stale DECISIONS.md claims

### EPIC-B — One canonical clock (UTC-vs-local split)
Groups BE-1, BE-3, NXT-1. Puzzle is served/gated by UTC date while streaks bucket by local date → UTC+ users near midnight get the N-1 puzzle for an N streak; same root cause renders `new Date()` at render → hydration mismatch.
- [ ] Serve/gate the daily puzzle by the same `getLocalToday()` used for streaks
- [ ] Compute the home hero date label from the server cookie or post-mount (fix hydration)
- [ ] Add a test asserting served puzzle date == streak "today"

---

## Engine 🟢
- [ ] **ENG-1 · P2** — Three producers disagree on seed/difficulty (no canonical daily puzzle). `scripts/seed-puzzles.ts:75-78`, `apps/web/scripts/seed-puzzles.mts:70-72`, `supabase/functions/daily-puzzle/index.ts:29-32`. → *EPIC-A.*
- [ ] **ENG-2 · P2** — Uniqueness/deduction guarantees are self-referential (generator + tests share `wouldViolate`). Add a committed test that counts solutions with an independent brute-forcer. *(Partially de-risked by the 2026-05-31 independent run; still want it in CI.)* `packages/engine` test suite.
- [ ] **ENG-3 · P3** — `daily-puzzle` edge function uses a random seed (`index.ts:29`); seed from the date instead. → *EPIC-A.*
- [ ] **ENG-4 · P3** — `parseGridSpec` doesn't integer-check `r`/`c`, nor cross-check givens⊆solution / edge⇔solution. `apps/web/src/lib/grid-spec.ts:38-45`.

## Security 🟡
- [x] **SEC-1 · P1** — ~~No HTTP security headers / CSP.~~ **Done** (`next.config.ts` `headers()`): HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: off`, and a **Report-Only** CSP (allows inline styles + Supabase). Verified live on the dev server. *Next: watch CSP reports, then switch to enforcing.*
- [ ] **SEC-2 · P2** — daily-puzzle edge fn publicly invocable (`verify_jwt=false`), no rate limit, no failure alerting. `supabase/config.toml:372-373`; `daily-puzzle/index.ts:7-60`. → *EPIC-A.*
- [ ] **SEC-3 · P2** — `display_name` has no length limit/sanitization at any layer (Input, action, DB). `OnboardingScreen.tsx:23`, `Input.tsx`, `init.sql:26`. Cap at all three (maxLength + 1–40 check + DB `CHECK`).
- [ ] **SEC-4 · P2** — Puzzle solution readable client-side via world-readable `grid_spec`. `init.sql:19-20`. Streak-cheat already blocked server-side; residual is self-cheat. Decide: accept+document, or split solution behind service-role-only access.
- [ ] **SEC-5 · P3** — `record-solve` accepts an unvalidated `local_date` (minor streak-day shaping). `record-solve.ts:36,66-72`. Validate against `puzzle.date` / server ±1-day window.
- [ ] **SEC-6 · P3** — Live prod project ref hardcoded in a migration. `20260531010000_fix_daily_puzzle_cron.sql:23`. Public anyway; hygiene only.
- [ ] **SEC-7 · P3** — Moderate transitive CVE: postcss <8.5.10 (build-time, not exploitable here). Bump `next`/postcss on routine cadence.

## Accessibility 🟠
- [ ] **A11Y-1 · P1** — Puzzle grid lacks `grid`/`gridcell` semantics + per-cell position/given/error context (unplayable by SR). `Board.tsx:52-78`, `Cell.tsx:46`.
- [ ] **A11Y-2 · P1** — No `aria-live` regions: timer, win, validation errors, save failures all silent. `BoardScreen.tsx`, `Cell.tsx:32`, `WinScreen.tsx`.
- [ ] **A11Y-3 · P1** — Win overlay (and abandon-confirm) is a modal with no `role=dialog`/`aria-modal`, no focus trap, no focus return. `WinScreen.tsx:166-176`, `BoardScreen.tsx:400-426`.
- [x] **A11Y-4 · P1** — **Done.** Added `--clay-550 #746B5A` (light) and `--dust-400 #928873` (dark) and repointed `--fg-3` to them; old `clay-500`/`dust-500` retained as decorative-only. Measured: light **4.67:1** bg / 4.96 surface; dark **5.37:1** bg / 4.78 surface — both clear AA 4.5:1 and stay below `fg-2` so the hierarchy holds. Synced `tokens.css` + `tokens.ts` (rebuilt `dist`); verified resolved values + both themes in the preview.
- [x] **A11Y-5 · P2** — **Done** (`Input.tsx`): `useId` drives `label htmlFor` ↔ `input id` (verified associated), `aria-invalid` + `aria-describedby` on error, error `<p>` gets `role="alert"`.
- [x] **A11Y-6 · P2** — **Done** (`IconButton.tsx` now floors the hit area at 44px, so every Back/Close button is ≥44 regardless of caller `size`; verified 44×44). The toggle (32h), avatar (32) and sign-in pill (34h) were left as-is — they clear the WCAG **2.2 AA** target-size minimum (24px); 44px is the AAA target, now met for the primary nav buttons.
- [ ] **A11Y-7 · P2** — No `<main>` landmark / skip link; inconsistent heading hierarchy (Stats & Tutorial start at h2). `layout.tsx`, `StatsScreen.tsx:282`, `TutorialScreen.tsx:912`.
- [x] **A11Y-8 · P2** — **Done** (`Input.tsx`): focus now shows a 3px ring (`accent-tint`, or `wrong-tint` on error) alongside the accent border, replacing the suppressed UA outline.
- [ ] **A11Y-9 · P3** — Theme toggle / SegmentedControl lack state semantics (`role=switch`/`aria-checked`, `aria-pressed`). `ThemeToggle.tsx`, `SegmentedControl.tsx:24-46`.
- [ ] **A11Y-10 · P3** — Decorative Fire/Water symbols announce "solid"/"open" as noise in non-game contexts. `Fire.tsx:14`, `Water.tsx:14`.
- [ ] **A11Y-11 · P3** — Fixed-px typography limits text-only zoom (no rem). App-wide; ties to DS-1.

## Backend / data 🟡
- [ ] **BE-1 · P1** — Daily puzzle fetched/gated by UTC date while streaks use local date. `page.tsx:20`, `play/page.tsx:11`, `play/[date]/page.tsx:18`, `daily-puzzle/index.ts:13`. → *EPIC-B.*
- [ ] **BE-2 · P1** — Cron fire-and-forget, no alerting; minting failure → unrecordable fallback → silent streak break. `20260531010000_*.sql:18-28`, `daily-puzzle/index.ts:29-38`, `play/page.tsx`. → *EPIC-A.*
- [ ] **BE-3 · P2** — Mixed `null`/`local_date` rows can create phantom streak gaps for boundary users. `local-date.ts:32-34`. Backfill `local_date` or document the boundary.
- [ ] **BE-4 · P2** — No index on `solves.local_date` (latent; only matters once a date-filtered query is added). Add `(user_id, local_date)` when needed.
- [ ] **BE-5 · P3** — Cron always mints `medium`, flattening any intended difficulty cadence. `daily-puzzle/index.ts:32`. → ties to EPIC-A.

## Next.js / performance 🟡
- [ ] **NXT-1 · P1** — Hydration mismatch: `new Date().toLocaleDateString()` at render in an SSR'd client component. `HomeScreen.tsx:117-122`. → *EPIC-B.*
- [ ] **NXT-2 · P2** — Home: redundant `getUser()` + unbounded all-solves fetch in the Suspense child. `HomeUserContent.tsx:117-126` vs `page.tsx:35-68`.
- [ ] **NXT-3 · P2** — Home shell blocks on sequential queries, undercutting Suspense streaming. `page.tsx:35-68`. Fold profile query into the `Promise.all`.
- [ ] **NXT-4 · P2** — No `error.tsx` / `not-found.tsx` anywhere; render throws hit React's default overlay. `apps/web/src/app/`. Add branded boundaries; `notFound()` for missing puzzles.
- [ ] **NXT-5 · P3** — Board layout shift: default `cellSize=48` then post-mount resize. `BoardScreen.tsx:256-266`. Size via CSS `clamp()`/aspect-ratio.
- [ ] **NXT-6 · P3** — `proxy` runs `getUser()` on `/api` + server-action requests. `proxy.ts:5-8`. Narrow the matcher to exclude `/api`.

## Design system 🟢
- [ ] **DS-1 · P2** — Type scale & label tracking have drifted off the locked scale (off-scale `13`/`11`/`13.5` px, scattered letter-spacing). App-wide. Do as one normalization pass to `var(--text-*)`/`var(--tracking-label)` (the deferral logged in DECISIONS).
- [ ] **DS-2 · P3** — Off-grid gap values (`7`/`9`/`14`/`18`) break the 8pt system. Round to grid during the DS-1 pass.
- [ ] **DS-3 · P3** — `borderRadius:999` (×21 across 14 files) and `:4` hardcoded instead of `var(--radius-full)` / a token. **Folded into DS-1** (do as one mechanical sweep to avoid scattering churn).
- [ ] **DS-4 · P3** — Sign-out pill & repeated uppercase-label style duplicate derivable primitives. Extend `Button` (size+icon); adopt the `.label`/`<Eyebrow>` primitive.

## Code quality / tests 🟡
- [ ] **CQ-1 · P1** — Two divergent seed scripts produce different puzzles for the same date. `scripts/seed-puzzles.ts`, `apps/web/scripts/seed-puzzles.mts`. → *EPIC-A.*
- [ ] **CQ-2 · P2** — Streak logic duplicated verbatim across two files, zero tests (the core metric). `stats/page.tsx:19-56`, `HomeUserContent.tsx:4-25`. Extract to tested `lib/streak.ts`.
- [ ] **CQ-3 · P2** — Non-deterministic `/play` daily fallback (`generatePuzzle` with no seed, `puzzleId` undefined). `play/page.tsx:14`. → *EPIC-A.*
- [x] **CQ-4 · P3** — **Done.** Removed the empty `apps/web/src/app/auth/callback/` directory.
- [ ] **CQ-5 · P3** — `as any` casts without justifying comments. `apps/web/scripts/seed-puzzles.mts:11,18`.
- [ ] **CQ-6 · P3** — `scripts/` isn't a real workspace package despite a DECISIONS claim; entry is stale. Fix the package wiring or the doc.

---

## Verification / deploy notes (require explicit sign-off, not auto-done)
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is **not** in the Vercel prod/preview env. *(Confirmed 2026-05-31: only the two public keys are set — ✅.)*
- Any new **DB migration** (SEC-3 CHECK, BE-3 backfill, BE-4 index) must be reviewed and applied to Supabase manually.
- **Edge-function** changes (EPIC-A) require redeploy + cron verification.
- `npm/pnpm audit` (SEC-7) and bumps should run in an unsandboxed context.
