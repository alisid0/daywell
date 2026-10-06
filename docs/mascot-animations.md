# Illustrated companions — approved MVP

The approved family is the **illustrated v4, minimal-fur** version, reviewed on 6 October 2026. It supersedes the photoreal direction in the earlier animation handover. Keep the softer, less refined illustration style and the continuous painted arms from that review.

## Runtime assets

`public/companions/illustrated-v4/` contains all seven characters: Luma, Pip, Tock, Momo, Nori, Bounce and Sunny. Each has seven transparent WebP layers and a matching still portrait rendered from the approved rig. The complete family is approximately 4.42 MiB; a page loads still portraits and only the active character's layers. No remote image service, AI call or video download is required for animation.

`lib/companion-renderer.mjs` preserves the approved v4 canvas drawing and poses. Its TypeScript boundary is declared in `companion-renderer.d.mts`. The body stays steady while feathered outer tufts move at **0.22 strength**, below one source pixel. Eyes, arms, feet and props are separate, so fur movement does not distort the face or hands. The original full-resolution artwork and bulk animation exports remain in the separately supplied family archive; they are not needed to run the app.

## Behaviour

- `CompanionPortrait` is still by default. Pass `motion` only for the relevant helper. Navigation, routine choices, onboarding groups and acknowledgements stay still.
- At the doorway, only Pip animates; listening/thinking/speaking/caring expressions follow the existing host microphone state. They are illustrative expressions, not phoneme-synchronised lips.
- Luma is quiet company in Relax and meditation, and sleepy during wind-down. Her animation does not prescribe a breathing rate or start sound.
- The active movement helper encourages during a timed step; completed activities soften into a happy pose. Saved tool entries trigger a single three-second reaction, then return to idle.
- Selecting a helper shows their animated portrait; sending love changes its expression. Characters retain their roles and content from `content/companions.json`.

The runtime draws at at most 24 fps with eased transitions and eight-second loops. It lazy-loads its renderer and images on intersection, stops drawing while off-screen or while the document is hidden, releases the animation frame on unmount, and keeps a matching static fallback on failure. Decoded image layers are shared across instances. The one-shot celebration never loops.

**Gentle companion movement** is available under **Voice & company**, in each quiet space, the routine player, and helper details. The browser saves that preference for every companion. Device reduced-motion settings always take precedence; the static illustration stays available and no animation layers are requested in that mode.

## Verification

`npm run check` includes coverage for the complete asset family, the size budget, all 70 pose states, loop boundaries, transition endpoints, one-shot timing, and microphone/activity mapping. Also review Today, Relax, Sleep, a guided routine and a selected helper in the browser. Verify the saved movement switch, keyboard access, static fallback, mobile layout and absence of duplicate whole-image CSS animation. No voice-provider request is needed to test these visual changes.
