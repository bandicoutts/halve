# Halve mobile — design brief & contract

> Read this first, every round. It records what we've **locked**, the **native rules**
> the mobile design must hold, and the **status of every surface**. Tokens, voice, and
> brand foundations are inherited from `../handoff/README.md` and
> `../styles/tokens.css` — not restated here.

_Last updated: round 1 (initial prototype review)._

---

## 1. Brand correction (carry into Claude Design)

The web handoff bundle still describes the two symbols as **fire / water teardrops** and
names them `Fire`/`Water` in code. The real brand — per `CLAUDE.md` and this prototype —
is a **solid circle (disc) and a ring (open circle)**. The rendered marks are already
correct; the *naming and the prose* have drifted.

- **Lock:** symbols are **solid disc** (`--symbol-a`, amber) and **ring** (`--symbol-b`,
  teal). Refer to them as disc / ring, never fire / water.
- **Action for Design:** rename `Fire`→`Disc`, `Water`→`Ring` in any new artifacts; stop
  using teardrop language.

---

## 2. Device coverage convention

Every prototype batch shows **at minimum 2 device sizes**: one phone and one tablet. The
eventual target is all 4 combinations (iOS phone, iOS tablet, Android phone, Android
tablet), but to keep early rounds lean, start with **one of each size** before splitting
by platform. Once layouts are stable, add the second platform per size.

Default starting pair: **iOS phone + iPad** (the most common review targets). Add Android
phone + Android tablet in the round that finalises layouts.

## 3. Native rules (the app-vs-web guardrails)

These turn the web-isms found in round 1 into positive rules. Every mobile screen holds
them:

1. **Press, not hover.** Touch has no hover. Interactive feedback is the *pressed* state
   (scale `0.97` button / `0.94`/`0.96` cell) + the pressed/active skin. Do **not** drive
   color or elevation changes off `:hover` — they stick after tap on touch.
2. **Theme follows the OS.** Default to system light/dark. No persistent theme toggle in
   the screen chrome; any manual override lives in Settings, not the top bar.
3. **The board owns the play screen.** Nav auto-hides during play; the play header is only
   back + difficulty. Nothing competes with the grid. _(Already done — keep it.)_
4. **Native chrome per platform.** iOS = bare labelled tab icons + iOS share sheet;
   Android = M3 accent-pill active tab + M3 bottom sheet. _(Already done — keep it.)_
5. **Tap targets ≥ 44pt (iOS) / 48dp (Android).** Applies especially to the Archive
   calendar day cells, which are currently under-size.
6. **Default nav = anchored bottom tab bar.** The floating-pill variant is a web/Dribbble
   flourish — retire it as a shippable option.
7. **Bottom sheets, not centered modals**, for confirms/actions. _(Already done — keep.)_
8. **Spoiler-free share** — brand mark + meta, never the solved grid. _(Already done.)_
9. **Reduced-motion + safe-area aware.** _(Already handled in the prototype.)_

---

## 4. Surface inventory & status

| Surface | Status | Notes |
|---|---|---|
| Home (Today) | ✅ Designed | Strong. Streak band, meta, CTA, Keep-playing cards. |
| Play board | ✅ Designed | Strong. Timer, board, Undo/Hint, error shake. |
| Win keepsake | ✅ Designed | Strong. Time, keepsake card, share/stats, next-puzzle countdown. |
| Share sheet | ✅ Designed | Per-platform native sheets, spoiler-free payload. |
| Archive | ⚠️ Fix | Calendar grid good; day-cell tap targets too small (rule 5). |
| Stats | ✅ Designed | Compact tiles + 7-day bar; fine for v1. |
| Practice | 🟡 Stub | Card exists; difficulty-picker flow not designed. |
| Onboarding / how-to-play | 📋 Spec'd → design | D5 locked: interactive in-grid tutorial, incremental. **Batch 1.** |
| Notification priming | 📋 Spec'd → design | D1 locked: primer after first solve. **Batch 1** (part of first-run). |
| Settings | 📋 Spec'd → design | D4 list locked (5 items). **Batch 2.** |
| Empty / loading / offline | 📋 Spec'd → design | D3 locked: cache today+recent. **Batch 2.** |
| Auth / account | 📋 Spec'd → design | D2 locked: optional account (guest → sign-in). **Batch 2.** |

Legend: ✅ done · ⚠️ needs targeted fix · 🟡 partial · 📋 decision locked, awaiting design · ❌ not yet designed.

---

## 5. Locked decisions

_Resolved 2026-06-01 (round 1). D1 backed by `research/2026-06_notifications.md`._

- **D1 — Notifications.** One **quiet daily reminder** only; **no streak-at-risk nudge in
  v1**. iOS = **provisional** (silent, no upfront prompt). Android = own channel ("Daily
  puzzle"). Permission via a **value-forward primer after the first solve**, never at
  launch/onboarding. User-set reminder time, sensible default. Copy is neutral/factual —
  zero guilt/threat/FOMO. Design for low opt-in; never gate core value behind it.
- **D2 — Account.** **Optional account.** Play immediately as guest; offer sign-in to sync
  streak/stats + back up. Streak survives reinstall once signed in.
- **D3 — Offline.** **Cache today + recent.** Today's puzzle and a few archive days
  prefetched for offline play; sync on reconnect.
- **D4 — Settings (v1 list).** Assembled from the above:
  1. **Appearance** — System / Light / Dark (this is the *only* home for the theme
     override, since the header toggle is removed per native rule 2).
  2. **Daily reminder** — on/off + time picker (single channel; no streak toggle in v1).
  3. **Haptics** — on/off.
  4. **Account** — signed-out: "Sign in to sync"; signed-in: email + sync status + sign
     out (`{ scope: 'local' }`).
  5. **About** — version, privacy, terms. _(Restore-purchases deferred until monetisation
     is decided — not assumed.)_
- **D5 — Onboarding.** **Interactive in-grid tutorial**, decided on design judgment (web
  research failed). Constraints taught **incrementally** (adjacency → balance → `=`/`≠`
  edges), ✓/✗ example states, **skippable** and **replayable from Settings**. Claude Design
  prototypes; we critique the artifact.

---

## 6. Round log

- **Round 1** — Vendored initial mobile prototype (Home / Play / Win / Share, 2 themes,
  iOS + Android, 3 nav variants). Reviewed; native rules + open decisions seeded above.
  D1 researched; D1–D5 all resolved (see §4). `OUT-BRIEF.md` written for round 2 (batch 1:
  first-run flow). Next inbound expected: Claude Design's onboarding + primer prototype.
