import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = JSON.parse(readFileSync(new URL('../mobile/app.json', import.meta.url), 'utf8'));
let loads = 0;
async function config(url) {
  const previous = process.env.DAYWELL_APP_URL;
  if (url === undefined) delete process.env.DAYWELL_APP_URL; else process.env.DAYWELL_APP_URL = url;
  try { return (await import(`../capacitor.config.ts?load=${++loads}`)).default; }
  finally { if (previous === undefined) delete process.env.DAYWELL_APP_URL; else process.env.DAYWELL_APP_URL = previous; }
}

test('the phone apps open the private tester app by default, over HTTPS only', async () => {
  const tester = await config(undefined);
  assert.equal(tester.appId, 'com.daywell.app');
  assert.equal(tester.server.url, app.testerUrl);
  assert.equal(tester.server.cleartext, false);
  assert.equal(tester.server.errorPath, 'offline.html');
  assert.deepEqual(tester.server.allowNavigation, [new URL(app.testerUrl).host, ...app.signInHosts]);
  const store = await config('https://daywell.example.workers.dev/today');
  assert.equal(store.server.url, 'https://daywell.example.workers.dev');
  assert.equal(store.server.allowNavigation[0], 'daywell.example.workers.dev');
  await assert.rejects(config('http://daywell.example.workers.dev'), /HTTPS/);
});

test('native projects ask for the microphone and camera only as optional features, with reasons on iPhone', () => {
  const manifest = readFileSync(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
  for (const permission of ['INTERNET', 'RECORD_AUDIO', 'MODIFY_AUDIO_SETTINGS', 'CAMERA']) assert.match(manifest, new RegExp(`android\\.permission\\.${permission}"`));
  for (const feature of ['microphone', 'camera']) assert.match(manifest, new RegExp(`android\\.hardware\\.${feature}" android:required="false"`));
  const plist = readFileSync(new URL('../ios/App/App/Info.plist', import.meta.url), 'utf8');
  for (const key of ['NSMicrophoneUsageDescription', 'NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription']) assert.match(plist, new RegExp(`<key>${key}</key>\\s*<string>Daywell [^<]+</string>`));
  assert.match(plist, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
});
