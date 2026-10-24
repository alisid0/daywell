# Story and truth

What the film says, and how every word, number and screen in it stays honest. Do this before any animation:
a clear claim with no invented facts survives an average shot; a beautiful film built on a made-up feature is
unshippable the moment someone checks.

## 1. Intake

Ask only for what you can't find yourself, in one batch:

- What is it, in one line, and who is it for?
- Where will it play (TikTok/Reels/Shorts 9:16, site hero 16:9, LinkedIn 4:5) and how long (15, 30, 60, 120 s)?
- Brand: colours (hex), fonts (files), logo and any characters. Sample them from the product's code if it's
  available rather than asking.
- The call to action, word for word (URL, store, price).
- Voice or no voice; music taste ("upbeat promo", "calm", a reference track).

## 2. The truth pass

Read the product's code, docs and live screens. For every feature you might show, record where it lives and
whether it works today:

| Status | Meaning | In the film? |
| --- | --- | --- |
| ✅ works today | Found in the code and seen working (preview, test build) | Yes |
| ⏳ promised, not built | On the roadmap or in a design only | Only if posting waits until it ships; mark it in the script |
| ✗ not real | Nobody has built it | Never |

Things the truth pass typically catches: a "one tap" feature that is really a short form; a voice feature that is
being removed; a button whose label changed; a limit that only applies in one plan. Write the corrected version
into the script instead of the marketing version.

**The approved-facts list.** A table of every number, price, count and claim allowed on screen, each with its
source (file and line, doc, dashboard). Refuse everything else, including plausible filler. Round only towards
the less impressive number. Sample data in a demo (a person's day, meals, times) is fine and should look
realistic, but it isn't a claim; say in the README that it's a sample.

**The never list.** Write what may never appear: invented metrics, ratings or user counts; stock faces; other
companies' logos or UI (a generic feed is fine, a fake Instagram is not); medical or financial claims the product
can't make; features in the wrong plan; anything the brand rules forbid.

## 3. The claim and the arc

One claim, seven words or fewer, no "and". Usually the product's own headline, a customer's words, or the
before/after in one sentence. Everything after it is evidence for that claim.

Arcs that work for promos (pick one deliberately; don't default to the same one every time):

- **A day in the life:** the product appears in each moment of one person's day (morning → night).
- **Problem → turn → proof:** the viewer's pain, the claim, three or four product beats, the CTA.
- **Many → one:** several apps or chores collapse into one place.
- **Cold open:** three seconds of the striking result, then how it happened.

Budget for a 120 s vertical film: hook 0–7 s, brand 5 s, 6–9 product moments of 6–14 s each, plans/price 6 s,
CTA held at least 4 s. For 30 s: hook, three moments, CTA. Cut product detail, never the claim.

## 4. Direction

Write three genuinely different directions, kill two. For each:

```
DIRECTION <name>
Thesis      what this film IS, in one sentence
Look        ground, palette, type, texture, camera, how much UI
Signature   the one move only this film makes (expresses the claim; appears 2-3 times or as the transition grammar)
Sound       voice, music character and tempo, effects
Risk        how it fails if executed badly
```

Judge them: does it serve the claim or decorate it; does it look like this brand, but better; could a competitor
use it unchanged (then kill it); can it survive an average day of execution. Then commit, and stop being creative
about the direction; be creative inside it.

A signature move takes the product's core verb and makes the film do it: if it organises, scattered things
converge at every transition; if it plans your day, every moment arrives as an event card that opens into the
app (Daywell); if it removes work, the frame literally empties as the film runs.

## 5. Writing the script

The script document is what the owner approves. It has:

1. **The idea** in one line and the signature move in one sentence.
2. **The scene table:** number, time, moment, what you see (the finger's actions), words on screen, status ✅/⏳.
3. **Voiceover lines**, one per scene, with start times; delivery tags in [brackets] (not spoken).
4. **Sound plan:** voice, music character and sections, effects per action, mastering target.
5. **Approved facts** with sources, and the **never** list.
6. **Credits estimate** for paid audio, and the decisions you need from the owner.
7. **How the build will be shown:** one moment or scene at a time, as a short clip with sound, each folded in
   before the next is built. Offer this as the plan rather than chapter-sized batches.

### Writing for the ear

- One clause per beat; full stops are breaths and cut points. "Snap your breakfast. Daywell notes it for you."
- Short words, said the way people speak. Questions work well as hooks ("Out of milk?").
- Spell numbers as they're said ("four ninety-nine a month"); show them as figures on screen ("£4.99").
- Keep the voice to about 55–60% of the running time, so music and effects have room; leave the calmest
  moments nearly wordless.
- The words on screen are the voiceover, chunked into cards of at most two lines, so muted viewers get the same
  film. A bubble of a character's real in-app line is fine as text; don't give characters a voice they don't
  have in the product.
- In a film of fixed moments: one line per moment, about 3–4 s spoken, naming the one thing the moment shows.
  Each moment should make sense alone, because it may be posted as its own clip.

## 6. After approval

Lock the script. Later changes go line by line (one voice clip, one scene), so earlier approved work and paid
audio aren't thrown away. Keep a short decisions log in `SCRIPT.md`.
