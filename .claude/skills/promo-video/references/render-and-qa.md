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
  -color_range tv -c:a aac -b:a 256k -ar 48000 -movflags +faststart`.
- Measure the true peak of the delivered MP4, not just the master. At 192 kbps, FFmpeg's AAC encoder added up to
  2.5 dB to a sharp drum hit. At 256 kbps, with the limiter's ceiling at -2.5 dBFS (`ceilingDb` in `film.json`),
  all five Daywell shorts measured -1.6 to -2.2 dBTP.
- `--stills=t1,t2,…` renders PNGs at chosen times for checking; always check stills before a full render.
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

## Platform notes (9:16)

- TikTok, Reels, Shorts: 1080×1920, H.264, AAC, up to 60 fps. Keep important content out of the bottom 20%,
  right 12% and top 10%; captions and CTA above about y = 1500.
- Choose a poster frame that reads at 200 px wide (the brand card, not a mid-motion frame).
- Make `.srt` captions from the voice word timings: two lines, at most about 42 characters a line, 1–3 s each,
  broken at clause boundaries.
- Feeds autoplay muted, so the film must work without sound; also check it works without picture (the voice
  alone should make sense).
