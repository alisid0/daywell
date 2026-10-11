# Food used, food eaten and activity estimates

Session date: 8 October 2026. Continuing the connected-food feature on `codex/connected-food-recovery`, PR #32. The current PR head is the published checkpoint.

## What changed

- Food basket has **I ate / used some** for confirmed stock, including leftovers. Users enter the amount actually used in the basket's unit. This updates stock and its journal entry atomically, respects other meal reservations unless explicitly overridden, and supports receipt-based retry and undo.
- Cooking is **prepared**, not automatically personal intake. An optional **I ate a portion** section records personal portions, optional calorie total, source and optional macros. The rest can belong to other people or leftovers. Personal portions plus leftovers cannot exceed servings made. Calories entered are already the total for the personal portions; the app does not multiply them again or infer nutrition from inventory amounts.
- Meal notes distinguish **eaten**, **prepared** and **used**. Only eaten entries contribute to intake. Editing a note never deducts stock again. Unknown calories/macros remain visibly unknown; confirmed zero is distinct. Older entries without the new fields retain their previous meaning, without rewriting historical data.
- Walks and strength sessions support optional activity calories and a user-selected source: estimate, watch/tracker, exercise machine or another app. Clearing a calorie value preserves the activity. These are manually entered estimates, not automatic wearable connections or total daily energy expenditure.
- Eat and Move show separate daily food and activity totals with date selection and counts of entries missing estimates. There is no net-calorie target, exercise credit or instruction to compensate for eating. Existing optional calorie-goal preferences are unchanged.
- Meal/movement history and calendar/export descriptions carry the new details. The existing home food summary excludes prepared/used entries and no longer presents unknown macros as confirmed zero.
- Cook commands retain their previous parsed field order, preserving hashes for interrupted saves authorised before this upgrade. New fields are optional and stored in existing JSON records; no dependency or database migration changes.

## Verification

- `npm run check`: type checking, 135 tests and production build passed. Build retains the existing large-chunk warning.
- `npm run lint:changed`: no new lint errors, including the new tracking modules/tests.
- Regression tests cover personal portions versus household servings, legacy entries, missing versus zero values, date filtering, separate totals, validation limits, draft recovery, basket-use retry/undo and reservation conflicts, and replay of pre-update cooking receipts.
- Browser tests on the local QA account: added four test apples, used two and recorded a total of 160 kcal; verified two remained and no portion multiplication occurred. Recorded a 90 kcal activity with watch source, reloaded and verified both totals/history. Undo restored four apples and removed its meal/intake. A separate half-portion meal preserved its entered total; editing it to prepared removed it from intake. Clearing the activity estimate preserved the activity as unknown. New test entries and stock were cleaned up via the app API; older records were preserved.
- Verified the new summary at a 390px desktop browser viewport. This is responsive-layout evidence, not a physical phone test. Temporary viewport override was reset.
- Local preview: `http://localhost:5190/eat`. The separate 5184 checkout and its credentials/data remain untouched.

## Limits and handover

No new AI calls, audio generation, live-agent changes, deployment, clinical advice, calorie prescriptions or health claims were added. Nutrition and activity estimates are supplied/reviewed by the user. Automatic food recognition, barcode lookup, wearable imports, per-100g conversion and individual nutritional targets are not implemented by this batch. Unknown historical meals remain editable rather than being guessed or retrospectively relabelled.

The original basket undo guard still refuses to overwrite a subsequently edited/deleted journal entry or changed stock. Review and correct the basket in that case. This protects later edits; deleting a note is not a basket undo.

Fetch PR #32 on the other machine and follow README setup/checks. No additional migration, lockfile regeneration or credential sharing is needed. Review/merge remains separate from publication. No hosted or native release is claimed. Only ignored runtime data, test logs and screenshots remain local; implementation and this handover belong on the PR.

## Wording and preview cleanup follow-up

The owner requested **Calories consumed** in place of **Calories eaten**. The daily summary, calorie input and related helper copy now use consumed; the entry button reads **Log food or drink**. This is display wording only: stored status values and calculation/retry behaviour are unchanged.

Removed the single leftover `qa connection-test lentils` stock fixture from the local 5190 preview through the normal revision-checked food API. It had no dependent meal plans. Verified all other stock, plans and shopping notes were unchanged; no user records or database files were cleared. Refreshed the browser and verified the item was absent and the new label visible. This local cleanup is separate from source publication and is not a migration of customer data.

Validation: 135 tests, typecheck, production build and changed-file lint passed. No new tests or dependencies were needed for this text correction.
