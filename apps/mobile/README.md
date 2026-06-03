# Halve — mobile

Flutter app (iOS + Android) for [Halve](https://halve.today) — a premium daily 6×6 binary logic puzzle.

## Running locally

1. Copy the example env file and fill in your Supabase credentials:
   ```bash
   cp env.json.example env.json
   # edit env.json with your SUPABASE_URL and SUPABASE_ANON_KEY
   ```

2. Run on a connected device or simulator:
   ```bash
   flutter run --dart-define-from-file env.json
   ```

The `--dart-define-from-file env.json` flag is required. The app will not compile without it — `env.json` is gitignored and must never be committed.

## Further reading

- [ANDROID-RELEASE.md](ANDROID-RELEASE.md) — signing, Play Store submission, exact-alarm permission rationale
- [IOS-RELEASE.md](IOS-RELEASE.md) — provisioning, App Store submission
- [AUTH-DEEPLINK-SETUP.md](AUTH-DEEPLINK-SETUP.md) — Supabase magic-link deep-link configuration (`halve://` scheme)
- [STORE-LISTING.md](STORE-LISTING.md) — store copy and screenshots guide
