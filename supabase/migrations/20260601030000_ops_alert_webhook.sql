-- Add active push delivery to the ops_alert monitor (BE-6).
--
-- The existing check_daily_puzzle() monitor writes failures to ops_alert
-- + RAISE WARNING (Postgres logs) but fires no outbound notification.
-- This migration extends it to POST to a webhook URL stored in Vault
-- (e.g. a Slack incoming webhook, PagerDuty Events API, or Resend email).
-- On a healthy day the webhook is never called (no ops_alert insert).
--
-- IMPORTANT — setup steps (require sign-off, do not auto-apply):
--   1. Store your webhook URL in Vault:
--        INSERT INTO vault.secrets (name, secret, description)
--        VALUES ('ops_alert_webhook_url', '<your-webhook-url>',
--                'Delivery endpoint for ops_alert notifications');
--   2. Apply this migration:  supabase db push
--
-- If the vault secret is absent the function still runs correctly — it
-- skips the pg_net call so existing passive alerting (ops_alert table +
-- Postgres WARNING log) is unchanged.

create extension if not exists pg_net;

create or replace function public.check_daily_puzzle()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id  bigint;
  v_status      int;
  v_has_row     boolean;
  v_alert_kind  text;
  v_alert_detail text;
  v_webhook_url text;
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
    v_alert_kind   := 'daily_puzzle_missing';
    v_alert_detail := format(
      'no puzzles row for %s (cron http status: %s)',
      current_date, coalesce(v_status::text, 'unknown')
    );
  elsif v_status is not null and (v_status < 200 or v_status >= 300) then
    v_alert_kind   := 'daily_puzzle_http';
    v_alert_detail := format(
      'daily-puzzle returned HTTP %s for %s', v_status, current_date
    );
  end if;

  if v_alert_kind is not null then
    insert into public.ops_alert (kind, detail)
    values (v_alert_kind, v_alert_detail);

    raise warning 'daily-puzzle alert [%]: %', v_alert_kind, v_alert_detail;

    -- Active delivery: POST to the webhook URL if one is configured in Vault.
    select decrypted_secret into v_webhook_url
      from vault.decrypted_secrets
     where name = 'ops_alert_webhook_url';

    if v_webhook_url is not null then
      perform net.http_post(
        url     := v_webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body    := json_build_object(
          'text', format('[Halve] %s: %s', v_alert_kind, v_alert_detail)
        )::jsonb
      );
    end if;
  end if;
end;
$$;
