# Sleep sounds

Owner decision, 10–11 October 2026. Sleep shows the sound player directly; Relax and Sleep's "Wind down with Luma" offer the same collection. There are 11 looping sounds in two groups. They replace the earlier "Soft rustling sound", which was four seconds of generated static.

- **Nature:** Forest at night, Forest at dawn, Distant waterfall, Trickling pool, Waves on sand, Waves on pebbles, Drips in a pot, Slow drops.
- **Music:** Temple drum, Pan flute, Pan flute and drone.

## How they were made

Each sound is a 30-second ElevenLabs sound effect made with `eleven_text_to_sound_v2` in loop mode, so its end joins its start. The prompts are in `config/sleep-sounds.json`, and `scripts/generate-sleep-sounds.mjs` makes them. By default the script only prints the plan and the most it could cost. `--generate` checks for an active paid plan and a 20,000-credit reserve, then writes review candidates to the ignored `work/sleep-sounds/`. Approved files are copied to `public/sleep-sounds/` with their generation hash in the name, and `tests/sleep-sounds.test.mjs` checks that those hashes match the config.

- Making all versions over two rounds used about 4,900 credits. Playing the sounds costs nothing.
- Sound effects made on a paid ElevenLabs plan can be used commercially.
- Asking the model for faster drum beats didn't work: it bunched the beats together. So the Temple drum is the owner's chosen drum played as two layers half a loop apart, and its beat groups come twice as often.
- The pan-flute prompts describe a lonely, cinematic western feel without naming any film, composer or tune.

## Playback

`lib/sleep-sounds.ts` lists the sounds, their levels and layers. `app/sleep-sounds.tsx` plays them.

- **Seamless loops.** Sounds play through Web Audio with sample-accurate looping. Up to 60 ms of encoder padding is trimmed at each end, so no browser leaves a gap.
- **Even levels.** `gainDb` brings continuous sounds to about -30 dB RMS and sparse ones (drips, drum) to about a -12 dB peak.
- **One sound at a time,** with a short fade between them. Each file loads when it is first played.
- **Optional stop timer.** "Stop after" (15 minutes, 30 minutes or 1 hour) fades out over the last minute on the audio clock. Some phones pause web audio when locked; keep Daywell open if that happens. Background playback on physical phones remains a device-test gate.
- **Leaving stops it.** Sounds stop when the person leaves the player or starts another recording or conversation. Starting a sound stops other Daywell audio.

To add a sound: add a prompt to the config, generate, listen, copy the chosen file into `public/sleep-sounds/`, and add it to `lib/sleep-sounds.ts` with a level from its measured loudness.

## Finding sounds through conversation

A request such as “Sing me a song” offers the existing instrumental music and nature loops with an **Open music and sounds** button. Daywell must be honest that these are not sung songs. Opening the collection focuses the player and selects Pan flute for music, without starting playback or saving a timer. Bedtime requests and “Open sleep sounds” lead to Sleep; other music requests normally lead to Relax. The user chooses Play.

The local command path needs no classifier or generation request. The live agent template describes the same capability through the existing `daywell_request` tool. Applying that template to the live agent is a separate active-session operation, never a background-sync action. New conversations are not automatically published as shared recordings.
