-- Schedule the daily-puzzle edge function to mint one puzzle per day.
--
-- The puzzles table is currently pre-seeded through 2026-12-31; this cron is the
-- self-renewing safety net so the daily runway never runs out silently after that.
-- The function is idempotent (skips if today's row already exists), so it is a
-- no-op while seeded dates remain and starts minting once they're exhausted.
--
-- ─── One-time setup (run once, NOT version-controlled — secrets) ───────────────
-- Store the project URL and service-role key in Vault so this job can call the
-- function endpoint without hardcoding credentials:
--
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>',                'service_role_key');
--
-- (Re-run with vault.update_secret(id, ...) to rotate.)
-- ───────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotent: drop any previous version of the job before (re)creating it.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-puzzle') then
    perform cron.unschedule('daily-puzzle');
  end if;
end
$$;

-- 00:05 UTC daily — a few minutes past midnight so the date has rolled over.
select cron.schedule(
  'daily-puzzle',
  '5 0 * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/daily-puzzle',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);
