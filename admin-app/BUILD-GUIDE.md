# Turning the admin panel into a real Android/iOS app

This mirrors what `APP-BUILD-GUIDE.md` at the repo root does for the main
storefront app — same tooling (Capacitor), kept as its own project because
this is a genuinely different app: a different appId (`com.deziremore.admin`
vs `com.deziremore.app`), a different audience (you, not customers), and no
shared build step.

## What's already done
- `www/index.html` — a copy of `dezire-backend/admin-panel.html`, with one
  change: the API base URL is the real deployed backend
  (`https://dezire-more-website-1.onrender.com/api`) instead of the relative
  `/api` path the browser-served original uses (that only works same-origin;
  there's no "origin" once this runs as a packaged app).
- `android/` — a full native Android Studio project, appId
  `com.deziremore.admin` — generated and verified.
- `ios/` — a full native Xcode project, bundle ID `com.deziremore.admin` —
  generated and verified, but **only buildable from a Mac** (Apple's own
  restriction, not something any tooling works around).
- `sync-panel.js` — re-copies `admin-panel.html` and re-applies the API-URL
  patch. Run this (`node sync-panel.js`), then `npx cap sync`, any time you
  change the admin panel and want those changes in the app.
- `resources/icon.png` / `resources/splash.png` — copied over from the main
  app's brand assets, ready for `npx capacitor-assets generate` to turn into
  real icon/splash images for both platforms. **Not run yet** — it needs
  `sharp` (image processing), and its install script kept failing in this
  environment for the same Windows/WSL-bridge reason noted below. Right now
  the app uses Capacitor's generic default icon. Run this yourself (works
  fine from a normal terminal, or from inside WSL) once, before your first
  real build:
  ```bash
  cd admin-app
  npx capacitor-assets generate --android --ios
  npx cap sync
  ```

**I could not go further than this** — generating the scaffold needs only
Node/npm, which this environment has; actually *compiling* an APK/IPA needs
Android Studio (with the Android SDK it installs) or Xcode, neither of which
exists in this coding environment. Everything below is what to run once you
have that installed.

---

## Getting the Android APK

You need **Android Studio** (free, https://developer.android.com/studio).
Works on Windows, Mac, or Linux.

1. Open a terminal inside `admin-app/`.
2. Install dependencies (only needed once, or after pulling changes):
   ```bash
   npm install
   ```
3. Open the project in Android Studio:
   ```bash
   npm run android
   ```
4. Let Gradle sync finish (first time downloads Android build tools — can
   take a few minutes).
5. To test on your phone: enable Developer Mode + USB debugging, plug it in,
   click the green ▶ Run button.
6. To get an installable **.apk**:
   - Menu: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Appears at `android/app/build/outputs/apk/debug/app-debug.apk`
   - Send this file to any Android phone and install directly (phone will
     ask to allow "install from unknown sources" — normal for apps not on
     the Play Store yet).
7. For a Play Store-ready build, you need a signing key — Android Studio's
   `Build → Generate Signed Bundle / APK` menu walks through this.

## Getting the iOS IPA

**Requires a Mac with Xcode.** No way around this — it's an Apple
restriction on all iOS development, not a limitation of this setup.

1. On a Mac, `cd admin-app`, `npm install`.
2. `npm run ios` — opens the project in Xcode.
3. To test on your iPhone: connect it, select it as the run target, click ▶.
   First time, you'll need to sign the app with your Apple ID in Xcode's
   Signing & Capabilities tab.
4. For TestFlight/App Store distribution, you need a paid Apple Developer
   Program account ($99/year) — Xcode's `Product → Archive` menu walks
   through submission from there.

---

## Whenever admin-panel.html changes

```bash
cd admin-app
node sync-panel.js
npx cap sync
```
Then rebuild in Android Studio / Xcode as above.

## Still not built (from the original mobile-app spec)

The scaffold above gets you an installable shell of the *existing* admin
panel. These pieces from the fuller spec are separate work, not yet done:
- Biometric login (fingerprint/Face ID)
- Push notifications for new orders/payments
- Offline mode with queued sync
- Session auto-timeout
- Play Store / App Store listing and submission (needs your developer
  accounts — Google Play $25 one-time, Apple $99/year)
