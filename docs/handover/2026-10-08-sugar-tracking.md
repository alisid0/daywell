# Optional sugar logging

Session date: 8 October 2026. Branch: `codex/connected-food-recovery`, [PR #32](https://github.com/alisid0/daywell/pull/32). The PR head identifies the published checkpoint.

## Behaviour

- Users can record optional **total sugar consumed**, in grams, for their own portion(s) of food or drink. This works in direct meal notes, Food basket consumption and cooking's personal-intake review, independently of calories and macros.
- The value is entered for the whole personal intake in that entry; portions do not multiply it again. Blank stays unknown, explicit zero is known, and clearing a saved amount removes it. Prepared/used-only food stays outside consumed totals. Older records are not backfilled with invented sugar values.
- Eat shows **Your food today**, calories consumed and total sugar consumed. Move shows **Your movement today**, recorded minutes and optional activity calorie estimates. Selecting a past date changes the heading to a food/movement record.
- A collapsible seven-day sugar history ends on the selected date. Every day shows recorded-entry coverage, with missing days marked not recorded. Daily summaries also flag missing sugar amounts. This does not assert that a logged day covers everything the person consumed.
- Sugar appears in meal/history descriptions and therefore the existing history export. Connected-food drafts preserve it through reopening and uncertain-save retry. Optional schema fields are appended without changing old command hashes; old receipts remain replayable.

This tracks **total**, not separately added or free sugars. Label help cites the [NHS explanation of nutrition labels](https://www.nhs.uk/live-well/eat-well/food-types/how-does-sugar-in-our-diet-affect-our-health/#nutrition-labels-and-sugars): the label's sugars value covers sugars from all sources. No daily sugar limit, reduction prescription, medical claim, restriction score or exercise offset was introduced. Food recognition, automatic label scanning, per-100g conversion and spoken sugar logging are not part of this change.

## Verification

- `npm run check`: typecheck, **140 tests**, production build passed. The existing large-bundle warning remains.
- `npm run lint:changed`: 47 changed code files, no new lint errors. Whitespace/diff review passed.
- Regressions cover unknown versus zero, independence from calories/macros, personal portions, prepared/used exclusion, editing/clearing, validation, seven-day boundaries and coverage, recovery, stock/journal retry and undo, and pre-sugar receipt compatibility.
- Browser at localhost:5190: saved a sugar-only 12.5 g entry, reloaded, verified daily/history totals and source, edited to zero, then cleared the amount. Read back through the API confirmed the stored field was absent after clearing. Removed only this session's synthetic entry; existing records remained intact.
- Basket draft: entered 7.2 g without calories, reloaded, continued the recovered draft and verified the amount. Cancelled without consuming stock. Verified separate Move summary. Checked summary/form at a 390px browser width with no horizontal overflow, then reset the viewport. This is responsive browser testing, not a physical phone test.
- No paid AI/audio calls, live-agent changes or hosted deployment in this session.

## Next machine

Fetch PR #32 and follow the repository workflow before editing. No new dependencies, lockfile updates or migrations are needed; fields use the existing JSON records. Keep local credentials and user data local. The preview is `http://localhost:5190/eat`; the separate port-5184 checkout remains unchanged. This branch still needs review/merge and a separate hosted release. Ignored runtime files and screenshot evidence stay local.
