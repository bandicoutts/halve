-- Local dev seed: insert puzzles for today + two past months so the archive
-- month navigation can be exercised locally.
-- Run after `supabase db reset` or `supabase db seed`.
--
-- Solutions are distinct puzzles generated via the engine's generateDaily for
-- 5 recent dates (2026-06-01 through 2026-06-05). Each has a meaningfully
-- different solution pattern covering easy/medium/hard difficulties.

-- Today's puzzle (2026-06-03: medium, seed 3202395002)
insert into public.puzzles (date, difficulty, grid_spec, seed)
values (
  current_date,
  'medium',
  '{
    "solution": [[1,0,1,1,0,0],[1,1,0,0,1,0],[0,1,1,0,0,1],[0,0,1,1,0,1],[1,0,0,1,1,0],[0,1,0,0,1,1]],
    "givens":   [[1,0,1,1,null,null],[null,null,null,null,1,null],[0,null,null,0,0,null],[0,0,1,null,null,1],[null,0,0,1,null,null],[null,1,0,null,1,1]],
    "edges":    [{"orientation":"v","r":1,"c":0,"kind":"ne"},{"orientation":"v","r":1,"c":5,"kind":"ne"},{"orientation":"v","r":3,"c":5,"kind":"ne"},{"orientation":"h","r":0,"c":2,"kind":"eq"}]
  }'::jsonb,
  3202395002
)
on conflict (date) do nothing;

-- Past-month puzzles (one month ago) — ensures archive < navigation is testable.
insert into public.puzzles (date, difficulty, grid_spec, seed)
values
  -- 2026-06-01: medium, seed 3168839764
  (current_date - interval '2 days', 'medium',
   '{"solution":[[0,0,1,1,0,1],[1,0,0,1,0,1],[0,1,1,0,1,0],[1,1,0,0,1,0],[1,0,0,1,0,1],[0,1,1,0,1,0]],"givens":[[null,0,1,null,0,1],[null,0,0,1,null,1],[null,1,null,0,null,0],[1,null,null,0,null,null],[1,null,null,null,0,null],[0,1,1,0,null,0]],"edges":[{"orientation":"h","r":3,"c":0,"kind":"eq"},{"orientation":"v","r":1,"c":4,"kind":"ne"}]}'::jsonb,
   3168839764),
  -- 2026-06-02: easy, seed 3219172621
  (current_date - interval '1 day', 'easy',
   '{"solution":[[1,1,0,0,1,0],[0,1,0,1,1,0],[1,0,1,0,0,1],[1,1,0,1,0,0],[0,0,1,0,1,1],[0,0,1,1,0,1]],"givens":[[1,1,0,0,1,null],[0,1,0,1,1,0],[1,0,1,null,0,1],[1,null,0,1,null,0],[0,0,1,0,null,1],[null,0,1,1,0,1]],"edges":[{"orientation":"v","r":0,"c":0,"kind":"ne"},{"orientation":"v","r":2,"c":4,"kind":"eq"},{"orientation":"h","r":3,"c":1,"kind":"ne"}]}'::jsonb,
   3219172621),
  -- 2026-06-04: hard, seed 3118506907
  (current_date + interval '1 day', 'hard',
   '{"solution":[[0,1,1,0,1,0],[1,0,0,1,0,1],[0,0,1,1,0,1],[0,1,1,0,1,0],[1,1,0,0,1,0],[1,0,0,1,0,1]],"givens":[[0,null,null,0,null,null],[null,null,null,null,null,1],[0,null,null,null,null,null],[null,null,null,null,1,null],[1,1,null,null,1,null],[null,null,null,null,null,null]],"edges":[{"orientation":"h","r":0,"c":3,"kind":"ne"},{"orientation":"v","r":4,"c":2,"kind":"eq"}]}'::jsonb,
   3118506907),
  -- 2026-06-05: medium, seed 3101729288
  (current_date + interval '2 days', 'medium',
   '{"solution":[[0,0,1,0,1,1],[0,1,0,0,1,1],[1,0,1,1,0,0],[1,1,0,0,1,0],[0,1,0,1,0,1],[1,0,1,1,0,0]],"givens":[[0,0,1,0,1,null],[0,null,null,0,null,null],[1,null,1,1,null,null],[1,null,0,0,1,null],[0,1,0,null,null,1],[null,0,1,null,null,null]],"edges":[{"orientation":"h","r":2,"c":0,"kind":"ne"},{"orientation":"v","r":3,"c":1,"kind":"eq"},{"orientation":"h","r":0,"c":2,"kind":"ne"}]}'::jsonb,
   3101729288)
on conflict (date) do nothing;

-- Two-months-ago puzzle for deeper archive testing (2026-06-01 pattern, offset).
insert into public.puzzles (date, difficulty, grid_spec, seed)
values (
  current_date - interval '60 days', 'medium',
  '{"solution":[[0,0,1,1,0,1],[1,0,0,1,0,1],[0,1,1,0,1,0],[1,1,0,0,1,0],[1,0,0,1,0,1],[0,1,1,0,1,0]],"givens":[[null,0,1,null,0,1],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null]],"edges":[]}'::jsonb,
  3168839764
)
on conflict (date) do nothing;
