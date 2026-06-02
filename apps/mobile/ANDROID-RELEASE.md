# Android Release Checklist

Steps to sign, build, and submit Halve to the Google Play Store.

---

## One-time setup

### 1. Create a keystore

```bash
keytool -genkey -v \
  -keystore ~/halve-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias halve
```

Store the `.jks` file somewhere safe outside the repo. **Never commit it.**

### 2. Create `android/key.properties`

This file is gitignored (`android/.gitignore` already excludes it).

```
storePassword=<your-keystore-password>
keyPassword=<your-key-password>
keyAlias=halve
storeFile=/Users/<you>/halve-release.jks
```

`build.gradle.kts` reads this file automatically. If it is absent the build falls back to the debug keystore (for local testing only).

### 3. Play App Signing

Google Play re-signs release builds with a Google-managed key (Play App Signing). This is the recommended approach:

1. Create a new app in [Play Console](https://play.google.com/console):
   - Package name: `today.halve`
2. On first upload, Play Console will prompt you to opt in to Play App Signing. Accept.
3. Google stores the final signing key; your upload key (the one from `key.properties`) is used only for upload verification.

---

## Building a release App Bundle

```bash
cd apps/mobile
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

Upload `app-release.aab` to Play Console → Production (or Internal Testing first).

---

## Play Console listing

1. Fill in the listing from `STORE-LISTING.md`.
2. Upload screenshots (phone + 7-inch tablet + 10-inch tablet, both themes).
3. Set Privacy Policy URL: `https://halve.today/privacy`
4. Complete the **Data Safety** form:
   - **Email address**: Collected, linked to identity, required — App functionality (authentication).
   - **App activity / Gameplay content**: Collected, linked to identity — App functionality (puzzle solves, streaks).
   - No data shared with third parties for advertising or tracking.
5. Submit to **Internal testing** first, then promote to Production.

---

## App icon

The adaptive icon is defined in:
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (vector, Android 8.0+)
- `android/app/src/main/res/mipmap-*/ic_launcher.png` — legacy PNG icons for older Android versions

Replace the legacy PNGs (`mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi`) with the Halve mark rasterized at the appropriate densities. The adaptive icon foreground (split circle) is in `drawable/ic_launcher_foreground.xml` and will render correctly on Android 8.0+ without PNG replacements.

| Density  | Size    |
|----------|---------|
| mdpi     | 48×48   |
| hdpi     | 72×72   |
| xhdpi    | 96×96   |
| xxhdpi   | 144×144 |
| xxxhdpi  | 192×192 |

---

## Version bumping

Version is set in `pubspec.yaml`:
```yaml
version: 1.0.0+1
#         ↑     ↑
#      versionName
#               versionCode (must increment on every Play Store upload)
```

Flutter maps `pubspec` version to `versionName` and build number to `versionCode` automatically.
