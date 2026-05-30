-- Add local_date to solves so streak computation can bucket by the user's local
-- calendar day rather than the UTC date of solved_at.
--
-- Nullable: existing rows don't have it; code falls back to solved_at::date (UTC).
-- Populated client-side at solve time: new Date().toLocaleDateString('en-CA').

alter table public.solves
  add column if not exists local_date date;
