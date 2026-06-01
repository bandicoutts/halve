-- Add a composite index on solves(user_id, local_date) (BE-4).
--
-- Streak and stats queries filter exclusively on (user_id, local_date):
-- the computeStreak window scan, the last-14-days grid, the per-date
-- solve-exists check on the home page, and the archive date lookups.
-- Without this index those queries do a full per-user scan of the solves
-- table, which is fine today but degrades linearly with solve history.
--
-- CONCURRENTLY means the index builds without locking reads or writes.
-- This statement cannot run inside an explicit transaction block.

create index concurrently if not exists solves_user_local_date_idx
  on public.solves (user_id, local_date);
