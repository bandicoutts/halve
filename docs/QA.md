# Mobile QA Log

Automated QA run against the Halve Android app on `emulator-5554` via ADB.
Each run records the date, pass rate, and findings.

---

## Run: 2026-06-02 (re-run) — after notification + archive fixes

**Method:** Workflow-driven ADB automation — 10 sequential agents, each owning one screen section, taking screenshots + UI dumps, tapping through checklists. App built with `flutter run --dart-define-from-file env.json` to embed Supabase credentials.
**Result: 77/85 checks passed (90.6%)**
Pass: 77 · Fail: 8 · Skip: 4

### Fixed since initial run

| # | Issue | Commit |
|---|---|---|
| M-1 | Archive previous-month chevron always disabled | `2bff3dc` |
| M-3 | Archive missing pull-to-refresh | `2bff3dc` |
| (crash) | Notification scheduling crash on launch (`exact_alarms_not_permitted`) | `302037d` |

### Open bugs

| # | Priority | Issue | File(s) |
|---|---|---|---|
| ~~M-2~~ | ~~Medium~~ | ~~No date or puzzle number shown on play board header (daily or archive)~~ | Fixed — see below |
| M-4 | Low | No help/feedback link in Settings ABOUT section | `settings_screen.dart` |
| M-5 | Low | Android back gesture exits app immediately from Home — no "press back again to exit" toast | App root / `main.dart` or shell |

### New bugs found (re-run)

| # | Priority | Issue | File(s) |
|---|---|---|---|
| NEW-1 | Low | Auth screen is magic-link only — no "use password instead" toggle in production; debug-only dev sign-in is not a real fallback | `auth_screen.dart` |
| NEW-2 | Low | Settings account row (email/display name) is read-only — no way to edit display name from within the app | `settings_screen.dart` |
| NEW-3 | Low | Notification permission never requested before showing the reminder toggle — first-time toggle may silently fail | `settings_screen.dart` |
| NEW-4 | Low | Stats screen has no difficulty breakdown (Easy/Medium/Hard solve counts) | `stats_screen.dart` |
| NEW-5 | Low | Sign-out happens immediately with no confirmation dialog — easy to trigger by accident | `settings_screen.dart` |

### Notes from re-run

- **Win screen streak** — streak intentionally suppressed for archive plays (`showStreakMeta = kind == PlayKind.daily`). Not a bug.
- **Notification toggle** — could not fully test in emulator as OS permission was not granted. Needs device test.
- **Auth** — no "Use password instead" toggle in production; dev login via `kDebugMode`-gated button works for test purposes only.

---

## Run: 2026-06-02 (initial) — Phase 19 build (feat/mobile-app)

**Method:** Workflow-driven ADB automation — 10 sequential agents, each owning one screen section, taking screenshots + UI dumps, tapping through checklists.
**Result: 76/103 checks passed (74%)**
Pass: 76 · Fail: 10 · Skip: 5 · Blocked: 22 (auth crash)

### Fixed during initial run

| Issue | File | Fix |
|---|---|---|
| Notification crash on launch (`exact_alarms_not_permitted`) | `lib/data/notification_service.dart` | `scheduleDaily()` now tries `exactAllowWhileIdle`, catches `PlatformException`, falls back to `inexactAllowWhileIdle`. Blocked all 31 auth-gated checks before fix. |

### Open bugs (initial run — see re-run above for current status)

| # | Priority | Issue | File(s) |
|---|---|---|---|
| ~~M-1~~ | ~~High~~ | ~~Archive previous-month nav broken — `<` chevron always disabled~~ | Fixed `2bff3dc` |
| ~~M-2~~ | ~~Medium~~ | ~~No date or puzzle number shown on play board header~~ | Fixed — `PlayLoad.puzzleNumber` + `formatShortDate` |
| ~~M-3~~ | ~~Medium~~ | ~~Archive missing pull-to-refresh~~ | Fixed `2bff3dc` |
| M-4 | Low | No help/feedback link in Settings ABOUT section | Settings screen |
| M-5 | Low | Android back gesture exits app immediately from Home | App root / `main.dart` |
