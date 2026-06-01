-- Add a composite index on solves(user_id, local_date) (BE-4).
--
-- Streak and stats queries filter exclusively on (user_id, local_date):
-- computeStreak window scan, last-14-days grid, per-date solve-exists check,
-- and archive date lookups.  Without this index those queries full-scan the
-- user's solves rows, which is fine today but degrades linearly with history.
--
-- Note: CONCURRENTLY cannot run inside a transaction block (which supabase db
-- push uses by default), so we use a plain CREATE INDEX.  At startup scale the
-- table is small and the brief lock is immaterial.

create index if not exists solves_user_local_date_idx
  on public.solves (user_id, local_date);
