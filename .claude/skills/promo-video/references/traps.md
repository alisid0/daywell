# Traps (each cost real time on the Daywell promo)

Read this before building or debugging.

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
- **Template literals don't survive the shell.** Writing JS with backticks through `node -e "…"` in bash is
  mangled by command substitution. Edit files with the editor, or write a script file.

## The shorts (October 2026)

- **A field that submits itself spoils its last crop.** The sixth digit of the sign-in code signs in at once, so
  the last typing crop caught the page mid-reload, blank. Capture the finished state separately: set the value from
  script without an input event (an `eval` step), then crop it and take a full shot.
- **A drawn screen must outlast the next card.** A chapter card covers the phone only once it has opened (about 1 s
  after its bar). A drawing that ends before then leaves an empty screen under the opening card. Keep each
  chapter's drawing until the next card has covered the phone.
- **"scroll" is only for real page scrolls.** A list scrolled inside a dialog jumped, because the two captures
  don't overlap as one page. Use "slide" there.
- **"Still" needs a longer look.** Comparing each frame with the one before calls a slow drift or a breathing ring
  "still". Compare with the frame half a second earlier. Holds while a bubble is read still froze, so the shorts
  engine now pushes in slowly during any hold over 2.6 s, and the bubble's helper nods.
- **Wide shots pivot on the focus point.** Below zoom 1, the camera keeps its focus point fixed, not the middle of
  the frame. A slow push-in then drifts everything away from that point, so leave a margin on the far side.
- **Renders side by side fight over ports and the Chrome profile.** Give each one its own `RENDER_SLOT`. On a busy
  machine Chrome can also take over 10 s to start, so `render.mjs` waits up to a minute, and lets Chrome exit
  before the next render in that slot.
- **Exact text matches break when the UI adds counts.** A tab whose label gained a count no longer matched its name
  exactly. The October redesign shows counts with CSS (`data-count`), so capture plans can match the name alone.
- **The script can drift from the app.** "One tap" took two, "Undo" was "edit", "be in bed" was "Wake up at", and
  "from anywhere" was only from Home. Check each line against the screen it plays over while capturing, and ask
  the owner before changing an approved line.

## Sound

- **The music isn't the plan.** In Daywell's take the drop came 2 s late and the breakdown 12 s late, so measure
  it and move the film.
- **Effects get buried under the voice.** Whooshes, typing and small pops at -20 to -22 dB vanish under speech.
  About -14 to -16 dB makes them present but not loud. Check each with the mixer's "effect peak minus bed" report.
- **Quiet lines vanish under loud music.** A softly spoken line over full-energy music sat only 3.6 dB above it.
  Give that line a lift (+3 dB) and a deeper duck (-15 dB).
- **Some effects start late.** Place hits by their peak and textures (typing, scrolling, sparkles) by their onset.
- **The encoder moves the peaks.** A master at -2.4 dBTP came out of 192 kbps AAC at -0.1 dBTP, from one sharp
  drum hit. Lowering the ceiling isn't enough on its own; encode at 256 kbps, and measure the delivered MP4.
