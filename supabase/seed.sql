-- Local dev seed: insert a sample puzzle for today so the home screen has data.
-- Run after `supabase db reset` or `supabase db seed`.

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
