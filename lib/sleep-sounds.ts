// The quiet corner's looping sounds, chosen by the owner on 10 October 2026. Each is a 30-second ElevenLabs sound
// effect made in loop mode (see config/sleep-sounds.json and scripts/generate-sleep-sounds.mjs). gainDb evens out the
// recordings: continuous sounds sit near -30 dB RMS, sparse ones (drips, drum) peak near -12 dB. layers replays the
// same loop again, offset in seconds: the temple drum plays twice, half a loop apart, so its beats come twice as often.
export type SleepSoundGroup = "nature" | "music";
export type SleepSound = { id: string; label: string; group: SleepSoundGroup; file: string; gainDb: number; layers?: number[] };

export const sleepSounds: SleepSound[] = [
  { id: "forest-night", label: "Forest at night", group: "nature", file: "forest-night-daa3cc2ffc25.mp3", gainDb: 36 },
  { id: "forest-dawn", label: "Forest at dawn", group: "nature", file: "forest-dawn-7620740eed3b.mp3", gainDb: 17.8 },
  { id: "distant-waterfall", label: "Distant waterfall", group: "nature", file: "distant-waterfall-37ffdcc0ff2d.mp3", gainDb: 3.5 },
  { id: "trickling-pool", label: "Trickling pool", group: "nature", file: "trickling-pool-1238684bb934.mp3", gainDb: 12.9 },
  { id: "waves-on-sand", label: "Waves on sand", group: "nature", file: "waves-on-sand-31753bac13ad.mp3", gainDb: 1.2 },
  { id: "waves-on-pebbles", label: "Waves on pebbles", group: "nature", file: "waves-on-pebbles-e5f03a154a92.mp3", gainDb: -0.7 },
  { id: "drips-in-a-pot", label: "Drips in a pot", group: "nature", file: "drips-in-a-pot-44d536824d33.mp3", gainDb: -2.1 },
  { id: "slow-drops", label: "Slow drops", group: "nature", file: "slow-drops-eedc7a24af49.mp3", gainDb: 3.4 },
  { id: "temple-drum", label: "Temple drum", group: "music", file: "temple-drum-f3e9a2137356.mp3", gainDb: -3.6, layers: [0, 15] },
  { id: "pan-flute", label: "Pan flute", group: "music", file: "pan-flute-1920868ba82f.mp3", gainDb: -14.9 },
  { id: "pan-flute-drone", label: "Pan flute and drone", group: "music", file: "pan-flute-drone-3b294da04ff0.mp3", gainDb: -10.4 },
];
export const sleepSoundGroups: { id: SleepSoundGroup; label: string }[] = [{ id: "nature", label: "Nature" }, { id: "music", label: "Music" }];
export const stopAfterMinutes = [0, 15, 30, 60] as const;
export const FADE_OUT_SECONDS = 60;

export const sleepSoundUrl = (sound: SleepSound) => `/sleep-sounds/${sound.file}`;
export const linearGain = (decibels: number) => 10 ** (decibels / 20);

// Some browsers keep an MP3 encoder's silent padding, which would put a gap in the loop. Trims up to 60 ms of
// near-silence at either end; longer quiet stretches are part of the sound and stay.
export function loopPoints(samples: Float32Array, sampleRate: number, threshold = 1e-4) {
  const limit = Math.min(Math.round(sampleRate * 0.06), Math.floor(samples.length / 2));
  let start = 0;
  while (start < limit && Math.abs(samples[start]) < threshold) start++;
  let end = samples.length - 1;
  while (end > samples.length - 1 - limit && Math.abs(samples[end]) < threshold) end--;
  return { start: start / sampleRate, end: (end + 1) / sampleRate };
}

// When a fade-out starts and ends for "Stop after", in seconds from the moment it was set.
export function stopPlan(minutes: number) {
  if (!minutes) return null;
  const end = minutes * 60;
  return { fadeFrom: Math.max(0, end - FADE_OUT_SECONDS), end };
}
