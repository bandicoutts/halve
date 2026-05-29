-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ─── puzzles ─────────────────────────────────────────────────────────────────
-- Stores each generated puzzle. date is set for daily puzzles, null for practice.
-- grid_spec is the full JSON blob: { solution, givens, edges }.
create table public.puzzles (
  id           uuid primary key default gen_random_uuid(),
  date         date unique,
  difficulty   text not null check (difficulty in ('easy', 'medium', 'hard')),
  grid_spec    jsonb not null,
  seed         bigint not null,
  created_at   timestamptz not null default now()
);

-- Puzzles are world-readable; only the service role (edge function) may insert.
alter table public.puzzles enable row level security;

create policy "puzzles_select_all" on public.puzzles
  for select using (true);

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- One row per auth user; created on first sign-in via a trigger.
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── solves ───────────────────────────────────────────────────────────────────
-- One row per user per puzzle solve.
-- Streaks and stats are derived from this table — never denormalized.
create table public.solves (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  puzzle_id    uuid not null references public.puzzles on delete cascade,
  solved_at    timestamptz not null default now(),
  duration_ms  integer not null check (duration_ms > 0),
  used_hint    boolean not null default false,
  unique (user_id, puzzle_id)
);

alter table public.solves enable row level security;

create policy "solves_select_own" on public.solves
  for select using (auth.uid() = user_id);

create policy "solves_insert_own" on public.solves
  for insert with check (auth.uid() = user_id);

-- Index for streak/stats queries (user + date order)
create index solves_user_solved_at on public.solves (user_id, solved_at desc);
