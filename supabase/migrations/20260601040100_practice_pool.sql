-- get_practice_puzzle(): returns a puzzle from the dateless practice pool.
--
-- The practice pool is puzzles WHERE date IS NULL (date is set only for dailies).
-- This RPC is called by both web and mobile clients via supabase.rpc.
--
-- p_seq enables cross-platform parity: given a stable slot index, both web and
-- mobile receive the SAME puzzle for the same (difficulty, seq) pair, which makes
-- future head-to-head competition possible. Ordering is stable by (created_at, id)
-- so the slot mapping does not shift as long as the pool is append-only.
--
-- When p_seq is NULL, a deterministic rotating slot is derived from the UTC day so
-- the "practice puzzle of the moment" is stable within a day and rotates across the
-- available pool over time (no randomness -> reproducible across clients).
--
-- Puzzles are world-readable, so SECURITY DEFINER is not required. Declared STABLE
-- (reads only committed data within the statement; depends on current_date via the
-- NULL-seq rotation, which is stable within a transaction).

create or replace function public.get_practice_puzzle(
  p_difficulty text,                 -- 'easy' | 'medium' | 'hard'
  p_seq        integer default null  -- stable slot index; NULL = deterministic rotation
) returns table(id uuid, difficulty text, grid_spec jsonb)
language sql
stable
set search_path = public, pg_temp
as $$
  with pool as (
    select pz.id, pz.difficulty, pz.grid_spec,
           (row_number() over (order by pz.created_at, pz.id) - 1) as slot,
           count(*) over () as total
      from public.puzzles pz
     where pz.date is null
       and pz.difficulty = p_difficulty
  )
  select pool.id, pool.difficulty, pool.grid_spec
    from pool
   where pool.total > 0
     and pool.slot = (
       -- Map the requested (or rotating) index into [0, total) so any p_seq is valid.
       mod(
         (
           case
             when p_seq is not null then p_seq
             -- NULL seq: rotate by UTC day-of-epoch for a stable-within-day pick.
             else ((now() at time zone 'utc')::date - date '1970-01-01')
           end
         )::bigint
         -- mod of a possibly-negative value, normalised into [0, total).
         % pool.total + pool.total,
         pool.total
       )
     )
   limit 1;
$$;

revoke all on function public.get_practice_puzzle(text, integer) from public;
grant execute on function public.get_practice_puzzle(text, integer) to anon, authenticated;
