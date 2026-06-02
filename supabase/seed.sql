-- Local dev seed: insert puzzles for today + two past months so the archive
-- month navigation can be exercised locally.
-- Run after `supabase db reset` or `supabase db seed`.

-- Today's puzzle
insert into public.puzzles (date, difficulty, grid_spec, seed)
values (
  current_date,
  'medium',
  '{
    "solution": [[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1]],
    "givens":   [[0,null,null,1,null,null],[null,0,null,null,0,null],[null,null,null,null,null,null],[1,null,1,null,null,1],[null,1,null,null,null,null],[null,null,1,null,0,null]],
    "edges":    [{"orientation":"h","r":0,"c":1,"kind":"ne"},{"orientation":"v","r":2,"c":3,"kind":"eq"}]
  }'::jsonb,
  1716940800000
)
on conflict (date) do nothing;

-- Past-month puzzles (one month ago) — ensures archive < navigation is testable.
insert into public.puzzles (date, difficulty, grid_spec, seed)
values
  (current_date - interval '30 days', 'easy',
   '{"solution":[[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1]],"givens":[[0,null,null,1,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null]],"edges":[]}'::jsonb,
   1714348800001),
  (current_date - interval '29 days', 'hard',
   '{"solution":[[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1]],"givens":[[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[1,null,1,null,null,1],[null,1,null,null,null,null],[null,null,1,null,0,null]],"edges":[{"orientation":"v","r":1,"c":2,"kind":"eq"}]}'::jsonb,
   1714348800002),
  (current_date - interval '28 days', 'medium',
   '{"solution":[[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1]],"givens":[[0,null,null,null,null,null],[null,0,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null]],"edges":[{"orientation":"h","r":3,"c":1,"kind":"ne"}]}'::jsonb,
   1714348800003)
on conflict (date) do nothing;

-- Two-months-ago puzzle for deeper archive testing.
insert into public.puzzles (date, difficulty, grid_spec, seed)
values (
  current_date - interval '60 days', 'easy',
  '{"solution":[[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1],[0,1,0,1,1,0],[1,0,1,0,0,1]],"givens":[[0,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null],[null,null,null,null,null,null]],"edges":[]}'::jsonb,
  1714348800004
)
on conflict (date) do nothing;
