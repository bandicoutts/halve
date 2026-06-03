-- SEC-3: Cap profiles.display_name length at the database layer.
--
-- display_name had no length limit or sanitization at any layer (client Input,
-- server action, DB). This is the last of the three: a CHECK constraint so an
-- over-length value can't be persisted even via a direct write that bypasses the
-- onboarding Input's maxLength and the saveDisplayName server action.
--
-- null is allowed (the profile row is created unset by the handle_new_user
-- trigger); a set name must be 1–40 chars after the app trims it. Kept in sync
-- with DISPLAY_NAME_MAX in apps/web/src/app/actions/save-display-name.ts.
--
-- char_length counts Unicode code points; JS .length counts UTF-16 code units.
-- 40 emoji = 40 code points (DB allows) but up to 80 UTF-16 code units —
-- unreachable via the UI's maxLength={40}, which counts UTF-16 units.
--
-- NOT VALID skips the scan of existing rows on add; we validate separately so
-- the constraint is enforced for both new writes and (once validated) old rows.

alter table public.profiles
  add constraint display_name_length
  check (display_name is null or char_length(display_name) between 1 and 40)
  not valid;

alter table public.profiles
  validate constraint display_name_length;
