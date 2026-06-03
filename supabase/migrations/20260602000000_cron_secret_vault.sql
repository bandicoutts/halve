-- SEC-8: Move cron_auth_token from public.internal_config (plaintext) to Supabase Vault.
--
-- The original SEC-2 migration (20260601010000_cron_secret_auth.sql) stored the
-- cron bearer token in internal_config, protected only by RLS. Any SECURITY
-- DEFINER function running as the postgres role can read the full internal_config
-- table as a side channel, bypassing RLS entirely.
--
-- Vault encrypts the value at rest via pgsodium. The plaintext is only available
-- through vault.decrypted_secrets, which pg_cron and SECURITY DEFINER functions
-- can access while PostgREST (anon/authenticated) cannot.
--
-- What this migration does:
--   1. Reads the existing token from internal_config and stores it in Vault
--      under the name 'cron_auth_token'. Idempotent — skips if the vault entry
--      already exists.
--   2. Deletes the plaintext row from internal_config.
--   3. Reschedules the daily-puzzle cron to read the token from
--      vault.decrypted_secrets instead of internal_config.
--
-- The edge function reads CRON_SECRET from its own environment (set via
-- `supabase secrets set CRON_SECRET=<value>`). The token value is unchanged, so
-- no edge-function redeployment is required.
--
-- Deploy: supabase db push

-- ─── Migrate secret into Vault (idempotent) ──────────────────────────────────

do $$
declare
  v_existing_id  uuid;
  v_value        text;
begin
  -- Skip if vault entry already exists (re-run safety)
  select id into v_existing_id
    from vault.secrets
   where name = 'cron_auth_token';

  if v_existing_id is null then
    -- Migrate the existing plaintext value; generate a fresh one if already gone
    select value into v_value
      from public.internal_config
     where key = 'cron_secret';

    if v_value is null then
      v_value := gen_random_uuid()::text;
    end if;

    perform vault.create_secret(
      v_value,
      'cron_auth_token',
      'Bearer token that pg_cron sends to the daily-puzzle edge function'
    );
  end if;
end
$$;

-- Remove the plaintext token — vault is now the single source of truth
delete from public.internal_config where key = 'cron_secret';

-- ─── Reschedule cron to read the token from Vault ────────────────────────────

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-puzzle') then
    perform cron.unschedule('daily-puzzle');
  end if;
end
$$;

-- 00:05 UTC — reads cron_auth_token from Vault at execution time.
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
        select decrypted_secret from vault.decrypted_secrets where name = 'cron_auth_token'
      )
    )::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
