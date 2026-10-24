# Motion

How things move between the cue and the hold. Everything here is a pure function of time `t` (seconds), evaluated
inside `seek(t)`. Nothing animates on its own.

## Springs

Closed-form damped step response, 0 → 1. `w` is stiffness (rad/s), `z` damping ratio.

```js
function spring(tau, w = 18, z = 0.85) {
  if (tau <= 0) return 0;
  if (z >= 1) { const x = w * tau; return 1 - Math.exp(-x) * (1 + x); }
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau));
}
// A value that changes target many times is the sum of one spring per change, so it stays a function of t.
class Track {
  constructor(v0) { this.v0 = v0; this.cur = v0; this.ev = []; }
  to(t, v, w = 18, z = 0.85) { if (v !== this.cur) { this.ev.push([t, v - this.cur, w, z]); this.cur = v; } return this; }
  at(t) { let v = this.v0; for (const [t0, d, w, z] of this.ev) v += d * spring(t - t0, w, z); return v; }
}
```

- UI elements: `w` 16–26, `z` 0.75–0.9 (a hair of overshoot). Camera and text: `z` = 1.
- A spring takes about `4.6 / (z·w)` seconds to settle; issue a target that must *arrive* by T that much early.
- For something that must be exact at a moment (a finger landing on a button), finish the move before the press.

## Easing for one-off moves

`easeInOut = t => t < .5 ? 4*t*t*t : 1 - (-2*t + 2) ** 3 / 2`, `easeOut = t => 1 - (1 - t) ** 3`. Use `out` for
arrivals, `in` for departures, `inOut` for long travel (camera, a card crossing the frame). Never linear for
movement; linear only for clocks (typing, counters, timers).

## The shape that never cuts

The signature transition: one container morphs between states. Animate `left`, `top`, `width`, `height`,
`border-radius`, background colour on springs, and give its *content* its own short enter/exit windows:

```js
// Content visibility with a short blur: enters on a spring, exits short and early so states never double-print.
function vis(t, tin, tout, dOut = 0.14) {
  const e = spring(t - tin, 26, 1), x = tout == null ? 0 : Math.min(1, Math.max(0, (t - tout) / dOut)), xo = x * x;
  return { o: e * (1 - xo), blur: (1 - e) * 10 + xo * 10, dy: (1 - e) * 16 - xo * 10 };
}
```

Old content leaves before the new content arrives (exit ends where entry begins). For a card that becomes a
screen: the card's label exits as it starts to grow; the screen image enters once the container is past ~70% of
its final size; the radius settles last.

## Content swaps between real screens

Two captured screenshots of the same screen (before/after a tap): cross-dissolve over 0.18–0.25 s with a
2–6 px blur peak in the middle. Keep the parts that don't change pixel-identical so only the changed area seems
to move. If only one region changes (a new list row), crop that region from the "after" shot and slide it in.

## The finger

A soft round touch indicator (about 64 px at 1080 wide: white fill at 85%, dark 2 px ring, real shadow), always
above the UI it touches. A tap is three things on the same moment:

1. **Approach:** travel on a bowed path (x and y on different eases/durations), arriving ~0.1 s before the press.
2. **Press:** the dot scales to 0.82 and darkens for 0.08 s, a ripple ring expands (0 → 2.2×, opacity 0.5 → 0)
   over 0.45 s, and **the control reacts** (depresses to 0.96 or highlights).
3. **Result:** the next state swaps in 0.05–0.15 s after the press, with the tap sound placed by its peak.

Take tap positions from the real control boxes recorded when capturing the screens. Fade the finger out when
its work in a scene is done.

## Camera

One transform on the world layer: translate to a point, scale, translate back. Interpolate zoom in log space
(`z = exp(lerp(log z0, log z1, e))`) or it feels like it accelerates. Push in (1.15–1.8×) about the control
being touched, so that control is a fixed point and the finger stays on it; settle before the tap; release after
the result has landed. Don't zoom in and out back to back. A slow continuous drift (1–2% over a scene) keeps
holds alive. The shorts engine does this by itself: during any hold over 2.6 s it pushes in by up to 4%, and the
next camera move releases it.

## Text

- Captions: the voiceover's words, in cards of at most two lines. A card appears on its first word's start time
  (from the TTS alignment) and leaves just after its last word ends, with a masked rise (`translateY(100%)` →
  0 inside `overflow:hidden`) and 40–60 ms stagger per word. An emphasis word may take the accent colour.
- Never animate `font-size`; scale with transforms. `tabular-nums` for anything counting.
- Text stays sharp: don't blur the line people are reading; don't put `will-change` on anything the camera
  scales.

## Rhythm

- Every 2–4 seconds something new happens; nothing is static for more than about 1.5 s except a deliberate hold.
- Stagger groups by 30–60 ms in reading order; items you want counted by 100–150 ms.
- Before a big moment (the brand reveal, the final card) leave a short quiet beat; then hit on the beat.
- Each scene resolves; the next one enters already moving in the direction the last one left.

## Deterministic life

No loops. For breathing circles, bobbing characters or pulses, derive the value from `Math.sin` of time inside a
bounded window, with an envelope that ends at zero before the scene changes. Seeded noise only (mulberry32 on an
index), never `Math.random`.
