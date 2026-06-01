# Research digest — notifications (D1)

_Run: 2026-06-01 · deep-research harness · 25 sources → 111 claims → 18 verified._
_Scope: D1 (notifications) + D5 (onboarding). **D5 yielded zero surviving claims** — see
the gap note at the bottom._

## Verified findings (D1)

1. **Never ask for permission at launch / splash / onboarding.** Request in-context, after
   the user has felt value (event trigger — e.g. first solve). Raises opt-in, lowers
   denial. _High confidence; first-party Android dev + AOSP guidance._
2. **Use a pre-permission "push primer"** — an in-app message explaining the value before
   the native OS dialog fires. Frame value-forward ("a gentle reminder when your next
   puzzle is ready"), never loss-framed. _High. (Note: the specific "2–3× lift" figure was
   tested and **refuted** — priming helps, but don't quote a multiplier.)_
3. **Design for low opt-in, especially iOS** (~40–56%, materially below Android). Never
   gate core value behind notifications. _High; direction unanimous, exact % time-sensitive._
4. **iOS: prefer provisional notifications** (`.provisional`, iOS 12+). No upfront prompt;
   they arrive quietly in Notification Center — no banner, sound, or lock-screen alert.
   Engaged users self-promote to prominent delivery. **Strong fit for a calm brand.** _High;
   first-party Apple/OneSignal docs._
5. **Android: separate notification channels** (mandatory API 26+). One channel for the
   daily reminder, a *separate* one for any streak nudge, so users can mute the naggier
   channel without losing the calm one. _High; first-party Android docs._
6. **Streak-at-risk nudges pay off only for *prevention* among high-streak users**, not
   recovery of low streaks (return rate 0.9% at 2–3 days vs ~9% at 31–60 days). So *if*
   used, target established streaks only. _Medium; single-vendor (Trophy) self-reported._
7. **Avoid every Duolingo anti-pattern:** guilt/threat copy ("streak in danger!"), FOMO,
   loss-aversion visuals (skeleton mascot), confirmshaming ("really giving up now?").
   Duolingo's own VP said guilt-based notifications A/B-tested 5–8% "better" — that lift is
   exactly the dark pattern Halve's voice rejects. _High; multiple UX/ethics sources._

## What the research could NOT establish (open)

- **Optimal send time/cadence** — no claim survived (the "Friday streak-loss peak" was
  refuted). → Make it **user-set with a sensible default**, tied to the puzzle drop.
- **Positive, citable calm copy patterns** (NYT-style) — none surfaced. → Treat copy as a
  craft task following `../../handoff/README.md` voice rules.

## D5 (onboarding) — research gap

All onboarding claims were **refuted** (the LinkedIn Queens teaching-pattern claims failed
verification; the source didn't substantiate them). How NYT/LinkedIn teach multi-rule
puzzles in-play is a **teardown-by-observation** question, not a web-search one. Recommend
**not** burning another broad search pass — instead either (a) proceed on design judgment
and let Claude Design prototype an interactive in-grid tutorial we critique against the real
thing, or (b) do a hands-on competitor teardown (play Queens/Tango/Connections first-runs
and document the patterns directly).

## Sources (primary/first-party highlighted)

- Apple — provisional authorization (developer.apple.com) · **primary**
- Android — notification channels & permission (developer.android.com, source.android.com) · **primary**
- OneSignal — iOS provisional push · primary
- Braze — push primer · blog · Pushwoosh — benchmarks · blog · Plotline — opt-in · blog
- Trophy — streak reminders · vendor analytics (directional only)
- UX Mag, WebDesignerDepot, deceptive.design — Duolingo dark-pattern teardowns
