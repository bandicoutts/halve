# Phase 3 — design brief (the screens the prototype never covered)

Phases 1–2 re-skinned the daily loop + Practice/Archive/Stats from `Halve.dc.html`.
Phase 3 is the connective tissue that prototype never drew. **Design these in the
SAME Claude Design project as `Halve.dc.html`** so they inherit the established system:

- **Type:** Newsreader (italic serif display), Instrument Sans (body/UI), Spline Sans Mono (kickers/labels).
- **Palette:** ink (dark) + paper (light); amber `#E8703A`/`#DE5F27` = accent **and** disc; teal `#45BFB2`/`#1E9C8F` = ring.
- **Shared chrome:** the header (wordmark + mono `PRACTICE / ARCHIVE / STATS` + rotating split-circle theme toggle). Auth/onboarding currently use a *minimal* header (wordmark only) — keep that, or propose better.
- **Primitives already built (reuse, don't reinvent):** disc/ring symbols, `=`/`≠` edge caps, given plates, amber pill buttons, mono ghost links, mono kickers, the two-column editorial rhythm.
- Give **both ink and paper** for anything non-trivial.

Each screen below lists its **states** and the **behaviour/data that must be preserved** — please keep those; restyle freely around them.

---

## 1. Auth / Sign in — `/auth`
Passwordless **magic-link** sign-in (email only, no password).
- **State A — email entry:** email input + primary "Send link"/"Continue"; footer ghost links **"Play now, sign in later"** (must stay — guests can play).
- **State B — link sent:** confirmation ("Check your email.") showing the entered email; footer "Use a different email" / "Play now, sign in later".
- **State C — expired/invalid link:** an error callout above the form.
- Consider an editorial split (form left, brand/mark right) on desktop; single centered column on mobile.

## 2. Onboarding — `/onboarding`
First-run after sign-in: capture a **display name** (shown on Stats, max 40 chars).
- Heading "What should we call you?", one text input, primary "Save name", a **skip** affordance.
- States: default · saving · error ("Enter a name…").

## 3. Tutorial / How it works — `/tutorial`  ← the important one
An interactive lesson in **4 beats**, ending in a hands-on solve. No prototype reference exists; this is where design choreography matters most.
- **Beat 1 — "Two symbols":** disc vs ring.
- **Beat 2 — "Read the signs":** the `=` / `≠` edge constraints.
- **Beat 3 — "The line law":** each row/column ends 3 discs + 3 rings; never 3 of a symbol in a row.
- **Beat 4 — worked example → "Try one yourself":** a small **4×4** teach board the player actually solves, with per-step cell/edge **highlighting** and hints, finishing on "Solved — nicely deduced."
- Needs: a **step/progress indicator**, an **illustrative mini-board per concept** (highlight specific cells/edges), and the final **interactive 4×4**. Reuse disc/ring, edge caps, plates.

## 4. Loading skeletons (per route: home · play · archive · stats · practice)
Shown while server data resolves. Each should mirror the **silhouette of its redesigned layout** (board grid skeleton, hero skeleton, calendar skeleton…) so content doesn't jump on load. A breathing-pulse token already exists.

## 5. Error / Not-found / Unavailable states
Same editorial voice (mono kicker + Newsreader headline + amber button), centered.
- **Error boundary:** "Something broke" + **Retry** + Home.
- **404 / not-found:** headline + back Home.
- **Daily unavailable:** today's puzzle failed to generate → message + **Retry**.
- **Practice unavailable:** pool empty/failed → message + back to Practice.

## 6. Account menu (header avatar dropdown)
From the header monogram: a small popover — name header ("Signed in"), **Statistics**, **Sign out**. Style to match the mono/serif header.

## 7. Already designed in code (mirror for cohesion, optional)
The **empty Archive** ("The back catalogue." + mark) and **Stats guest** ("Start your record." + faded streak) were designed from the system this session. Worth mirroring in Claude Design so the whole set is cohesive — or leave as-is.

---

### Not part of the design pass (I handle these in code regardless)
- Accessibility + `prefers-reduced-motion` pass (focus rings, board keyboard nav, contrast).
- Retiring now-dead components (`Fire`, `Water`, `EdgeSign`, `SegmentedControl`, old `TopBar`/`ThemeToggle`/`FitToViewport`/`Eyebrow` where unused).

When the designs are ready, hand them over the same way as `Halve.html` (download the `.html`/`.dc.html` and point me at it), and I'll implement Phase 3 faithfully.
