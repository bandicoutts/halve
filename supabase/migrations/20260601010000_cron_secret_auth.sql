-- Harden the daily-puzzle cron call with a shared secret (SEC-2).
--
-- The edge function now checks Authorization: Bearer <CRON_SECRET>. This
-- migration (1) creates a random vault secret for the cron to carry, and
-- (2) re-schedules the cron to read that secret from the Vault at runtime.
--
-- IMPORTANT — deploy steps (require sign-off, do not auto-apply):
--   1. Apply this migration:  supabase db push
--   2. Read the generated secret from Vault and set it as a function secret:
--        supabase secrets set CRON_SECRET="$(
--          psql "$DATABASE_URL" -Atc \
--            "select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'"
--        )"
--   3. Deploy the updated edge function:  supabase functions deploy daily-puzzle
--
-- After step 3 the function will reject any caller that omits or mismatches
-- the Authorization header. The fail-open guard in the function means that
-- during the window between migration and deploy (steps 1 and 3), the cron
-- still works — the new cron body passes the secret, and the old function
-- ignores it (no CRON_SECRET env yet).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─── Vault secret (idempotent) ────────────────────────────────────────────────

-- Generate a new random secret only on first install; never overwrite an
-- existing one (re-running the migration must be safe).
insert into vault.secrets (name, secret, description)
select
  'cron_secret',
  gen_random_uuid()::text,
  'Shared bearer token for authenticating the daily-puzzle cron HTTP call'
where not exists (
  select 1 from vault.secrets where name = 'cron_secret'
);

-- ─── Re-schedule the cron to carry the secret ────────────────────────────────

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-puzzle') then
    perform cron.unschedule('daily-puzzle');
  end if;
end
$$;

-- 00:05 UTC — reads the cron_secret from Vault at schedule time.
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
        select decrypted_secret
          from vault.decrypted_secrets
         where name = 'cron_secret'
      )
    )::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
