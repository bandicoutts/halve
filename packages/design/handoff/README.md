# Parity — Design System

Parity is a **premium daily logic-puzzle app**. Each day delivers one hand-tuned binary
Latin-square puzzle: fill a 6×6 grid with two symbols (**fire** and **water**) so that
no more than two identical symbols sit adjacent, each row and column holds an equal count
of each symbol, and `=` / `≠` signs on the edges between cells constrain neighbours. Every
puzzle has a single solution reachable by pure deduction — no guessing.

The product is **Wordle's daily ritual** meets a **beautifully crafted, design-led puzzle**.
The emotional target is *calm, premium, considered* — closer to Things or Linear than to a
dashboard or a component-library demo.

## Design direction in one line
**Refined minimalism.** Generous whitespace, a restrained warm palette, one confident
accent (fire's amber-red), impeccable type hierarchy, and a single signature device: the
**light / dark duality**. The 6×6 grid is the hero of every game screen.

## Products / surfaces
There is effectively **one product**: the Parity app, mobile-first, with a desktop layout for
the board. The UI kit (`ui_kits/app/`) recreates the core screens:

- **Onboarding / how-to-play** — animated explanation of the four rules with example grids and ✓/✗ states
- **Home** — today's daily puzzle as the focal CTA, streak prominent, secondary entry to Practice
- **Puzzle board** — the 6×6 grid with given cells, `=`/`≠` edge signs, live timer, Undo & Hint
- **Solve / win** — completion state with time + streak and a spoiler-free shareable result card
- **Practice** — difficulty selector (Easy / Medium / Hard) → fresh puzzle
- **Stats / profile** — streak, history, average time, distribution; calm tabular data viz
- **Auth** — minimal sign-in / sign-up (email + social)

## Sources
This system was built from a **written product brief** (no codebase, Figma file, or existing
assets were provided). All identity — the fire/water symbols, wordmark, app icon, palette, and
type choices — is **original work created for this brief**. If an existing Parity codebase or
Figma library exists, re-attach it and this system should be reconciled against it.

---

## CONTENT FUNDAMENTALS

**Voice:** quiet, warm, and self-assured. Parity speaks like a calm host, never a hype-man.
Short sentences. No exclamation marks except in genuine celebration (and even then, sparingly).
It trusts the player's intelligence — it explains the rules once, clearly, then gets out of the way.

- **Person:** Second person for instructions and prompts (*"Fill the grid…", "You solved it"*).
  First-person plural only for the brand's own voice in rare moments. Avoid "I".
- **Casing:** **Sentence case everywhere** — buttons, headings, labels, menu items.
  The only uppercase is the small tracked **eyebrow label** style (e.g. `CURRENT STREAK`,
  `DIFFICULTY`) used for metadata, never for prose.
- **Tone words:** calm, deductive, daily, quiet, clear, satisfying. Never: "crush", "level up",
  "unlock", "addictive", "gamechanger".
- **Numbers:** always typeset with tabular numerals (timers, streaks, stats). Times are `m:ss`
  (`2:47`) or `mm:ss` for longer.
- **Emoji:** **none.** Not in UI, not in share text. The fire/water symbols and the ✓/✗ marks do
  all the iconic work. (A plain text share might read `Parity No. 142 · 2:47 · streak 41`.)
- **Microcopy examples:**
  - CTA: *"Play today"*, *"Continue"*, *"Practice"*
  - Empty/practice: *"A fresh puzzle, any time."*
  - Win: *"Solved in 2:47"* / *"Day 41 of your streak."*
  - Rule: *"No more than two of the same symbol may touch."*
  - Hint: *"One cell can be filled with certainty. Reveal it?"*
- **Punctuation flourish:** an em dash for a calm aside; a middle dot `·` to separate metadata
  (`No. 142 · 2:47`). Avoid ellipses and ALL-CAPS emphasis.

---

## VISUAL FOUNDATIONS

**The signature device — light/dark duality.** The brand *is* the toggle between a warm
off-white **"paper"** light mode and a deep warm **"ink"** dark mode. The two game symbols
embody it: **fire** (amber-red flame, pointing upward) and **water** (cool-teal droplet,
pointing downward). Both modes are first-class, fully designed, and instantly switchable.

**Color.** Neutrals are **warm, never cold grey** — paper is `#F6F1E8`, ink is `#14110B`,
foregrounds carry a clay/brown undertone. There is exactly **one accent**: fire's amber-red
(`#B03E12` on paper, brightened to `#E86B38` on ink). Water's cool teal
(`#2A7A6E` / `#6EC8BC`) is a secondary identity color, not a UI accent. Feedback colors
(calm green `#4E8A66`, warm red `#C2564B`) appear only for correctness. See
`colors_and_type.css` for the full token set.

**Type.** A single **characterful grotesque — Space Grotesk** — does all the work, from the
wordmark to body copy. Weights 400/500/600; display and headings at 500 with tight tracking
(`-0.02em`). **Tabular numerals** are mandatory for any number that changes (timer, streak,
stats) so digits never shift width. No second typeface. *(Substitution flag below.)*

**Spacing.** Strict **8-point system** (4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80).
Generous — screens breathe. The board gets the most air; chrome is minimal.

**Layout.** Mobile-first, single column, content centered horizontally but **vertically
asymmetric** — the board sits in the optical center with deliberate weight above (title/timer)
and below (controls). Deliberate asymmetry over rigid centering for everything. Fixed elements:
a slim top bar (back / title / theme toggle) and, on the board, a fixed control row. The 6×6
grid is always the largest object on screen.

**Backgrounds.** Flat warm solids — **no gradients, no images, no patterns, no textures, no
glassmorphism.** Depth comes only from subtle surface lightening + soft shadow (paper) or
surface lightening + hairline borders (ink).

**Borders & hairlines.** 1px warm hairlines (`--hairline`) separate regions; 1.5px borders on
secondary buttons and given/placed cell outlines. Corner radii are restrained: `6 / 10 / 12
(cell) / 16 / 22`, plus full pills for primary buttons and the theme toggle.

**Shadows.** Warm-tinted and **soft**, never harsh. Paper uses three low-opacity brown-tinted
elevations (`sm/md/lg`) for raised cards, placed cells, and sheets. **Dark mode relies on
hairline borders + surface lightening, not shadow** — shadows are nearly invisible on ink.
No hard drop-shadows, no neon glows.

**Cards.** Surface fill (`--surface`), 1px hairline, `--radius-xl` (22) for large sheets /
`--radius-lg` (16) for tiles, and `--shadow-md` on paper / hairline-only on ink. Quiet,
not floaty.

**Transparency & blur.** Used **sparingly** — only a light scrim behind modal sheets and the
theme overlay. No frosted-glass panels.

**Imagery vibe.** There is essentially **no photography**. The visual world is geometric and
warm — amber-red and teal on paper/ink. If imagery is ever introduced it should be warm-toned
and restrained, never cool or glossy.

**Animation.** Calm and quick. Standard easing `cubic-bezier(0.4, 0, 0.2, 1)`, ~160–220ms.
**Fades and small position shifts**, not bounces or springs (one exception: a gentle scale-in
"settle" on the win state is acceptable). Symbol placement crossfades; the timer ticks without
animation. No parallax, no looping ambient motion.

**Hover states (desktop board):** subtle — background lifts toward `--surface-raised`, or text
moves `--fg-2 → --fg-1`. Never a color-shift on the accent except the primary button
(`--accent → --accent-strong`).

**Press states:** primary button darkens (`--accent-strong`) **and** scales to `0.98`. Cells
give a quick scale `0.96` tap feedback. Restraint over flashiness.

**Protection:** signs on cell edges sit in a small pill/capsule filled with the page bg so they
read cleanly over the grid lines — a capsule, not a gradient.

---

## ICONOGRAPHY

Parity's iconography is deliberately **tiny and functional**, so the fire/water symbols stay
the stars of the show.

- **Brand symbols (custom vector):** the **fire** (`assets/symbol-fire.svg`, an amber-red
  teardrop pointing upward) and the **water** (`assets/symbol-water.svg`, a cool-teal teardrop
  pointing downward). These are *not* icons from a set — they are bespoke brand marks and the
  only illustration in the system. Also: `assets/mark.svg` (the flame + bridge + droplet
  equilibrium lockup), `assets/app-icon.svg` (the rounded-tile app icon). In the UI kit they
  are inlined as SVG with theme-aware `fill` (`var(--symbol-fire)` / `var(--symbol-water)`) so
  the water symbol brightens on ink.
- **UI icons:** **[Lucide](https://lucide.dev)**, linked from CDN — a minimal, even-stroke
  (≈1.75px) line set that matches the calm aesthetic. Used only where unavoidable: `rotate-ccw`
  (undo), `lightbulb` (hint), `share`, `settings`, `chevron-left`, `x`, `bar-chart`, `flame`
  (streak, used as a quiet line glyph — never the emoji). Keep icons at 20–22px, color `--fg-2`.
  *This is a substitution* — there was no provided icon set; Lucide is the closest minimal match
  and should be swapped if the brand later commissions custom icons.
- **The `=` / `≠` signs** are typographic glyphs (`=`, `≠` U+2260), set in Space Grotesk inside
  a small bg-filled capsule on cell edges — not icons.
- **Emoji & unicode-as-icon:** **never.** No emoji anywhere. The only non-Latin glyphs used are
  `=`, `≠`, `·` (middle dot), `—` (em dash), `✓`/`✗` for rule examples.

### ⚠ Substitution flags (please confirm or replace)
1. **Typeface — Space Grotesk (Google Fonts).** No font files were provided. Space Grotesk was
   chosen as the characterful grotesque; loaded via Google Fonts CDN. If Parity has a licensed
   brand face, drop the files in `fonts/` and update `--font-sans` in `colors_and_type.css`.
2. **UI icons — Lucide (CDN).** Substituted for an unspecified icon set (see Iconography).

---

## Index — what's in this system

| File / folder | What it is |
|---|---|
| `README.md` | This document — context, content & visual foundations, iconography, index |
| `SKILL.md` | Agent-Skill manifest so this system works as a downloadable Claude skill |
| `colors_and_type.css` | All tokens: light/dark colors, type scale + classes, spacing, radii, shadows |
| `assets/symbol-fire.svg` | Fire game symbol (amber-red flame) |
| `assets/symbol-water.svg` | Water game symbol (cool-teal droplet) |
| `assets/mark.svg` | Flame + bridge + droplet equilibrium mark |
| `assets/app-icon.svg` | Rounded-tile app icon |
| `preview/*.html` | Design-system cards shown in the Design System tab (colors, type, spacing, components, brand) |
| `ui_kits/app/` | High-fidelity interactive recreation of the Parity app — see its own README |

**Start here:** read this README, open `colors_and_type.css` for the tokens, then open
`ui_kits/app/index.html` for the working app, and browse `preview/` for the foundation cards.
