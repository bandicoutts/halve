# iOS Release Checklist

Steps to sign, build, and submit Halve to the App Store.

---

## One-time setup

### 1. Apple Developer account

- Enrol at developer.apple.com (requires the $99/year Apple Developer Program).
- Create an **App ID**: Identifiers → App IDs → (+) → `today.halve`, enable **Push Notifications**.

### 2. Add PrivacyInfo.xcprivacy to the Xcode project

The file `ios/Runner/PrivacyInfo.xcprivacy` is on disk but not yet wired into the Xcode project. Required for App Store submission on iOS 17+.

1. Open `ios/Runner.xcworkspace` in Xcode.
2. In the Project Navigator, right-click the **Runner** folder (not the project root) → Add Files to "Runner".
3. Select `Runner/PrivacyInfo.xcprivacy`, ensure **Target Membership: Runner** is checked.
4. Confirm the file appears under the Runner group.

### 3. Provisioning & signing

Xcode uses automatic signing (`CODE_SIGN_STYLE = Automatic`). To activate it:

1. Open `ios/Runner.xcworkspace`.
2. Select the **Runner** target → Signing & Capabilities.
3. Set **Team** to your Apple Developer team.
4. Xcode will create/download a provisioning profile automatically.

For App Store distribution, switch the scheme to **Archive**; Xcode uses a distribution profile automatically.

### 4. APNs key

Push notifications require an APNs key in Firebase Console (see `FIREBASE-SETUP.md`). The `aps-environment` entitlement in `Runner/Runner.entitlements` is already set to `development`. Change it to `production` before the App Store build:

```xml
<key>aps-environment</key>
<string>production</string>
```

---

## Building

### TestFlight (beta)

```bash
cd apps/mobile
flutter build ios --release
# Then in Xcode: Product → Archive → Distribute App → App Store Connect → Upload
```

Or entirely from Xcode: Product → Archive.

### App Store (release)

Same as TestFlight — the upload destination in the Xcode Organizer determines beta vs live.

---

## App Store Connect

1. Create a new app at [appstoreconnect.apple.com](https://appstoreconnect.apple.com):
   - Bundle ID: `today.halve`
   - SKU: `halve`
   - Primary language: English (U.S.)
2. Fill in the listing from `STORE-LISTING.md`.
3. Upload screenshots (phone + iPad, both themes) — see caption guidance in `STORE-LISTING.md`.
4. Set Privacy Policy URL: `https://halve.today/privacy`
5. Complete the **App Privacy** form (Data linked to identity: Email Address, Gameplay Content).
6. Submit for review.

---

## App icon requirements

The app icons in `ios/Runner/Assets.xcassets/AppIcon.appiconset/` are currently the Flutter placeholder. Replace all PNGs with the Halve mark (split circle, amber + teal on `#F6F1E8` background) at the required sizes. The 1024×1024 slot (`Icon-App-1024x1024@1x.png`) is used as the App Store marketing icon.

Use the `scripts/generate-icons.sh` helper (when available) or a tool like [appicon.co](https://www.appicon.co) with the source artwork.

---

## Version bumping

Version is set in `pubspec.yaml`:
```yaml
version: 1.0.0+1
#         ↑     ↑
#      CFBundleShortVersionString
#               CFBundleVersion (build number)
```

Increment the build number (`+2`, `+3`, …) for every upload to TestFlight/App Store. The version name (`1.0.0`) is shown to users.
