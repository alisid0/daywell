# Basket-to-meal planning handover

Session date: 8 October 2026.

Branch: `codex/connected-food-recovery`; [PR #32](https://github.com/alisid0/daywell/pull/32). The PR head is the published checkpoint. GitHub remains the shared source of truth; this session does not merge or deploy it.

## What changed

- Added a one-person meal-planning request to the existing picture/recorded-voice capture flow. It uses the authenticated person's saved basket and reservations, structured AI output, bounded meal counts, locally assigned dates and an explicit review before saving.
- Added ingredient coverage across a whole proposal, accounting for existing reservations, matching units and unknown amounts. Four eggs and 150 g dry noodles cover two proposed meals of two eggs and 75 g noodles each, assuming none is already reserved. This is a meal count, not a food-safety or whole-day nutrition claim.
- Added an additive `plan.add` operation, preserving existing plans. It uses the existing transaction, revision, retry, undo and account-scoped draft recovery system. No database migration is needed.
- Added persisted cooking steps and optional calorie estimates per serving. The existing three recipe ideas and an optional egg-and-noodle shortcut use the same review without an AI connection. They do not invent calorie values.
- Preparing or planning food does not count as consumption. Matching planned ingredients can prefill an estimate only after the person chooses to record intake. Ingredient edits clear stale nutrition; personal portion changes scale totals. Fractional leftovers are supported.
- Meal capture includes home/takeaway/restaurant context and half/double portion corrections. Known nutrition scales together; unknown sugar stays unknown. There is no menu database lookup or automatic basket deduction from a meal photo.

## Verification

- `npm run check`: passed TypeScript, **159 tests**, and production build.
- Scoped lint: passed, including the new planner components/helpers/tests.
- Real local browser and database flow: temporary basket ingredients, ingredient reservations, review and save of two meals, cooking one meal, a half-portion intake, and undo. Saving plans left calories consumed unchanged; the cooking record used only the confirmed stock quantities and personal portion.
- Temporary stock, plans and intake created during that flow were removed through the normal food operations. The final food state was asserted equal to its pre-test state. Existing records were preserved; operation receipts remain as the normal audit trail.
- Browser draft reload/continue verified with a recipe proposal. Mobile layout checked at 390 px and narrow-screen dimensions; saved screenshot evidence stays in ignored local work files.
- Automated cases cover double allocation, reservations, aliases, unit differences, unknown quantities, duplicate/replayed saves, stale revisions, account isolation, retained guide metadata, draft recovery, portion scaling, fractional leftovers and legacy operation hashes.

## Not yet verified / next steps

The preview still reports that photo and voice understanding is not connected. The required server-side OpenAI connection is separate from ElevenLabs. No live provider recognition, transcription or generated meal-plan response was exercised in this session; tests use explicit sample provider output. Connect through the existing private configuration workflow, then review real ingredient photos, spoken corrections, menus and unclear portions on physical Android/iPhone devices.

The guided live ElevenLabs training partner, restaurant nutrition lookup and physical-device camera/microphone testing remain separate tasks. This is general wellness and food record keeping: no medical advice, clinical diets, freshness prediction or guarantee of nutrition accuracy.

## Other-machine setup

Fetch and fast-forward this feature branch only when its checkout is clean and GitHub checks pass. No dependency or schema changes were made in this session. Preserve ignored credentials and local records; never copy local data through GitHub. The active preview here is `http://localhost:5190/eat`.

Session code, tests and this handover are intended for the PR; private credentials, local databases, QA state and screenshots must remain ignored. See the final session message for the verified pushed commit and GitHub check status.
