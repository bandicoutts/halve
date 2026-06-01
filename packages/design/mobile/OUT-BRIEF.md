# Out-brief → Claude Design · Round 2 · Batch 1: the first-run flow

> **Paste this whole file into Claude Design** (invoke the `parity-design` skill first).
> It's self-contained. Output a static HTML prototype in the same style as the existing
> mobile prototype, then export a zip back for vendoring.

## Context (read once)

Halve is a **premium, calm daily 6×6 logic-puzzle app** — Wordle's daily ritual, design-led
and deliberately non-gamified. Two abstract symbols: a **solid disc** (amber) and a **ring**
(teal). *(Note: older bundle text calls these "fire/water teardrops" — that's stale. They
are disc & ring.)* The mobile prototype already covers Home, Play, Win, and Share across iOS
+ Android and light/dark. This batch designs the **first-run flow** that's currently missing.

Honour the existing system: warm Paper/Ink themes, Space Grotesk, tabular numerals, 8-pt
spacing, sentence case, no emoji, calm fades (~160–220ms), the 6×6 grid as hero. **Press
states, not hover** (touch). Follow the OS theme — **no theme toggle in the chrome**.
Full brand rules in `BRAND-CANON.md`.

**Fix two drifts in the current prototype while you're in there:** the share text uses
`halve.app` (→ **`halve.today`**) and a `🔥` emoji in the streak line (→ remove it; **no
emoji** — e.g. `streak 8`).

## Design this batch (one coherent flow)

**1. Onboarding / how-to-play — interactive in-grid tutorial.**
- Teach by *doing*, inside a real (or guided) grid — not a wall of text.
- Introduce the constraints **incrementally, one at a time**, in this order:
  1. **Adjacency** — no more than two of the same symbol may touch.
  2. **Balance** — each row and column holds an equal count of each symbol (this is what
     "Halve" means).
  3. **Edges** — `=` means neighbours match, `≠` means they differ.
- Use **✓ / ✗ example states** to show right vs wrong placements as each rule lands.
- Guide the first move or two, then let the player complete a small/easy grid.
- Must be **skippable** at any point, and **replayable later from Settings**.
- Voice: calm host, second person, explain once then get out of the way (e.g. "No more than
  two of the same symbol may touch.").

**2. Notification permission primer — after the first solve.**
- Show the **value-forward primer** (a calm in-app sheet, *not* the native OS dialog) right
  **after the player completes their first puzzle**, on a high note.
- Frame the value, never loss: e.g. "A gentle reminder when tomorrow's puzzle is ready."
  Offer "Maybe later" with equal weight — no dark patterns, no guilt, no pre-checked traps.
- It explains *why*; the native OS prompt fires only if they accept.
- Design **both platforms**: iOS leans on quiet/provisional delivery (no aggressive prompt);
  Android will use a dedicated "Daily puzzle" channel. **One daily reminder only — there is
  NO streak-at-risk nudge in v1.**

## Hard constraints (do not violate)

- One daily reminder; **no streak/loss-aversion notifications**, no countdown-shaming.
- Permission primer is **post-first-solve**, never at launch or mid-onboarding.
- Theme override lives in Settings (next batch), **not** in any header.
- Keep tap targets ≥ 44pt iOS / 48dp Android.

## Deliverable

A static HTML/JSX prototype (same harness style as the current mobile prototype) showing:
the onboarding tutorial steps with ✓/✗ states, the first-solve moment, and the post-solve
notification primer — on **both iOS and Android**, in **both themes**. Export a zip.

## Not in this batch (coming in batch 2)

Settings screen (5 items, see BRIEF §4 D4), Auth/account (guest → optional sign-in),
offline/empty/loading states. Don't design these yet — just don't contradict them.
