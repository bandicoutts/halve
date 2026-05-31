-- Surface daily-puzzle minting failures instead of failing silently (BE-2 / EPIC-A).
--
-- The 00:05 cron fires net.http_post and discards the result, so a non-2xx
-- response or a missing daily row went completely unobserved — users would get
-- the offline fallback (no puzzleId → unrecordable solve → silent streak break)
-- with no operator signal. This migration adds capture + an alert hook:
--   1. The cron now records each call's pg_net request id.
--   2. A 00:15 monitor checks today's puzzles row and the call's HTTP status,
--      writing to public.ops_alert and RAISE WARNING (Postgres logs) on failure.
--
-- Supersedes the cron body from 20260531010000 (same URL, now id-capturing).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─── Alert sink + per-run tracking ───────────────────────────────────────────

create table if not exists public.ops_alert (
  id          bigserial primary key,
  kind        text not null,
  detail      text,
  created_at  timestamptz not null default now()
);

-- Service-role / admin only: lock down with RLS and no policies.
alter table public.ops_alert enable row level security;

create table if not exists public.daily_puzzle_cron_run (
  id              bigserial primary key,
  run_date        date not null default current_date,
  net_request_id  bigint,
  requested_at    timestamptz not null default now()
);

alter table public.daily_puzzle_cron_run enable row level security;

-- ─── Re-schedule the minting cron to capture the pg_net request id ───────────

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-puzzle') then
    perform cron.unschedule('daily-puzzle');
  end if;
end
$$;

-- 00:05 UTC — net.http_post returns the request id; persist it for the monitor.
select cron.schedule(
  'daily-puzzle',
  '5 0 * * *',
  $$
  insert into public.daily_puzzle_cron_run (net_request_id)
  select net.http_post(
    url     := 'https://gyggmmlvgqjnjinbtpvz.supabase.co/functions/v1/daily-puzzle',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Monitor: 10 minutes later, verify the row landed and the call succeeded ──

create or replace function public.check_daily_puzzle()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id bigint;
  v_status     int;
  v_has_row    boolean;
begin
  select exists (select 1 from public.puzzles where date = current_date)
    into v_has_row;

  select net_request_id
    into v_request_id
    from public.daily_puzzle_cron_run
   where run_date = current_date
   order by id desc
   limit 1;

  if v_request_id is not null then
    select status_code into v_status
      from net._http_response
     where id = v_request_id;
  end if;

  if not v_has_row then
    insert into public.ops_alert (kind, detail)
    values (
      'daily_puzzle_missing',
      format('no puzzles row for %s (cron http status: %s)',
             current_date, coalesce(v_status::text, 'unknown'))
    );
    raise warning 'daily-puzzle: no puzzles row for % (http status %)',
      current_date, coalesce(v_status::text, 'unknown');
  elsif v_status is not null and (v_status < 200 or v_status >= 300) then
    insert into public.ops_alert (kind, detail)
    values (
      'daily_puzzle_http',
      format('daily-puzzle returned HTTP %s for %s', v_status, current_date)
    );
    raise warning 'daily-puzzle: HTTP % for %', v_status, current_date;
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-puzzle-monitor') then
    perform cron.unschedule('daily-puzzle-monitor');
  end if;
end
$$;

-- 00:15 UTC — 10 min after minting, enough for the function + insert to settle.
select cron.schedule(
  'daily-puzzle-monitor',
  '15 0 * * *',
  $$ select public.check_daily_puzzle(); $$
);
