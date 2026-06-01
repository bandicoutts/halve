-- record_solve(): server-authoritative solve recording RPC.
--
-- This function MIRRORS apps/web/src/app/actions/record-solve.ts EXACTLY in logic
-- (with the same future-date rejection, local_date +/-1 day clamp, and cell-by-cell
-- solution comparison), so that web (server action) and mobile (Supabase RPC) clients
-- record solves identically. Keep the two in sync: any change to record-solve.ts must
-- be reflected here and vice versa.
--
-- Faithful-port references:
--   apps/web/src/app/actions/record-solve.ts   (flow steps A..I)
--   apps/web/src/lib/grid-spec.ts              (parseGridSpec -> spec.solution)
--   apps/web/src/lib/local-date.ts             (resolveLocalToday +/-1 day clamp)
--
-- SECURITY DEFINER so it can read puzzles.grid_spec and insert into solves, but it
-- always uses auth.uid() as the inserted user_id (never a caller-supplied id), and
-- rejects unauthenticated callers. search_path is pinned for safety.

create or replace function public.record_solve(
  p_puzzle_id   uuid,
  p_grid        jsonb,        -- player's final 6x6 grid, values 0|1|null
  p_duration_ms integer,
  p_used_hint   boolean,
  p_local_date  date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid          uuid := auth.uid();
  v_today_utc    date := (now() at time zone 'utc')::date;
  v_puzzle_date  date;
  v_grid_spec    jsonb;
  v_solution     jsonb;
  v_validated    date;
  v_expected     integer;
  v_actual_elem  jsonb;
  v_actual       integer;
  r              integer;
  c              integer;
begin
  -- Step A: auth. Reject if not signed in.
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  -- Step B: basic input sanity (mirrors record-solve.ts Step B).
  --   durationMs must be an integer >= 1 (DB also enforces duration_ms > 0).
  if p_duration_ms is null or p_duration_ms < 1 then
    return jsonb_build_object('ok', false, 'error', 'invalid_duration');
  end if;
  if p_used_hint is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_used_hint');
  end if;
  -- The TS regex check on localDate's YYYY-MM-DD shape is enforced here by the
  -- `date` parameter type; a malformed string never reaches this function.

  -- Step C: load puzzle.
  select pz.date, pz.grid_spec
    into v_puzzle_date, v_grid_spec
    from public.puzzles pz
   where pz.id = p_puzzle_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'puzzle_not_found');
  end if;

  -- Step D: future-date rejection. Reject null date or any puzzle dated strictly
  -- after today (UTC). Mirrors: if (!puzzle.date || puzzle.date > todayUtc) reject.
  if v_puzzle_date is null or v_puzzle_date > v_today_utc then
    return jsonb_build_object('ok', false, 'error', 'puzzle_not_available');
  end if;

  -- Step E: local_date +/-1 day clamp (mirrors resolveLocalToday).
  -- If p_local_date is within +/-1 calendar day of server UTC today, keep it;
  -- otherwise (null or more than 1 day away, past or future) fall back to today.
  if p_local_date is not null and abs(p_local_date - v_today_utc) <= 1 then
    v_validated := p_local_date;
  else
    v_validated := v_today_utc;
  end if;

  -- Step F: parse spec. We only depend on spec.solution (mirrors record-solve.ts,
  -- which reads spec.solution). Validate it is a 6x6 jsonb array of 0/1.
  v_solution := v_grid_spec -> 'solution';
  if v_solution is null
     or jsonb_typeof(v_solution) <> 'array'
     or jsonb_array_length(v_solution) <> 6 then
    return jsonb_build_object('ok', false, 'error', 'bad_spec');
  end if;

  -- Step G: grid == solution, cell-by-cell strict equality.
  -- Grid must be exactly 6x6, every cell present and equal to the solution.
  -- Any null/empty cell or mismatch fails.
  if p_grid is null
     or jsonb_typeof(p_grid) <> 'array'
     or jsonb_array_length(p_grid) <> 6 then
    return jsonb_build_object('ok', false, 'error', 'grid_mismatch');
  end if;

  for r in 0..5 loop
    -- each solution row must be a 6-length array
    if jsonb_typeof(v_solution -> r) <> 'array'
       or jsonb_array_length(v_solution -> r) <> 6 then
      return jsonb_build_object('ok', false, 'error', 'bad_spec');
    end if;
    -- each grid row must be a 6-length array
    if jsonb_typeof(p_grid -> r) <> 'array'
       or jsonb_array_length(p_grid -> r) <> 6 then
      return jsonb_build_object('ok', false, 'error', 'grid_mismatch');
    end if;

    for c in 0..5 loop
      -- expected solution cell (guaranteed 0|1 by spec; validators upstream).
      if jsonb_typeof(v_solution -> r -> c) <> 'number' then
        return jsonb_build_object('ok', false, 'error', 'bad_spec');
      end if;
      v_expected := (v_solution -> r ->> c)::integer;

      -- actual submitted cell: must be a number (null/empty cell => mismatch).
      v_actual_elem := p_grid -> r -> c;
      if jsonb_typeof(v_actual_elem) <> 'number' then
        return jsonb_build_object('ok', false, 'error', 'grid_mismatch');
      end if;
      v_actual := (p_grid -> r ->> c)::integer;

      if v_actual is distinct from v_expected then
        return jsonb_build_object('ok', false, 'error', 'grid_mismatch');
      end if;
    end loop;
  end loop;

  -- Step H + I: insert; treat unique_violation (already solved) as success.
  begin
    insert into public.solves (user_id, puzzle_id, duration_ms, used_hint, local_date)
    values (v_uid, p_puzzle_id, p_duration_ms, p_used_hint, v_validated);
  exception
    when unique_violation then
      -- 23505: user already solved this puzzle -> idempotent success.
      return jsonb_build_object('ok', true, 'alreadySolved', true);
  end;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.record_solve(uuid, jsonb, integer, boolean, date) from public;
grant execute on function public.record_solve(uuid, jsonb, integer, boolean, date) to authenticated;
