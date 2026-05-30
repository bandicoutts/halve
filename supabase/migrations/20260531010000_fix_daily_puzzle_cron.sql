-- Replace the daily-puzzle cron job (supersedes 20260531000000).
--
-- The project uses Supabase's new API key format (sb_publishable_/sb_secret_),
-- which are NOT JWTs, so the previous job's Bearer-token call would be rejected
-- by the function gateway (UNAUTHORIZED_INVALID_JWT_FORMAT). The function is now
-- deployed with verify_jwt = false, so it needs no caller token at all — and the
-- project URL isn't a secret, so we drop the Vault dependency entirely.

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
    url     := 'https://gyggmmlvgqjnjinbtpvz.supabase.co/functions/v1/daily-puzzle',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
