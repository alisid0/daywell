# Sound: voice, music, effects and the mix

Sound is measured, never guessed. You can't listen to it, so every decision is backed by a number from the files.

## ElevenLabs basics

- Commercial use needs a paid plan (Starter or higher). Check `GET /v1/user/subscription`: `tier`, `status`,
  `character_limit - character_count` for credits left, `allowed_to_extend_character_limit` (false means it can't
  overspend). Keep a reserve (Daywell keeps 20,000) and tell the owner the expected cost first.
- Read the key from a local secrets file inside the script (`ELEVENLABS_API_KEY=` in `.dev.vars`); never print,
  log or commit it. Check the file has the key by its length, never its value.
- History: every generation shows in the account's history, which is a handy audit of what was spent.
- **Music charges arrive late.** Straight after a music call the balance didn't include it; the take's charge
  showed up later. Budget from the expected cost, and check the balance again before the next paid step
  (`scripts/credits.mjs`, a free call).
- **Name the voice, don't store its ID.** The film's lines give the voice's name ("Alice") and `voiceover.mjs`
  finds it among the account's voices (a free call), so the files can sit in a public repo.

## Voice

1. **Pick the voice by ear (the owner's).** Make the same opening line in 3–4 candidate voices (about 100 credits
   each) and send the files. Read the account's voices with `GET /v1/voices/<id>` for name, accent and labels.
2. **Model:** `eleven_v4` (best quality; supports delivery tags in [brackets] such as `[Warm, upbeat, friendly
   narration]` or `[Softer, slower and calm]`; no `speed`/`style` settings; tags cost characters but aren't
   spoken). `eleven_multilingual_v2` is the stable fallback.
3. **One request per line** to `POST /v1/text-to-speech/<voice>/with-timestamps?output_format=mp3_44100_192`
   with `previous_text`/`next_text` (plain text of the neighbouring lines) for continuity and a fixed `seed`.
   The response has `audio_base64` and `alignment` (`characters`, `character_start_times_seconds`,
   `character_end_times_seconds`); skip the tag's characters and group the rest into words.
4. **Check every clip** by transcribing it back (`POST /v1/speech-to-text`, `model_id` `scribe_v2`, multipart
   `file`) and comparing with the script. Formatting differences ("$4.99" for "four ninety-nine") are fine;
   missing or extra words mean redo that line. Homophones are fine too ("Your week" came back as "You're weak"),
   but name the line to the owner so they listen to it.
5. **Place lines on the film's timeline** by their start (`at`); measure each line's length and move scene
   boundaries so a line never runs into the next scene. Leave at least 0.3 s between lines. In a film of fixed
   moments a line starts about 0.3 s into its moment and stays under about 4 s, leaving room for the result and the
   signature. If it runs long, shorten the words (`eleven_v4` has no speed setting). A wordless moment keeps its
   line with empty `text`: the voice and mix tools skip it and the numbers still match the moments.

## Music

**Compose to the plan** with `POST /v1/music?output_format=mp3_48000_192`, body
`{ composition_plan: { chunks: [...] }, model_id: "music_v2_5", seed }`. Each chunk: `text` (a section name in
brackets plus optional `{directions}`), `duration_ms` (3,000–120,000), `positive_styles`, `negative_styles`,
`context_adherence: "high"`. At most 30 chunks; durations are enforced on v2 models. The first chunk sets the
overall sound, so give it 6–10 styles including tempo and key ("120 BPM", "D major") and "instrumental"; put
"vocals", "singing", "lyrics", "humming" in every chunk's negatives. Use 120 BPM when you can: a bar is exactly
2 s, which makes scene maths easy. For a film of fixed-length moments, pick the tempo that makes one moment whole
bars (5 s is two bars at 96 BPM) and start every chunk on a moment boundary. Prompts can't name artists or songs.

**Contrast needs looser adherence.** With `context_adherence: "high"` on every chunk the model kept one groove for
the whole piece: take 1 of "Small things count" played the same drums through the planned dusk and night. Take 2
kept "high" for the opening sections, used "medium" for the lift, the easing back and the outro, and "low" for the
breakdown and the night. It got the contrast: drums out from 105 to 125 s and very quiet from 125 to 130 s.

