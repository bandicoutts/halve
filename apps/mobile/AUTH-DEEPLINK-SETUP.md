# Mobile Magic-Link Auth — Deep-Link Setup

> **Status:** Documentation placeholder ahead of the Flutter scaffold (Phase 4 / 14). No code here yet.
> **Scope:** What must be configured for Supabase magic-link (OTP email) auth to complete inside the Flutter mobile app via a deep link. No changes have been made by this note.

## How web works today (reference)

The web flow is the model to mirror:

- `apps/web/src/components/screens/AuthScreen.tsx` calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: \`${window.location.origin}/auth/callback\` } })`.
- The magic link in the email points back at `/auth/callback`, handled in `apps/web/src/proxy.ts` (the auth proxy middleware, **not** a route file), which calls `exchangeCodeForSession(code)` and then redirects to a whitelisted in-app `next` path.
- Supabase only honours the `emailRedirectTo` value if it **exactly matches** an entry in the Auth redirect allow-list.

Mobile differs in one key way: there is no `/auth/callback` route to host. The link opens the **app** via a deep link, and the app exchanges the code in-process. The web `proxy.ts` callback handler is web-only and needs no change.

## 1. Deep-link scheme decision

Two viable redirect targets. Recommendation: ship the custom scheme first, add universal/App Links before public launch.

### Recommended for scaffold: custom URL scheme
```
halve://auth-callback
```
- Fastest to wire up; works without server-side verification files.
- Downside: any app can claim a custom scheme, so it is not as secure/seamless as universal links. Fine for early Phase 4 development.

### Production-grade: universal links (iOS) / App Links (Android)
```
https://halve.today/auth-callback
```
- HTTPS links that the OS routes directly to the app (no "open in app?" disambiguation, no scheme spoofing).
- Requires hosting association files on `halve.today` (see iOS/Android sections).
- Recommended for the production build. The same path can also fall back to a web page if the app is not installed.

You can register **both** in the Supabase allow-list and have the Flutter client choose which `redirectTo` to send.

## 2. Supabase Auth redirect allow-list (the gating config)

Supabase will silently refuse to redirect to any URL not on the allow-list. Add the mobile target(s) in **both** places that apply:

### a. Local / CLI-managed config — `supabase/config.toml`, `[auth]` block

Current values are local-dev placeholders:
```toml
[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["https://127.0.0.1:3000"]
```

`site_url` stays the **primary web origin**; all other clients go in `additional_redirect_urls`. For production this list needs the real web origin plus the mobile target(s):
```toml
additional_redirect_urls = [
  "https://halve.today",
  "https://halve.today/auth-callback",   # universal/App Link
  "halve://auth-callback",               # custom scheme
  "halve://auth-callback/*"              # wildcard if a path/query is appended
]
```
Supabase matches entries as **exact URLs**, but its matcher also supports trailing wildcard globs (e.g. `halve://auth-callback/*`) when a path or query string is appended to the redirect.

### b. Hosted dashboard (authoritative for production)

`config.toml` only governs local/CLI-managed config. If Auth redirect URLs are managed in the hosted project, add the **same entries** there:

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs** → add `halve://auth-callback` (and/or `https://halve.today/auth-callback`). Set the production **Site URL** to `https://halve.today` while you are there.

## 3. Flutter client (`supabase_flutter`)

The mobile client passes its own deep-link as `emailRedirectTo`; it must match an allow-list entry exactly.

```dart
await supabase.auth.signInWithOtp(
  email: email,
  emailRedirectTo: 'halve://auth-callback', // or 'https://halve.today/auth-callback'
);
```

`supabase_flutter` listens for the incoming deep link and completes the session automatically (it processes the auth tokens/code on `app_links`/`uni_links` callback). No manual `exchangeCodeForSession` is normally required when using `supabase_flutter`'s built-in deep-link handling — just ensure `Supabase.initialize(...)` has run and the OS routes the link to the app (sections 4–5).

> Reminder (global rule): `signOut` on mobile must use `scope: SignOutScope.local` so we don't revoke sessions on the user's other devices.

## 4. iOS wiring

### Custom scheme — `ios/Runner/Info.plist`
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>today.halve.auth</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>halve</string>
    </array>
  </dict>
</array>
```

### Universal links (production)
1. Add the **Associated Domains** capability in Xcode: `applinks:halve.today`.
2. Host an Apple App Site Association file at `https://halve.today/.well-known/apple-app-site-association` (served as JSON, no extension, `Content-Type: application/json`):
   ```json
   {
     "applinks": {
       "details": [
         { "appID": "<TEAMID>.today.halve.app", "paths": ["/auth-callback", "/auth-callback/*"] }
       ]
     }
   }
   ```

## 5. Android wiring

### Custom scheme / App Links — `android/app/src/main/AndroidManifest.xml`
Add an intent-filter to the main `<activity>`:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <!-- Custom scheme -->
  <data android:scheme="halve" android:host="auth-callback" />
  <!-- App Link (production) -->
  <data android:scheme="https" android:host="halve.today" android:pathPrefix="/auth-callback" />
</intent-filter>
```

### App Links verification (production)
Host a Digital Asset Links file at `https://halve.today/.well-known/assetlinks.json`:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "today.halve.app",
      "sha256_cert_fingerprints": ["<APP SIGNING SHA-256>"]
    }
  }
]
```
`android:autoVerify="true"` plus this file lets Android route `https://halve.today/auth-callback` straight to the app without the chooser dialog.

## Checklist (Phase 4)

- [ ] Decide scheme: custom `halve://auth-callback` for scaffold; add `https://halve.today/auth-callback` universal/App Links before launch.
- [ ] Add mobile redirect URL(s) to `additional_redirect_urls` in `supabase/config.toml`.
- [ ] Add the same URL(s) in Dashboard → Authentication → URL Configuration → Redirect URLs; set production Site URL to `https://halve.today`.
- [ ] Flutter: pass `emailRedirectTo` matching an allow-list entry; rely on `supabase_flutter` deep-link handling; `signOut` uses `scope: local`.
- [ ] iOS: `CFBundleURLTypes` (custom scheme) and/or Associated Domains + `apple-app-site-association` (universal links).
- [ ] Android: `intent-filter` (custom scheme / App Links) and/or `assetlinks.json` + `autoVerify` (App Links).
