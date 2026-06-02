# Mobile QA Log

Automated QA run against the Halve Android app on `emulator-5554` via ADB.
Each run records the date, pass rate, and findings.

---

## Run: 2026-06-02 — Phase 19 build (feat/mobile-app)

**Method:** Workflow-driven ADB automation — 10 sequential agents, each owning one screen section, taking screenshots + UI dumps, tapping through checklists.
**Result: 76/103 checks passed (74%)**
Pass: 76 · Fail: 10 · Skip: 5 · Blocked: 22 (auth crash)

### Fixed during run

| Issue | File | Fix |
|---|---|---|
| Notification crash on launch (`exact_alarms_not_permitted`) | `lib/data/notification_service.dart` | `scheduleDaily()` now tries `exactAllowWhileIdle`, catches `PlatformException`, falls back to `inexactAllowWhileIdle`. Blocked all 31 auth-gated checks before fix. |

### Open bugs

| # | Priority | Issue | File(s) |
|---|---|---|---|
| M-1 | High | Archive previous-month nav broken — `<` chevron always disabled, 150+ past puzzles unreachable | `archive_screen.dart`, `archive_provider.dart` |
| M-2 | Medium | No date or puzzle number shown on play board header (daily or archive) | Board screen / `PlayScreen` |
| M-3 | Medium | Archive missing pull-to-refresh (`RefreshIndicator`) — Home has it, Archive doesn't | `archive_screen.dart` |
| M-4 | Low | No help/feedback link in Settings ABOUT section | Settings screen |
| M-5 | Low | Android back gesture exits app immediately from Home — no "press back again to exit" toast | App root / `main.dart` or shell |

### Needs manual re-test (auth-gated — blocked by crash during run)

Once the notification fix is confirmed on a fresh install:
- Auth screen (email input, magic link, dev password sign-in)
- Authenticated Home (streak badge, solved-state confirmation)
- Authenticated Stats (real streak, histogram, heatmap)
- Authenticated Settings (display name, sign-out → re-sign-in)
- Win screen streak display (complete today's daily while signed in)
