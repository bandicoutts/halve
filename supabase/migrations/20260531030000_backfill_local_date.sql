-- BE-3: Backfill solves.local_date for legacy rows written before the column
-- existed (or any row left null).
--
-- The user's timezone at solve time was never stored, so the true local date is
-- unrecoverable. We freeze legacy rows at the UTC date of `solved_at` — the same
-- value solveDay() already falls back to — which makes the column uniformly
-- populated and the streak bucket deterministic. It does NOT retroactively fix a
-- boundary user's legacy rows (those stay UTC-bucketed); new rows carry the real
-- local_date, so the residual phantom-gap exposure shrinks to zero as legacy
-- rows age out. See apps/web/src/lib/local-date.ts (solveDay) for the caveat.
--
-- Idempotent: only touches rows where local_date is still null.

update public.solves
   set local_date = (solved_at at time zone 'UTC')::date
 where local_date is null;
