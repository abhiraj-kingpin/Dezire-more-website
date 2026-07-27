# Turning Dezire More into a real Android (APK) / iOS (IPA) app

Your website is now wrapped with **Capacitor** (by Ionic) — this takes your
existing React site and packages it inside a real native app shell, so it
installs and runs like any other app on Android and iOS, using the *same*
code you already have.

## What was added
- `capacitor.config.json` — app ID (`com.deziremore.app`), app name, and
  points Capacitor at your built website (`dist` folder).
- `android/` — a full native Android Studio project.
- `ios/` — a full native Xcode project.
- New npm scripts in `package.json`:
  - `npm run cap:sync` — rebuilds your website and copies it into both
    native projects.
  - `npm run cap:android` — builds, syncs, and opens the project in
    Android Studio.
  - `npm run cap:ios` — builds, syncs, and opens the project in Xcode.

**Nothing about your website's code changed.** Capacitor just loads your
built site (`dist/index.html` and friends) inside a native WebView.

---

## Getting the Android APK

You need **Android Studio** installed (free, from
https://developer.android.com/studio). Works on Windows, Mac, or Linux.

1. Unzip this project and open a terminal inside it.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build and open the Android project:
   ```bash
   npm run cap:android
   ```
   This opens Android Studio automatically.
4. In Android Studio, let it finish "Gradle sync" (first time can take a
   few minutes — it downloads Android build tools).
5. To test on your phone: enable Developer Mode + USB debugging on your
   phone, plug it in via USB, then click the green ▶ Run button in
   Android Studio.
6. To get an actual installable **.apk file**:
   - Menu: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - The `.apk` will appear in
     `android/app/build/outputs/apk/debug/app-debug.apk`
   - You can send this file to any Android phone and install it directly
     (the phone will ask you to allow "install from unknown sources" —
     that's normal for apps not yet on the Play Store).
7. For a **Play Store-ready** release build, you'll need to generate a
   signing key and build a "release" APK/AAB — Android Studio's
   `Build → Generate Signed Bundle / APK` menu walks you through this.

---

## Getting the iOS IPA

**Important:** Apple requires a **Mac computer with Xcode** to build iOS
apps — this cannot be done on Windows or Linux. This is an Apple platform
restriction, not a limitation of this project.

1. On a Mac, install **Xcode** from the App Store (free).
2. Install CocoaPods (one-time, in Terminal):
   ```bash
   sudo gem install cocoapods
   ```
3. Unzip this project, open Terminal inside it, and run:
   ```bash
   npm install
   npm run cap:ios
   ```
   This opens the project in Xcode.
4. In Xcode, select your Team under `Signing & Capabilities` (you'll need
   a free or paid Apple Developer account — free accounts can test on
   your own device; a paid account, $99/year, is required to publish to
   the App Store).
5. To test on your iPhone: plug it in, select it as the run target, and
   click ▶.
6. To get an **.ipa file** for distribution:
   - Menu: `Product` → `Archive`
   - Once archived, click `Distribute App` and follow the prompts
     (Ad Hoc for testing, App Store Connect for publishing).

---

## Making changes later

Whenever you edit your website code (React components, CSS, etc.):

```bash
npm run cap:sync
```

This rebuilds the site and copies the fresh version into both the
Android and iOS projects, so your next Android Studio / Xcode build
includes the update.

---

## App icon & splash screen

Right now both apps use Capacitor's default icon. To use your own logo:

1. Get a square version of your logo, ideally 1024×1024px, PNG, no
   transparency issues.
2. Install the icon generator tool:
   ```bash
   npm install @capacitor/assets --save-dev
   ```
3. Put your logo at `resources/icon.png` and a splash image at
   `resources/splash.png` (2732×2732px recommended).
4. Run:
   ```bash
   npx capacitor-assets generate
   ```
   This automatically generates every required icon/splash size for
   both Android and iOS.

---

## Summary

| Platform | What you get | Requirements |
|---|---|---|
| Android | `.apk` file, installable directly or publishable to Play Store | Android Studio (any OS), free |
| iOS | `.ipa` file, installable via TestFlight or publishable to App Store | A Mac + Xcode + Apple Developer account |
