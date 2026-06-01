# Halve mobile — open decisions

> The message bus going **out**. Each item is a product/design call that gates new
> surfaces. Resolve here → it moves to `BRIEF.md §4 Locked`. Items tagged **[research]**
> are where best-practice input would sharpen the choice before you commit.
>
> These are mostly **product-stance** calls (yours), not visual ones — Claude Design can't
> decide them, it can only render what you decide. That's why they live with Code.

---

## D1 — Notifications / daily reminder ✅ **[researched — recommendation ready]**

Research digest: [`research/2026-06_notifications.md`](research/2026-06_notifications.md).
The evidence converges on a single restrained design — the only real fork left is whether
to ship a streak-at-risk nudge at all.

**Recommended spec (research-backed):**
- **One quiet daily reminder**, user-set time with a sensible default, tied to the puzzle
  drop. Design for low opt-in (esp. iOS ~40–56%); never gate core value behind it.
- **iOS:** use **provisional** notifications — no upfront prompt, arrive silently in
  Notification Center. Strong fit for the calm brand.
- **Android:** **separate channels** — "Daily puzzle" vs (optional) "Streak reminders" —
  so either can be muted independently.
- **Permission:** never at launch/splash/onboarding. **Push primer after first solve**,
  value-forward ("a gentle reminder when your next puzzle is ready").
- **Copy:** neutral and factual; zero Duolingo-style guilt/threat/FOMO/confirmshaming.

**The one open fork — streak-at-risk reminder:**
- **B1. Omit it v1.** Single calm daily reminder only. Most on-brand; lowest risk.
  _(My lean — matches the anti-dark-pattern stance.)_
- **B2. Narrow, opt-in streak nudge.** Established streaks only, separate channel, gentle
  copy, off by default. Evidence supports prevention-for-high-streaks, but adds nag risk.

**Why it matters:** confirms the permission-priming moment + Settings toggles to design now.

## D2 — Account & cross-device sync

Streaks/stats are derived from the `solves` table server-side. On mobile we must decide
the identity model.

- **A. Local-only v1.** No sign-in; data on-device. Fastest to ship; loses streak on
  reinstall / no cross-device.
- **B. Optional account.** Play immediately as guest; offer sign-in to sync + back up.
  Matches the web model and the engine's server-derived stats. _(My lean.)_
- **C. Account required.** Highest friction at the worst moment (first play). Off-brand.

**Why it matters:** gates whether we design Auth + an account section in Settings, and
whether onboarding mentions sign-in at all.

## D3 — Offline scope

Native users play on transit. Web wireframes never surface this.

- **A. Online-only.** Simplest; a dead spot kills today's play.
- **B. Cache today + recent.** Today's puzzle (and a few archive days) prefetched so play
  works offline; sync on reconnect. _(My lean — table-stakes for a daily app.)_
- **C. Full offline archive.** Prefetch everything. Overkill for v1.

**Why it matters:** affects loading/empty/offline states we'd design, and the data layer
in `apps/mobile`.

## D4 — Settings: scope for v1

No Settings screen exists. Minimum it must hold once D1–D3 land.

- Likely set: **appearance override** (D2-independent), **notifications** (D1), **haptics
  on/off**, **account / restore purchases** (D2), about/legal.
- **Decision:** confirm the v1 list so Claude Design can lay out one screen, not five.

## D5 — Onboarding / how-to-play ⚠️ **[research failed — needs a different method]**

Today it's a plain text link on the play screen — under-powered for app. The web-search
pass found **no verifiable evidence** (all NYT/LinkedIn teaching-pattern claims were
refuted) — how those apps teach in-play is a *teardown-by-observation* question, not a
searchable one. Two ways forward:

- **A. Proceed on design judgment.** Lock the direction (interactive in-grid tutorial,
  constraints taught incrementally, ✓/✗ example states, skippable + replayable from
  Settings) and let Claude Design prototype it; we critique against the real artifact.
  _(My lean — onboarding is a design-craft call, not a fact-finding one.)_
- **B. Hands-on competitor teardown first.** I (or you) play the first-runs of LinkedIn
  Queens/Tango + NYT Connections and document the actual patterns before designing.

**Why it matters:** first-run is where activation is won or lost. **Recommendation:** don't
burn another broad search pass — pick A or B.

---

## Recommended next step

Two of these (**D1 notifications**, **D5 onboarding**) are genuinely sharper with
best-practice research; the rest are stance calls you can make now. Suggested order:

1. Run a focused **deep-research** pass on D1 + D5.
2. You decide D2 / D3 / D4 (stance calls).
3. I fold all five into `BRIEF.md §4`, then write the **out-brief** for Claude Design to
   design the missing surfaces (Onboarding, Settings, notification priming, offline/empty
   states) — in small batches, each critiqued before the next.
