-- HOUSEKEEPING: Read cron endpoint URL from Vault instead of hardcoding it.
--
-- The initial migration (20260531000000_schedule_daily_puzzle.sql) read the URL
-- from vault.decrypted_secrets('project_url'), but subsequent cron reschedules
-- in _fix_daily_puzzle_cron, _cron_secret_auth, and _cron_secret_vault reverted
-- to the hardcoded literal 'https://gyggmmlvgqjnjinbtpvz.supabase.co/...' with
-- the comment "project URL is public; not a secret". While technically correct
-- for a single-environment deployment, any fork or staging environment would
-- inadvertently ping production.
--
-- This migration restores the Vault-backed URL. If 'project_url' is not yet in
-- Vault for this environment, run the one-time setup described in
-- 20260531000000_schedule_daily_puzzle.sql:
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--
-- Auth continues to use 'cron_auth_token' from Vault (set by _cron_secret_vault).

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-puzzle') then
    perform cron.unschedule('daily-puzzle');
  end if;
end
$$;

-- 00:05 UTC — both URL and auth token read from Vault at execution time.
select cron.schedule(
  'daily-puzzle',
  '5 0 * * *',
  $$
  insert into public.daily_puzzle_cron_run (net_request_id)
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/daily-puzzle',
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
