# Rendering and QA

## The seek(t) contract

One HTML file (plus assets) at the output size, e.g. 1080×1920. It exposes:

- `window.ready`: a promise that resolves after fonts, images and audio metadata are loaded and the first
  `seek(0)` has drawn. Load every font explicitly (`document.fonts.load`) or frame 0 draws in a fallback.
- `window.duration`: the film's length in seconds.
- `window.seek(t)`: sets every style for time `t` and nothing else. It must give the same pixels for the same `t`
  in any call order.
- `window.cues`: the sound cue list `[{ t, sound, gain, rate? }]`, computed from the same timeline that moves the
  picture. The mix reads it, so picture and sound can't drift apart.

No CSS transitions or animations (or force them off), no timers, no `Math.random`, no state carried between
calls. Keep layers on explicit `z-index`. Self-host fonts and images; a render should need no network.

## Real screens

Capture the real product in each state the film needs, at device size (390×844 CSS px at 2×), from a local
preview of the app with sample data. For each shot also record the bounding boxes of the controls the finger
will touch (`getBoundingClientRect()` in the page) into `shots.json`, so taps land exactly on real buttons.
Where the app calls a paid AI service, mock that endpoint in the preview with a realistic response in the app's
own schema (it's a demo state, not a claim) rather than making paid calls. Check every capture by eye before use.

- **Capture and look at every state before you choreograph.** Real flows surprise: Daywell's "Set timer" readies
  the timer in a card at the top, and a separate "Start timer" runs it. The script follows the app, not your guess.
- **Start the preview before each capture run, and check it answers.** The desktop app can stop dev servers
  between turns; a capture against a dead server fails or, worse, records an error page.
- **Mark what you'll box.** When a label appears more than once, or a control has no unique text, add a
  `data-promo="name"` attribute in an `eval` step and record the box with `css=[data-promo=name]`. Clear old marks
  first. `markText()` in `scripts/example-moments/capture-plan.mjs` marks the smallest element whose whole text
  matches.
- **Moving controls frame by frame.** For a wheel or a scrolling strip, turn off snapping on the scroll container
  (`style.scrollSnapType = 'none'`), set its `scrollTop` for each frame, wait about 120 ms, capture, and afterwards
  restore snapping and fire a `scroll` event so the app settles on the final value. Capture positions on the
  flick's ease-out (`spin(name, selector, index, rows, n, true)` in the example plan) and play them evenly with
`flip(…, { eased: true })`;
  see motion.md for why. About 24 frames per second of spin.

Inside the film, a phone screen is the screenshot drawn at the phone's screen size. Element-level motion (a new
row, a ticking checkbox, a timer counting) is done by overlaying crops of the "after" shot or small rebuilt
elements in the app's own styles; keep them pixel-aligned to the shot.

## Rendering

`scripts/render.mjs` serves the folder on localhost, starts system Chrome headless over the DevTools protocol at
the output size, and for each frame calls `seek(t)`, waits two animation frames, and captures a JPEG (quality
92–95), piping frames into FFmpeg.

- Frame rate: render 60 fps for smooth UI motion; derive 30 fps with `tmix=frames=2` (natural motion blur) for
  platforms that prefer 30.
- Encode: `-c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -vf
  scale=out_color_matrix=bt709:out_range=tv -color_primaries bt709 -color_trc bt709 -colorspace bt709
  -color_range tv -c:a aac -b:a 192k -ar 48000 -movflags +faststart`.
- `--stills=t1,t2,…` renders PNGs at chosen times for checking; always check stills before a full render.
- **Review renders, one moment at a time:** `node render.mjs --film=<film> --from=10 --to=15 --name=moment-03`
  renders just that stretch at full quality, with the matching slice of the full mix. Send that to the owner, not a
  30-second batch, and build the next moment only after their notes are in.
- Long renders run in the background; check progress, don't poll in a tight loop.
- Version every output (`name-v2.mp4`); never overwrite.

## Checking stills (before the full render)

For each scene: one still at its payload (the moment it says its thing), one 0.1 s either side of every
transition, and the last frame of the scene (must be still). Make a contact sheet and also look at a few at full
size (contact sheets hide legibility problems). Score each scene 1–10 on: hook (first 3 s), readable at phone
size, motion quality, variety, composition and safe area, accuracy (facts, real UI), sync to word and beat. Write
the three worst problems with times, fix, re-render those stills, re-score. Stop when every scene is 8+.

What to hunt for: double-printed text during swaps, captions over UI the viewer needs, anything in the bottom
20% / right 12% / top 10% that matters, a scene that's empty or crammed, text smaller than about 36 px at
1080 wide, a finger tapping beside a button, a scene still moving when it changes, the same layout twice in a
row, an accent colour used for decoration.

Stills can't judge pace. After the stills pass, watch the moment's review render at full speed and count: how
many actions, how many camera moves, how long each result holds. More than one action or camera move per moment,
or a result held for less than about a second, means it is too fast (motion.md, "Calm pace").

## Checking the delivered file

- **Spec:** `ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt,color_range,color_space,r_frame_rate,sample_rate,channels -of compact out.mp4`
  → h264 1080×1920 yuv420p tv bt709, aac 48000 2.
- **Loudness:** `ffmpeg -i out.mp4 -af ebur128=peak=true -f null -` → about -14 LUFS, true peak ≤ -1 dBTP.
- **Storyboard:** `ffmpeg -i out.mp4 -vf "fps=1,scale=216:-1,tile=10x12" -frames:v 1 storyboard.png`, and look at it.
- **Glitch scan** (`scripts/qa.mjs`): decode at small size, compute each frame's mean difference from the last;
  report spikes more than three times their neighbours that aren't planned cuts, and one-frame flashes (a frame
  unlike both neighbours while the neighbours match each other).
- **Key moments:** extract full-size frames at every changed beat and at each scene's last frame.
- **Audio cues:** for the effects that matter (the logo hit, the shutter), measure the envelope in a window around
  the cue to prove it's audible at the right moment.

## Separate clips (films of moments)

Cut each moment from the final, mastered render, re-encoding so the cut is frame-exact, with short audio fades:

```
ffmpeg -ss 10 -i film-v3.mp4 -t 5 -af "afade=t=in:d=0.15,afade=t=out:st=4.85:d=0.15" <the encode settings above> clips/03-how-you-slept-v1.mp4
```

Name clips by number and title, and check each clip's first and last frames are settled. A signature that crosses
the boundary shows up at the start of the next clip: Daywell's stamp tucks away during the first 0.5 s of the
following moment. Either let each signature finish inside its own moment, or render the clips one by one with
the neighbouring moments' signatures hidden (every frame is a pure function of time, so this is a filter on the
timeline). Decide which before building the signature, and tell the owner.

## Platform notes (9:16)

- TikTok, Reels, Shorts: 1080×1920, H.264, AAC, up to 60 fps. Keep important content out of the bottom 20%,
  right 12% and top 10%; captions and CTA above about y = 1500.
- Choose a poster frame that reads at 200 px wide (the brand card, not a mid-motion frame).
- Make `.srt` captions from the voice word timings: two lines, at most about 42 characters a line, 1–3 s each,
  broken at clause boundaries.
- Feeds autoplay muted, so the film must work without sound; also check it works without picture (the voice
  alone should make sense).
