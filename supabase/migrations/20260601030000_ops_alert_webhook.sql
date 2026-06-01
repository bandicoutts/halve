-- Add active email delivery to the ops_alert monitor via Resend (BE-6).
--
-- check_daily_puzzle() already writes to ops_alert + RAISE WARNING on failure.
-- This migration extends it to send an email via the Resend API when an alert
-- fires. On a healthy day the Resend call is never made.
--
-- SETUP (run once before applying):
--   In the Supabase dashboard → Vault → New secret:
--     Name:  resend_api_key
--     Value: <your Resend API key>
--
-- Then apply:  supabase db push

create extension if not exists pg_net;

-- ─── Email config (not sensitive — from/to addresses) ────────────────────────

insert into public.internal_config (key, value)
values ('alert_from_email', 'Halve <alerts@flynncoutts.com>')
on conflict (key) do nothing;

insert into public.internal_config (key, value)
values ('alert_to_email', 'd.coutts@gmail.com')
on conflict (key) do nothing;

-- ─── Updated monitor function ────────────────────────────────────────────────

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
  v_api_key     text;
  v_from_email  text;
  v_to_email    text;
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
      'No puzzles row for %s (cron HTTP status: %s)',
      current_date, coalesce(v_status::text, 'unknown')
    );
  elsif v_status is not null and (v_status < 200 or v_status >= 300) then
    v_alert_kind   := 'daily_puzzle_http_error';
    v_alert_detail := format(
      'daily-puzzle returned HTTP %s for %s', v_status, current_date
    );
  end if;

  if v_alert_kind is not null then
    insert into public.ops_alert (kind, detail)
    values (v_alert_kind, v_alert_detail);

    raise warning 'daily-puzzle alert [%]: %', v_alert_kind, v_alert_detail;

    -- Active delivery via Resend. Skips silently if the vault secret is absent.
    select decrypted_secret into v_api_key
      from vault.decrypted_secrets
     where name = 'resend_api_key';

    if v_api_key is not null then
      select value into v_from_email from public.internal_config where key = 'alert_from_email';
      select value into v_to_email   from public.internal_config where key = 'alert_to_email';

      perform net.http_post(
        url     := 'https://api.resend.com/emails',
        headers := json_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || v_api_key
        )::jsonb,
        body    := json_build_object(
          'from',    v_from_email,
          'to',      array[v_to_email],
          'subject', format('[Halve] %s', v_alert_kind),
          'text',    v_alert_detail
        )::jsonb
      );
    end if;
  end if;
end;
$$;
