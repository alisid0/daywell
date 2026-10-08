# Food, Move and kettlebell checkpoint — 8 October 2026

Branch: `codex/connected-food-recovery`, [PR #32](https://github.com/alisid0/daywell/pull/32). Starting checkpoint: `60463c6`. The PR head identifies the published result. This is feature-branch work, not a merge or deployment.

## The two workflows

**Food:** picture or speech → review ingredients and amounts → Food basket → estimated coverage for individual meals → reviewed meal plan and missing shopping → actual purchase → confirm food used, personal consumption and leftovers → history/undo. Restaurant and takeaway meals go through reviewed portion/nutrition estimates, without deducting home stock. Calories consumed and optional sugar records are distinct from stock use. Unknown quantities and nutrition must remain unknown. Coverage is not a promise of complete days of nutrition or freshness.

**Move:** choose a routine → Bounce gives one step at a time → optionally hear a cue or give a bounded voice command → confirm completion, skip, rest or end → review actual reps/time/load → save movement history. No workout camera is required. Activity calorie estimates are optional and separate from food; no exercise-to-offset-food target.

These definitions are settled. They are not evidence that both workflows are ready for public launch.

## Added in this session

- `One kettlebell, steady strength`, visible among the first routine choices. About 15 minutes, adjustable by the person: marching/hinge warm-up, then two short circuits of deadlifts, goblet squats and separate left/right carries. One bell; no ballistic or overhead exercise in this routine.
- Setup and original short technique cues, bodyweight alternatives, and no default prescribed bell weight. The setup explains that Bounce cannot check form and that unfamiliar technique needs qualified instruction.
- Optional 45-second rest phases between steps. The timer can be paused/restarted; finishing the timer does not force the next movement. Ready/Next ends rest without completing the upcoming exercise. Ending in rest records only completed exercises. Rest does not become a set or an activity-calorie estimate.
- Enter the actual kettlebell weight once before the normal review. It applies only to completed steps using that equipment. Warm-ups and unweighted substitutions stay at zero added load. Individual sets remain editable before saving.

The routine is Daywell-authored, not an ACE-approved programme. Technique references: [ACE getting started with kettlebells](https://www.acefitness.org/resources/pros/expert-articles/5269/how-to-get-started-with-kettlebells/) and [ACE kettlebell training guidance](https://www.acefitness.org/continuing-education/certified/october-2022/8147/kettlebells-kick-butt-in-more-ways-than-one/). These support technique-first progression and practising unfamiliar movements before adding load. They do not validate our specific timings, calorie estimates or suitability for every person. Qualified fitness content review and clear movement demonstrations remain public-release work.

## Biggest remaining gaps, in priority order

| Priority | Gap and current evidence | Completion evidence needed |
| --- | --- | --- |
| 1 | A dependable hosted app usable away from the development computer. Cloudflare account exists; the private hosting PR #31 remains a separate draft. A localhost preview does not establish a working hosted service. | Approved deployment permissions, protected HTTPS address, separate-account isolation, persistence and recovery tested on real phones. |
| 2 | Food's real AI connection. Local configuration was checked for key presence only: ElevenLabs key present, `OPENAI_API_KEY` absent. Capture/planning and manual review code exist; live recognition is not verified here. | Server-only OpenAI configuration, then real photo/voice → clarification → review → basket/meal tests, including portion uncertainty, corrections, labels, restaurant meals, retries and service limits. |
| 3 | Expressive workout coaching. The routine player uses browser speech; the ElevenLabs conversation is separate. | Coaching tied to the current step and actual completion, reliable stop/pause/skip, no duplicate writes, bounded paid usage, microphone-denial and interruption tests. Preserve the general-wellness boundary. |
| 4 | Workout quality and continuity. There are routines, history and editable sets, but cues are text-only, and in-progress player state is local component state. Older multi-set routines still need finer per-set confirmation/partial-set review. | Qualified content review, optional clear exercise demonstrations, controlled per-set progression, durable resume and screen-lock/headphone/call tests. Never imply camera-based form checking. |
| 5 | Data/privacy and release integration. PR #34 is a separate draft with Your data foundations and policy proposals; documents are not implemented enforcement. | Reviewed export/deletion across providers, appropriate image handling, retention and consent implementation, tested account lifecycle. Integrate approved branches deliberately with passing checks. |
| 6 | Store-ready Android/iPhone product and payments. Google account reported ready; Play eligibility and Apple enrolment are not established by that statement. | Signed mobile builds, actual device evidence, account verification, store billing/restore/server entitlements, review materials and rollout plan. Confirm the working 5 November review target. |

Recommended next engineering milestone: a protected hosted version with working food photo/voice interpretation, followed by the complete food journey on an Android phone. Movement's live-agent coaching can then be tested against that same authenticated backend.

## Verification and handover

- `npm run check`: passed typecheck, all 162 tests and production build. The existing large client-chunk warning remains.
- `npm run lint:changed`: passed with no new lint errors.
- Browser: checked the visible routine, setup, rest pause/expiry, skip, and ending during rest. A zero rest timer waited for the user. Review contained only completed exercises, excluded skipped/upcoming steps, required the bell weight, and applied it only to weighted sets. Left/right carries reached review separately. The existing Desk break still advanced without a new rest phase. Cards, carry controls and the weight form fit a 390px viewport. No workout was saved to the user's journal during these checks.
- Added regression coverage for equipment loads, separate carry sides, skipped exercises and unweighted substitutions. Existing content/schema tests validate the complete catalogue.
- No dependency, database migration, provider configuration or deployment changes. Keep local credentials and records in place. Fetch the branch, run the usual checks, and use the existing preview. At `http://localhost:5190/`, select **Move**, then **One kettlebell, steady strength**; there is no standalone `/move` route.
- Not verified: spoken audio quality, microphone commands on physical devices, live ElevenLabs workout coaching, hosted persistence, store builds or fitness content sign-off. Existing history-save tests are distinct from this session's browser checks, which stopped before Save workout.
