-- Harden the daily-puzzle cron call with a shared secret (SEC-2).
--
-- vault.secrets requires pgsodium internal roles that migrations cannot use.
-- Instead a plain internal_config table stores the token: RLS enabled with
-- no policies blocks PostgREST access (anon/authenticated cannot read it),
-- while pg_cron and SECURITY DEFINER functions can read it normally.
--
-- IMPORTANT — after applying this migration you must wire the secret to the
-- edge function.  Run these two commands separately in your terminal:
--
--   1. Extract the generated secret:
--      supabase db execute --sql \
--        "select value from public.internal_config where key = 'cron_secret'"
--
--   2. Set it as a function secret (replace <VALUE> with the output of step 1):
--      supabase secrets set CRON_SECRET=<VALUE>
--
--   3. Deploy the updated edge function:
--      supabase functions deploy daily-puzzle
--
-- After step 3 the function rejects any caller that omits or mismatches the
-- Authorization header.  The fail-open guard in the function means the cron
-- still works during the apply → deploy window.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─── Internal config table (PostgREST-opaque) ────────────────────────────────

create table if not exists public.internal_config (
  key   text primary key,
  value text not null
);

alter table public.internal_config enable row level security;
-- Intentionally no policies — RLS with zero policies blocks all PostgREST
-- access (anon and authenticated roles) while allowing direct DB access by
-- pg_cron and SECURITY DEFINER functions.
comment on table public.internal_config is
  'Internal key-value store. RLS with no policies blocks PostgREST; '
  'readable only by pg_cron and SECURITY DEFINER functions.';

-- Idempotent: generate a random cron secret on first install only.
insert into public.internal_config (key, value)
values ('cron_secret', gen_random_uuid()::text)
on conflict (key) do nothing;

-- ─── Re-schedule the cron to carry the secret ────────────────────────────────

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-puzzle') then
    perform cron.unschedule('daily-puzzle');
  end if;
end
$$;

-- 00:05 UTC — reads cron_secret from internal_config at execution time.
select cron.schedule(
  'daily-puzzle',
  '5 0 * * *',
  $$
  insert into public.daily_puzzle_cron_run (net_request_id)
  select net.http_post(
    url     := 'https://gyggmmlvgqjnjinbtpvz.supabase.co/functions/v1/daily-puzzle', -- project URL is public; not a secret
    headers := json_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        select value from public.internal_config where key = 'cron_secret'
      )
    )::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
