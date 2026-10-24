# Traps (each cost real time on the Daywell films)

Read this before building or debugging.

## Pace and review

- **Pace hides in stills.** Every still of the first cut of "Small things count" looked fine. At full speed, five
  actions and six camera moves in 5 seconds read as rushed: "the movements and animations are way too fast". Watch
  each moment at playback speed with sound before sending it, and count actions and camera moves.
- **A batch review spreads one mistake over many moments.** Six moments went to the owner together, so the pace
  problem had to be fixed six times. Send one moment, get notes, then build the next.

## Truth

- **The code disagrees with the marketing.** The sleep "one tap" was a form, and meal planning's main button was a
  microphone that is being removed. Always read the code and click through the real flow before writing a scene.
- **The capture shows a bug.** The photo sheet's main buttons were white on white. A CSS variable was defined
  only inside the page container, and the sheet renders outside it. Report bugs like this to the owner with the
  fix. Captures may show the fixed state only if the fix will ship before posting; say so.
- **Demo data has to agree with itself.** A stand-in salmon bowl photo with an AI result reading "Eggs & greens
  on toast" breaks trust. The photo, the result and the by-hand entry must match. Prefer the owner's own photo.
- **The UI leaks the real clock.** "Stops at 17:43" in a 22:30 scene. Give each capture group a fake clock for the
  story's time, and `__advance()` it to make durations realistic ("about 4 minutes", not "about 1 minute").

## Capturing screens

- **Clips are in page coordinates.** `Page.captureScreenshot` clips in page coordinates, but
  `getBoundingClientRect` gives viewport ones, so add `scrollX`/`scrollY` or the crops come out blank.
- **Settings leak between captures.** The app saves them (Reading comfort, drafts) in the browser profile, so one
  capture changes the next. Clear `localStorage`/`sessionStorage` at document start for every group.
- **Typed text doesn't scroll the field.** Setting an input's value from script doesn't scroll it like real
  typing, so also move the caret to the end and set `scrollLeft = scrollWidth`.
- **A good button can still be behind the dock.** Check every recorded tap box against the bottom navigation
  (y < about 760 of 844), and pick scroll positions so the controls you tap are clear of it.
- **Thumbnails mislead.** A slashed zero read as 9 on a contact sheet. Check text in full-size crops before
  "fixing" it.
- **The real flow has an extra step.** The timer moment was planned as one tap on "Set timer", but that only
  readies the timer; "Start timer" runs it. Capture and look at every state before choreographing.
- **Wheels snap back during frame capture.** With scroll snapping on, a `scrollTop` between rows jumps to the
  nearest row. Turn snapping off while capturing, then restore it and fire a `scroll` event.
- **A text match boxes the wrong element.** A label that appears more than once (or sits inside a bigger element
  with the same text) can give the wrong box. Mark the element you mean with `data-promo` in an `eval` step and box
  it by that attribute.
- **The preview server disappears.** The desktop app stopped the harness between turns and captures failed. Start
  it before every run and check that it answers.
- **A harness with its own stylesheet list misses new styles.** Daywell's preview harness imports CSS from its own
  list, so the new `time-wheels.css` was missing and the wheels captured unstyled. Add each new stylesheet there.

## The engine

- **Spring tracks need targets in time order.** `Track.to()` stores each change against the previous target, so
  out-of-order calls silently drop or corrupt moves. In Daywell's case the camera never returned to full view
  before each card. Collect all camera keyframes, sort them, then apply.
- **The morph must finish before the swap.** Let the card's spring settle (about 1 s at w=12, z=0.95) before the
  real screen replaces it, or the size jumps.
- **Swaps double-print.** Cross-sliding two opaque screenshots with partial opacity shows both. Use a sequential
  swap (out, then in), or a true scroll when the two captures overlap: move both by the scroll difference, inside a
  container clipped above any fixed bar.
- **Captions sit over the phone when zoomed.** Add a band of the current sky colour behind the captions whenever
  zoom > 1, and switch caption ink to light when the sky is dark (by luminance, not by a "night" flag).
- **Template literals and backslashes don't survive the shell.** Writing JS with backticks through `node -e "…"`
  in bash is mangled by command substitution, and a heredoc dropped the backslash from a regex's `\d`. Edit files
  with the editor, or write a script file.
- **A visible child inside a hidden parent stays visible.** Name chips stayed on screen after their layer was
  hidden, because `visibility: hidden` on a parent doesn't hide a child set to `visibility: visible`. Turn whole
  layers off with `display: none`.
- **A flipbook timed backwards.** Even-step frames shown at `τ = 1 − (1 − p)²` make a wheel speed up and stop
  dead. Show them at `τ = 1 − √(1 − p)`, or capture the frames on the ease-out and show them evenly. The first
  Daywell cut had the backwards version; `engine/moments.js` is fixed.

## Sound

- **The music isn't the plan.** In Daywell's take the drop came 2 s late and the breakdown 12 s late, so measure
  it and move the film.
- **Effects get buried under the voice.** Whooshes, typing and small pops at -20 to -22 dB vanish under speech.
  About -14 to -16 dB makes them present but not loud. Check each with the mixer's "effect peak minus bed" report.
- **Quiet lines vanish under loud music.** A softly spoken line over full-energy music sat only 3.6 dB above it.
  Give that line a lift (+3 dB) and a deeper duck (-15 dB).
- **Some effects start late.** Place hits by their peak and textures (typing, scrolling, sparkles) by their onset.
- **High context adherence flattens the music.** With `"high"` on every chunk, the planned quiet dusk and night
  kept the morning's drums. Use `"medium"` or `"low"` on the contrast chunks and check with `bands.mjs`.
- **The beat grid slips late in a take.** Moments sat within 25 ms of a beat until 130 s, then 0.12–0.18 s late.
  Check every boundary, not just the first few.
- **Effects shorter than 0.5 s are refused.** Ask for 0.5 s and place the sound by its peak.
- **Music charges show up late.** The balance straight after a music call left out the take's charge, which
  appeared later. Budget from the expected cost.
- **The transcription check flags homophones.** "Your week" came back as "You're weak". Accept it, but name the
  line to the owner.
