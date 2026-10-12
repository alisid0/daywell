import { readFileSync } from 'node:fs';
import type { CapacitorConfig } from '@capacitor/cli';

// Daywell's Android and iPhone apps open the hosted Daywell service (see docs/mobile-app.md). DAYWELL_APP_URL selects
// it when the native projects are synced; test builds default to the owner-only private tester app. Pages from other
// hosts open in the system browser, except the sign-in hosts listed in mobile/app.json.
const app = JSON.parse(readFileSync('mobile/app.json', 'utf8')) as { appId: string; appName: string; testerUrl: string; signInHosts: string[] };
const url = new URL(process.env.DAYWELL_APP_URL || app.testerUrl);
if (url.protocol !== 'https:') throw new Error('The phone apps only open Daywell over HTTPS.');

const config: CapacitorConfig = {
  appId: app.appId,
  appName: app.appName,
  webDir: 'mobile/www',
  appendUserAgent: 'DaywellApp',
  backgroundColor: '#fae7ef',
  loggingBehavior: 'debug',
  server: {
    url: url.origin,
    cleartext: false,
    errorPath: 'offline.html',
    allowNavigation: [url.host, ...app.signInHosts],
  },
  android: { allowMixedContent: false },
  ios: { contentInset: 'never' },
};

export default config;
