# Decision log (ADR)

Append-only. Newest first. One entry per decision: `date · decision · why`. Log decisions in the **same commit** as the code change.

---

- **2026-05-29 · Renamed to "Parity"; symbols changed from sun/moon to fire & water.** Supersedes the earlier "Lumen / refined-celestial" identity. *Why:* sun/moon is Tango's signature element and undercut the goal of an original stamp; and "Lumen" (a unit of light) only fit a celestial theme. *Now:* the name **Parity** is decoupled from the art (it names the balance rule), and the pieces are an amber-red **flame** vs cool teal **droplet** — genuine opposites mapping to the `≠` rule, with fire as the single hero accent. The earlier sun+moon master mark also failed the 44px squint test (muddy overlap); the new mark must read as one clean shape at small sizes. Folder + GitHub repo renamed `lumen` → `parity` (old URL auto-redirects).
- **2026-05-29 · Web-first, Flutter later, shared Supabase backend.** Lowest-risk path to a shippable, beautiful product; lets us nail design + engine once before porting.
- **2026-05-29 · Daily puzzle + unlimited practice mode.** Daily drives streaks/sharing (viral loop); practice drives replay. Covers both retention loops.
- **2026-05-29 · Build our own generator + solver (not a precomputed bank).** Infinite content; full control over uniqueness + deduction-only guarantee and difficulty scoring. 6×6 generation is cheap enough at runtime.
- **2026-05-29 · Supabase Auth from day one.** Streaks/stats must sync across devices, so accounts are foundational rather than retrofitted.
- **2026-05-29 · Social v1 = shareable result cards + personal streaks/stats. No leaderboards yet.** Sharing is the cheap virality win; leaderboards add backend cost without v1 payoff.
- **2026-05-29 · Fixed 6×6 grid; difficulty by deduction depth (not multiple sizes).** Cleanest, most premium; difficulty = clue count + required deduction techniques. 4×4 reserved for tutorial.
- **2026-05-29 · Stack: Next.js 16 + Tailwind + Supabase + Vercel; pnpm monorepo with shared TS engine + design-token packages.** Matches existing global Next.js/Supabase conventions; tokens centralized to avoid an "AI component-library" look.
- **2026-05-29 · Streaks/stats derived from a `solves` table, not denormalized.** Avoids premature denormalization; recompute is cheap at our scale.
- **2026-05-29 · Working title "Lumen"; refined-minimalism visual style; sun/moon symbols as custom vector art.** Final name + symbol direction to be locked in Phase 2.
