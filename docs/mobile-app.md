# Daywell phone apps

One Capacitor 8 app serves Android and iPhone (owner decision, 12 October 2026; see the [store launch plan](store-launch.md)). The app opens the hosted Daywell service, so features keep working as the web app changes. Pages from other hosts open in the system browser, except the sign-in hosts listed in `mobile/app.json`.

## How it fits together

- `mobile/app.json` sets the app ID (`com.daywell.app`), the name, the private tester address and the sign-in hosts. `capacitor.config.ts` reads it.
- `DAYWELL_APP_URL` chooses the hosted service when the native projects are synced. Without it, builds open the owner-only private tester app. Only HTTPS addresses are accepted.
- `npm run mobile:sync [android|ios]` writes the two bundled pages for that address to the git-ignored `mobile/www/`, then copies them and the configuration into `android/` and `ios/`.
  - The loading page.
  - The screen shown when Daywell can't be reached, with a Try again button.
- Android asks for the microphone (talking to Daywell) and the camera (food photos) only when they are used; phones without them can still install. iPhone shows the reasons in `ios/App/App/Info.plist`.
- `tests/mobile-app.test.mjs` checks the address rules, the navigation list and these permissions.

## Builds

`.github/workflows/mobile.yml` runs on GitHub for pull requests that touch the apps, and on demand from the Actions tab. When run on demand, it takes an optional address for the hosted service.

- **Android:** builds a debug-signed test APK and uploads it as the run's `daywell-android-test` artifact.
- **iPhone:** compiles for the simulator. Signed TestFlight builds need the Apple Developer account, a distribution certificate and an App Store Connect API key stored as GitHub secrets by the owner.

To build locally instead, Android needs JDK 21 and Android SDK 36 (Android Studio), and iPhone needs Xcode 26 on a Mac. On this Windows checkout, `npm run install:ci` fails because nested esbuild install scripts exceed the Windows path limit. Use `npm ci --workspaces=false --include=dev --include=optional --no-audit --no-fund --ignore-scripts`.

## Installing the Android test build

1. Open the latest **Phone apps** run in GitHub Actions, signed in, and download `daywell-android-test`.
2. Unzip it and open `app-debug.apk` on the Android phone. Allow installing from that source when Android asks.
3. Sign in with Cloudflare as on the web. Google blocks its own sign-in inside apps, so if your Cloudflare login uses Google, use your email and password instead.

## Not done yet

- Release signing: the Play upload key, and Apple certificates and profiles.
- Store builds: AAB and TestFlight.
- The app icon and splash screen. Test builds show Capacitor's placeholder.
- Native sound playback that continues on the lock screen.
- Timer and alarm notifications while the app is closed.
- Opening the public service once customer sign-up exists.
