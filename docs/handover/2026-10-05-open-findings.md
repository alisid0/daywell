# Daywell: open findings and next steps

**Created:** Monday 5 October 2026, 17:08 BST (16:08 UTC)
**Repository:** [alisid0/daywell](https://github.com/alisid0/daywell)
**Prepared by:** Claude (Claude Code), after a review of `main` at commit `8751e74`

This is the list of what's done, what's waiting, and what still needs a decision. Dates and prices are as of the creation date above. Prices change, so recheck them before relying on them.

---

## 1. Done today

| Pull request | What it changed | Status |
|---|---|---|
| [#1](https://github.com/alisid0/daywell/pull/1) | Guided Move routines (70 exercises, 17 routines); `content/` folder for companions, recipes and workouts, checked on every pull request | Merged; tried end to end in the app |
| [#2](https://github.com/alisid0/daywell/pull/2) | Talk button states: listening bars, thinking dots, speaking rings, mic refused; companions react | Merged; not yet tried in a real voice conversation |
| [#3](https://github.com/alisid0/daywell/pull/3) | Bottom bar: Today · Move · Eat · Sleep · Relax; everyday extras on Today | Merged |
| [#4](https://github.com/alisid0/daywell/pull/4) | Last-7-days calendar strip on every tab; per-area history | Merged; tested with example data |
| [#5](https://github.com/alisid0/daywell/pull/5) | Security: Next.js 16.3.8 (critical advisory), capture and saved-data hardening, usage limits table | **Open**, ready to merge. Run `npm run setup` once after pulling |
| [#6](https://github.com/alisid0/daywell/pull/6) | Process: no new lint errors in changed files, dependency audit, Dependabot, PR template, README | **Open**, merge after #5 |
| This folder | ChatGPT handover for mascot illustration and animation, frame-assembly script, these findings | In review |

---

## 2. Decisions needed

1. **Monthly live-voice allowance.** Live voice (ElevenLabs agent) costs about $0.08 a minute plus the AI model, roughly $0.10 a minute in total. Today the only limit is 6 starts per 10 minutes, each up to 15 minutes. How many minutes a month should each person get, for example 30 free and more on a paid plan?
2. **Delete account and data.** People can export their history, but can't delete their account or data. This is needed before launch, because wellbeing logs count as health data under privacy law.
3. **Hosting and sign-in.** Either OpenAI's hosting, where people sign in with ChatGPT accounts (the current setup), or Cloudflare with Daywell's own sign-in.
4. **Subscriptions.** Price and plan structure. At about $10 a month of voice per average user, a $5–8 subscription loses money unless voice is capped and recorded clips are used first.

## 3. Ready for a preview (visible changes)

Each starts as an interactive before-and-after, built only after approval.

1. **Explore leftovers.** Home still has an **Explore** button, and the welcome screen still says "Explore: Choose Move, Relax, Eat or Sleep". Both now live in the bottom bar.
2. **Header tidy-up.** Move "Your style" into settings, and hide the `/designs` preview pages before launch.
3. **Day summary on Today**: steps, movement, meals and sleep as plain facts, plus one suggestion for the time of day.
4. **Voice privacy notice on first tap**, instead of fine print under the Talk button.
5. **Move: "For right now"**: three routines picked for the time of day, with a "See all" link.
6. **Bigger tap targets and a set type scale** across screens.
7. **Clip-first replies**: answer common moments with the 500 recorded clips before starting a paid live conversation.

## 4. Waiting on something

1. **Mascot portraits and animations.** Follow `2026-10-05-mascot-animation-chatgpt.md` in this folder, then hand the zip back for Part 6.
2. **Listening bars that follow your real voice level**, instead of a set animation.
3. **Food photo flow**: identify the food, confirm portions, look up nutrition (USDA FoodData Central, Open Food Facts for barcodes). Needs an OpenAI API key and a free USDA key.
4. **Step counting.** Needs Daywell wrapped as a phone app (for example with Capacitor) to read Apple Health and Health Connect. This would also give alarms real notifications.

## 5. GitHub settings only the owner can change

1. **Protect `main`:** require the "Check Daywell" check to pass before merging (Settings → Branches).
2. **Automatically delete branches after merging** (Settings → General).
3. **Merged branches still on GitHub:** `feature/move-routines`, `feature/mic-button-states`, `feature/bottom-bar`, `feature/calendar-strips`. Safe to delete.

## 6. Technical debt

| Item | Detail | Plan |
|---|---|---|
| Lint | 61 problems (52 errors, 9 warnings), mostly broad `any` types and older React hook patterns | #6 stops it growing; pay it down a file at a time |
| Development tool advisories | 25 in development-only dependencies (16 high, 8 moderate, 1 low), for example Wrangler and Drizzle Kit. They don't ship to users | Dependabot (#6) proposes updates; major versions need a manual check |
| Full-app testing in Claude's environment | Cloudflare's local runtime crashes when started from Claude's sandboxed shell, but works from the owner's own PowerShell | Owner runs `npm run setup` and `npm run dev` for end-to-end checks |
| Readability | Several files put whole functions on one line, which makes review harder | Format files as they're touched |
| Automated UI tests | Logic is tested (62 tests with #5); screens aren't | Add a few browser tests for the main flows |

## 7. Launch readiness

- [ ] Hosting and sign-in decided (section 2.3)
- [ ] Subscriptions and voice allowance (sections 2.1 and 2.4)
- [ ] Privacy policy, terms, "not medical advice" notice, delete account and data
- [ ] Error monitoring and database backups
- [ ] Review the 500 recorded clips and 3 guided sessions before public release, and confirm they were generated on a paid ElevenLabs plan (needed for commercial rights)
- [ ] Phone app wrapper for steps and notifications (later phase)

## 8. Suggested order

1. Merge #5, run `npm run setup`, then merge #6.
2. Decide the voice allowance, and add it.
3. Preview the Explore leftovers and header tidy-up together.
4. Mascot portraits through ChatGPT, then bring the key poses into the app.
5. Day summary on Today, and clip-first replies.
6. Launch items: hosting and sign-in, delete account, privacy and legal, monitoring.
