-- SEC-4 (audit 2026-05-31): document the accepted threat model for the
-- world-readable puzzle solution. This migration changes NO behaviour — it only
-- attaches COMMENT annotations so the decision is discoverable from the DB itself
-- (\d+ / pg_description), mirroring the DECISIONS.md entry of the same date.
--
-- Threat model, in full:
--   * `grid_spec` (jsonb) embeds the full `solution`, and the puzzles_select_all
--     policy makes every row world-readable (anon + authenticated). So any visitor
--     can read today's answer via DevTools or a direct PostgREST select.
--   * This is INTENTIONAL and accepted. Cross-user / streak cheating is already
--     blocked server-side: app/actions/record-solve.ts re-loads the solution,
--     byte-compares the submitted grid, and rejects future-dated puzzles — a solve
--     row can only be written by someone who produced the genuine grid, and never
--     for a puzzle that hasn't been published yet.
--   * The residual is SELF-CHEAT only: a user could read the answer and type it in
--     to log a fast, legitimate-looking solve. With no leaderboards (firm v1
--     decision, DECISIONS 2026-05-29) this pollutes only that user's own private
--     stats — they are cheating solitaire. Acceptable for a daily puzzle.
--   * Revisit if competitive features (leaderboards, head-to-head, public times)
--     are ever added: at that point the solution must be split out of client reach
--     (own column with column-level GRANTs + a SECURITY DEFINER validate/insert RPC
--     so the service-role key need not enter the web env). See SEC-4 option (b).

comment on policy "puzzles_select_all" on public.puzzles is
  'INTENTIONAL world-readable. grid_spec embeds the full solution, so the answer '
  'is client-readable. Accepted threat model (SEC-4): cross-user/streak cheating '
  'is blocked server-side by record-solve.ts (server re-validates the grid + '
  'rejects future-dated puzzles); the residual is self-cheat against one''s own '
  'private stats, acceptable because there are no leaderboards. Revisit (split '
  'solution behind a SECURITY DEFINER RPC) if competitive features are added.';

comment on column public.puzzles.grid_spec is
  'jsonb { solution, givens, edges }. NOTE: solution is world-readable via the '
  'puzzles_select_all policy — see that policy''s comment and SEC-4 in '
  'docs/DECISIONS.md / docs/AUDIT.md for the accepted threat model.';
