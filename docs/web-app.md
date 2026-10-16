# Daywell as a web app

Owner decision, 15 October 2026: Daywell works in a phone's browser as a web app, alongside the iPhone and Android
apps. People can add it to their home screen, where it opens full screen with Daywell's own icon.

## For people using it

- **Open it:** go to daywell.date in the phone's browser and sign in with an email code (see [sign-in](sign-in.md)).
- **iPhone (Safari):** tap Share, then Add to Home Screen.
- **Android (Chrome):** open the menu (⋮), then Add to home screen or Install app.
- **One account:** it's the same account on the web, on a laptop and in the phone apps. Plans are chosen in the
  iPhone or Android app; the web plan screen says so (see [plans](plans.md)). Web payments aren't built.

Things to know:
- **Separate storage on iPhone:** a home-screen web app keeps its own storage, so people sign in once more after
  adding it.
- **Reading comfort** is saved per device, not per account.
- **Web limits:** a sleep sound, timer or alarm may stop or stay silent when the phone is locked or Daywell is
  closed. The phone apps are the place for that (see the [mobile release plan](mobile-release-plan.md)).

## How it's built

- `public/manifest.webmanifest`: name, `standalone` display, start URL `/`, theme and background colour `#fae7ef`,
  and the icons.
- `public/icon.svg` is the icon source: Daywell's sun mark in warm white on the accent plum. It is full-bleed, with
  the mark inside the maskable safe zone. `node scripts/generate-app-icons.mjs` renders `icon-192.png`,
  `icon-512.png`, `icon-maskable-512.png` and `apple-touch-icon.png` (180). `public/favicon.svg` uses the same
  colours.
- `app/layout.tsx` metadata adds the manifest link, the Apple touch icon, the Apple web app title and status bar,
  and the `theme-color` viewport colour. vinext renders these like Next.js does. iOS 16.4 and later takes full-screen
  mode from the manifest.
- The icons and the manifest sit at the site root on purpose. The public front door (`lib/public-access.ts`) serves
  root-level files without a sign-in, so phones can fetch them from the sign-in page. `tests/web-app.test.mjs` and
  `tests/public-access.test.mjs` check this.
- There is no service worker or offline mode: Daywell needs its server for saving, sign-in and AI features.

The same icon is the candidate for the store apps (the [store launch](store-launch.md) list), which still show
Capacitor's placeholder.
