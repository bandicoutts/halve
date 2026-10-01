# Halve — brand canon (portable)

> **What this is.** A self-contained brand brief to paste into **Claude Design's** project
> CLAUDE.md / project knowledge, so it stops reintroducing old names. It is a **mirror**,
> not the source. The source of truth is `docs/DESIGN.md` (brand) + `docs/DECISIONS.md`
> (the *why*) + `packages/design/styles/tokens.css` (tokens) in the repo. **If this and the
> repo ever conflict, the repo wins** — changes flow back through the design loop, not by
> editing one copy in isolation.

---

## 1. Name & identity
- The product is **Halve**. **Never "Parity."** (Parity was the old name — dropped because
  it was domain-unavailable, trademark-weak, and dry.)
- The name comes from the core mechanic: each symbol fills **exactly half** the grid.
- Domain is **`halve.today`** — **not** `halve.app`, not `halve.com`.
- Positioning: a **premium, calm, considered** daily logic puzzle. The bar is **Things /
  Linear**, never a dashboard or component-library demo. Wordle's daily ritual, design-led.

## 2. The puzzle (so design understands the product)
A **6×6 binary Latin-square** puzzle. Two symbols. Three rules: **adjacency** (no more than
two of the same symbol may touch), **balance** (each row & column is half one symbol, half
the other), and **edge signs** (`=` neighbours match, `≠` they differ). Every puzzle has a
**single solution reachable by pure deduction — no guessing.** The 6×6 grid is the hero of
every game screen.

## 3. Symbols & master mark  ← most-often-gotten-wrong
- The board pieces are **two hollow rings**: a **broad amber ring** (symbol A) and a
  **finer teal ring** (symbol B). Both have transparent centres and the same outer size;
  different band widths preserve shape recognition without relying on colour alone.
- **They are NOT "fire" and "water," NOT teardrops, NOT elemental, NOT emoji.** That
  language is dead. (Dropped because fire/water carried fantasy-game baggage and was
  trade-dress-adjacent to LinkedIn Tango's sun/moon.) Refer to them as **amber ring / teal
  ring** or **symbol A / symbol B**.
- Exact vectors (`0 0 100 100`):
  - **A:** amber stroke, centreline radius 32, stroke width 20 — broad band, smaller aperture.
  - **B:** teal stroke, centreline radius 35.75, stroke width 12.5 — finer band, larger aperture.
- **Website master mark:** two complementary hollow half-rings form one complete circle —
  left half amber, right half teal, open centre. A short hairline separates the halves only
  where the ring material meets; the hole stays transparent and shows the theme surface.
  Logo = mark + wordmark "Halve".

## 4. Voice & copy
- **Quiet, warm, self-assured** — a calm host, never a hype-man. Short sentences. Trusts the
  player; explains a rule once, then gets out of the way.
- **Sentence case everywhere** (buttons, headings, labels). Only uppercase is the small
  tracked **eyebrow label** (e.g. `CURRENT STREAK`).
- **No emoji. Anywhere.** Not in UI, not in share text. The two rings + ✓/✗ do all iconic
  work. (So a share reads `Halve No. 142 · 2:47 · streak 41` — **never** `🔥 8-day streak`.)
- **Tabular numerals** for any number that changes (timer, streak, stats). Times are `m:ss`
  (`2:47`). Use `·` (middle dot) to separate metadata, `—` for a calm aside.
- No exclamation marks except genuine, rare celebration. **Tone words:** calm, deductive,
  daily, quiet, clear, satisfying. **Never:** crush, level up, unlock, addictive, gamechanger.

## 5. Colour
- Neutrals are **warm, never cold grey**. **Light/dark duality is the signature device** —
  warm **"paper"** (`#F6F1E8`) and deep **"ink"** (`#14110B`), both first-class.
- **Exactly one accent: amber** (`#B03E12` paper / `#E86B38` ink). **Teal is the secondary
  symbol colour, NOT a UI accent.** Feedback colours (green correct, warm-red wrong) appear
  **only for correctness** and stay distinct from the symbol colours.
- Backgrounds are **flat warm solids**. Depth = subtle surface lightening + soft warm shadow
  (paper) or hairline borders + surface lightening (ink). **Tokens are canonical** —
  `packages/design/styles/tokens.css`; never invent or hardcode hexes.

## 6. Type
- **One typeface: Space Grotesk** (300–700). **No second typeface. No Inter.** Display/
  headings at **500**, tracking `-0.02em`. Body 400/500; emphasis 600.

## 7. Spacing & radii
- **8-point spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80. Generous — screens
  breathe; the board gets the most air.
- **Radii:** sm 6 · md 10 · **cell 12** · lg 16 · xl 22 · full (pills).

## 8. Motion
- **Calm and quick:** fades + small position shifts, ~160–220ms, easing
  `cubic-bezier(0.4,0,0.2,1)`. **No bounces, springs, parallax, or looping ambient motion**
  — one allowed exception: a gentle scale-in "settle" on the win state.

## 9. Icons
- UI icons: **Lucide**, even ~1.75px stroke, 20–22px, secondary-fg colour — used only where
  unavoidable (undo, hint, share, settings, chevrons, close, stats, a streak flame-as-line-
  glyph — **the line glyph, never the 🔥 emoji**). The paired rings are the only illustration.
- `=` / `≠` are **typographic glyphs** in a small bg-filled capsule on cell edges — not icons.

## 10. Hard no's (anti-AI-aesthetic guardrails)
No purple/blue gradients · no glassmorphism · no everything-centered layouts · no default
Inter · no generic card grids · **no emoji as iconography** · no images/textures/patterns ·
no neon glows. Commit to the **one signature element** (the light/dark duality) and restraint.

---

## 11. Known corrections (fix on sight)
Things that have already drifted — Claude Design should correct these wherever they appear:

| Wrong (legacy) | Correct |
|---|---|
| "Parity" | **Halve** |
| "fire" / "water" / teardrops / elemental | **broad amber ring** / **finer teal ring** (abstract A / B) |
| `halve.app` (in current prototype share text) | **`halve.today`** |
| `🔥 8-day streak` (emoji in share text) | **`streak 8`** / `8-day streak` — no emoji |
| `--fire-*` / `--water-*` / `--symbol-fire` tokens | `--amber-*` / `--teal-*` / `--symbol-a/b` |