**Then measure what you got** (`scripts/beats.mjs`): tempo from spectral-flux autocorrelation, beats from a
dynamic-programming tracker, loudness per 2 s bar, and a low-band (kick) profile per bar. The model follows
durations and tempo closely but not always the energy plan: in the Daywell take the drop came at 8 s instead of
6, the breakdown planned for 60 s started at 72 s, and there were one-bar drum breaks at 38, 54 and 70 s.
**Move the film to the music**, not the other way round: put the brand name on the real drop, scene changes on
breaks, and calm scenes in the real soft section. When the music can't do something you need (a "pause"), make
it in the mix: low-pass and dip the music on the word, then return.

- **Check the sections with `scripts/bands.mjs`** (5-second windows): the overall level can stay put when drums
  drop out, but the high band (hi-hats, above 6 kHz) and the low band (kick and bass, below 150 Hz) fall clearly.
- **Check the grid all the way to the end.** In take 2 every moment started within 25 ms of a beat until 130 s,
  then 0.12–0.18 s late. `beats.mjs` prints each planned start's offset; move cues to the real beats where it slips.

Commercial use: ElevenLabs music is cleared for social media and advertising on paid plans (film, TV and big
games need Enterprise). Mixkit is the free alternative (check each track's licence).

## Sound effects

`POST /v1/sound-generation?output_format=mp3_44100_128` with `{ text, duration_seconds, prompt_influence: 0.6,
model_id: "eleven_text_to_sound_v2" }`. `duration_seconds` must be at least 0.5 (shorter requests are refused):
ask for 0.5 and place the sound by its peak. Describe the sound physically and say what to leave out: "A single soft,
clean button tap on a phone touchscreen in a calm wellbeing app: a short warm click, subtle and modern, dry, no
reverb, no beep". A useful set for app promos: tap, shutter, saved chime, pop, notification ping, card drop
(whoosh + paper land), typing, timer tick, swoosh (items flying), feed scroll, shimmer, stars, tick, whoosh,
logo hit.

Measure each file (`volumedetect`): peak and mean vary by 20 dB. Normalise each effect's peak before giving it
a cue level, and find its peak time (argmax |sample|) so the peak, not the file start, lands on the cue. Don't
repeat one effect so often it becomes a tic; vary pitch slightly (±1–2 semitones) for repeated pops and pings.

## The mix

Build it from the film's own cue list (exported from the timeline, so picture and sound share one source):

- **Voice** on top. Target around -16 LUFS for speech before the master.
- **Music** ducked under speech: about -10 dB while a line plays (0.2 s attack, 0.5 s release from the word
  timings), about -4 dB between lines, full only where there's no voice (the drop, the end). Automate it from the
  timings rather than with a compressor, so it is exact and repeatable.
- **Effects** placed by peak at their cue, each with a level, mostly -14 to -22 dB below the voice peak; the hit
  on the logo can be louder.
- **Ambience** (a real product sound, such as Daywell's sleep sounds) faded in and out under its scene.
- **Master in two passes:** `loudnorm=I=-14:TP=-1.5:LRA=11` measured, then applied with the measured values and
  `linear=true`, followed by `alimiter=limit=0.891:level=disabled` (without `level=disabled` the limiter adds
  makeup gain). Measure the delivered file with `ebur128=peak=true`: about -14 LUFS, true peak ≤ -1 dBTP.
- **Re-mix after every timing change.** The effects come from the film's cue list, so export the cues again
  (`render.mjs --cues`) and re-mix before rendering. A one-moment review render takes its slice of the full mix,
  so the owner hears exactly what the compilation will have.
- **Separate clips** cut from the mastered film keep the compilation's balance. Measure any clip that will be
  posted alone: a 5-second clip's loudness can sit well away from the film's.

## Traps

- A quiet source can't be rescued with a cue volume: level the asset first (check its peak and mean).
- An effect with silence at its start lands late: place by peak, or trim from the first transient.
- `loudnorm` with `linear=true` doesn't stop new peaks: always follow it with a limiter.
- Measure on the delivered MP4 (AAC can add a little peak), not on the WAV you made it from.
