# Connected Food basket: app flow and backend contract

This closes the first food-system foundation in the [mobile release plan](mobile-release-plan.md): authenticated persistence and consistent stock, plans, shopping and cooking operations. The Eat screen now uses this system through **Food basket · Next meals · Shopping**, with a direct `/eat` entry point. First mobile builds, production identity/hosting, reviewed ingredient-photo assistance and a larger reviewed recipe collection remain outstanding.

The new `/api/food` endpoint uses the existing server authentication boundary. A trusted production identity gateway is still required; this work does not make client-supplied identity headers safe on a public deployment. No provider keys, AI calls or new paid services are involved.

## What works

- Ingredient lots have a name, quantity (or explicitly unknown), unit and optional user-entered date. Nothing guesses expiry or food safety.
- Kilograms/grams and litres/millilitres convert explicitly. Count, portions, mass and volume remain separate. A small explicit alias list merges names such as egg/eggs; different preparations or varieties are not fuzzy-matched.
- Each planned meal stores its own reviewed ingredient quantities for all its servings. Adding, changing or removing it recalculates demand without consuming stock. A reviewed two-, three- or seven-day window can be replaced atomically while retaining meals outside it.
- The overview distinguishes known stock, planned demand, reserved stock and stock available for other meals. Unknown or incompatible stock returns a `needsCheck` flag and an unknown shopping amount when it could cover a shortage. Known sufficient stock needs no extra question.
- Generated food shopping is derived from all pending plans; it is not a second editable inventory. Household notes remain a separate manual list. Completing a note alone does not create food.
- Purchases add the actual amount bought. A larger pack increases available stock; it is not limited to the recipe's shortage. Unknown existing amounts and differently dated lots require a new lot or a reviewed correction.
- Cooking deducts explicitly confirmed amounts, supports partial servings and leftover portions, and saves a normal food journal entry visible through the existing calendar. Nutrition is marked unknown. The remainder of a partially cooked plan stays reserved.
- Using ingredients reserved for other meals requires the explicit `useReservedStock` acknowledgement. The resulting shortage appears in shopping.
- Undo of a purchase/cook restores its stock and plan changes. Cooking undo removes the exact journal entry in the same transaction. Changed stock, reused lot IDs, edited/deleted journal entries and already-undone operations refuse unsafe undo. There is no silent stock adjustment from the old journal editor.

## Reading and saving

`GET /api/food` returns `revision`, `state`, `overview` and the latest 50 action summaries. Responses are not cached. Data and receipts are scoped to the server-authenticated user; the body cannot select another user.

Every `POST /api/food` carries a client-generated unique `operationId`, the last loaded `expectedRevision` and a strict `action`. For example:

```json
{
  "operationId": "a-unique-purchase-id",
  "expectedRevision": 0,
  "action": {
    "type": "purchase",
    "items": [
      { "id": "rice-pack", "ingredient": "Rice", "quantity": 0.5, "unit": "kg" }
    ]
  }
}
```

Supported actions are `stock.set`, `stock.remove`, `plan.set`, `plan.window`, `plan.remove`, `shopping.set`, `shopping.remove`, `purchase`, `cook`, and `undo`. Their exact request shapes are in [`lib/food.ts`](../lib/food.ts). `plan.window` takes `startDate`, `days` (2, 3 or 7) and the complete reviewed replacement `plans` for those dates. An empty replacement clears that window only. Recipe generation and automatic dietary suitability checks are not implemented here.

Successful saves return `{ ok, revision, replayed }`. Refresh the food space afterward. The returned revision on a replay belongs to the original action, so never replace newer client state with it. Preserve the original command and operation ID for an uncertain network retry. Reusing an ID with a changed command is a conflict, not a new save.

A stale revision returns HTTP 409. Keep the user's draft, reload the current records and ask them to review the changed facts. **Do not silently change the revision and resubmit a stale stock count.** Invalid input returns 400, missing sign-in 401, rejected origin 403, oversized data 413, and storage failure 503. The route reads at most 32,000 body bytes regardless of Content-Length and does not log private request contents.

Quantities accept at most three decimal places in the entered unit; stored amounts round to three decimal places in the base unit. Dates are explicit calendar dates, independent of server timezone. There are ceilings of 400 stock lots, 365 pending meals, 500 manual shopping notes and 1.5 MB per food snapshot. Cooking respects the existing 20,000 journal-entry ceiling. Action receipts are retained separately for reliable retries and undo; include both new tables in future account export/deletion, backup and retention work. Large-scale archiving, history pagination and offline conflict resolution remain future work.

## Atomic saves and migrations

Migration `0002_food_inventory.sql` adds `food_spaces` and `food_operations`; `0003_food_history_index.sql` adds the per-user revision index for bounded history reads. They do not rewrite existing settings, groceries or journal entries. Do not automatically import old free-text groceries as confirmed stock. On another checkout, run the existing `npm run setup` workflow once; repeated database setup is safe.

One database batch commits the revision-checked snapshot, operation receipt, journal effect and undo marker. A unique internal write token keeps losing concurrent requests from applying side effects. A receipt also stores the canonical request hash: duplicate requests replay, while conflicting use of an ID is rejected. A failed journal insertion rolls the entire action back. This relies on [D1's documented transactional batch behaviour](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).

The test suite runs the actual queries against SQLite with transactional batches. It covers isolation between two users, concurrent saves/retries, reused operation IDs, partial cooking, leftovers, changed journals, rollback, unknown quantities, unit compatibility and HTTP guards. A separate local D1 smoke run exercised the real route and current development sign-in. Hosted identity, production D1 and native devices have not been verified by these tests.

## Connected frontend — 7 October 2026

The selected Cosy cove appearance and the owner-reviewed **Food basket** navigation are now implemented. The preview was reviewed on 6 October and the owner requested continued implementation on 7 October. Nori accompanies the Eat heading; existing meal history and calendar remain available.

1. **Food basket:** add or adjust individual packs, including an explicitly unknown amount and an optional label/reminder date. Separate packs can have separate dates. Display total confirmed/reserved/free amounts across matching ingredients without claiming an unknown amount is zero.
2. **Next meals:** choose a starting date and a two-, three- or seven-day view. Create your own meal or review one of the three existing recipe ideas. Servings scale editable ingredient totals. Ingredient names and units are explicit; nothing automatically changes dietary substitutions or infers pack weights. Saved plans outside the selected dates are retained and included in shopping, with a link to view them.
3. **Shopping:** see only shortfalls from all saved plans. Uncertain stock asks for a check instead of a guessed purchase. Record the full pack actually bought as a separate lot. Household notes and the earlier shopping list stay separate; their completion never creates stock.
4. **Cooking:** use “I made this”, choose servings actually made, then review real quantities used and any substitutions. Earlier-dated known lots supply starting suggestions, which remain editable. Confirm using stock reserved for other meals explicitly. Record leftover portions if wanted. Saving updates stock, any remaining planned servings and the normal meal journal together. The existing calendar displays the cooked record; pending food plans are currently viewed in Next meals, not the general calendar.
5. **Undo:** recent purchases and cooking can be reversed after confirmation, subject to the backend's later-edit protections. Editing/deleting a journal note alone does not restore stock.

The food hook lives with the app controller, so moving between Daywell areas keeps a draft. It warns before unloading an unsaved form; it does not persist unsaved details through a forced reload, tab closure or crash. Unknown save outcomes retain the exact command for a safe explicit retry and temporarily disable other food mutations. HTTP 409 keeps the draft, refreshes saved facts and requires an explicit review before another save. A failed refresh leaves mutations disabled until a fresh read succeeds. The global save indicator includes food activity and unsaved drafts.

`lib/food-planning.ts` contains editable starting quantities for the three existing recipe ideas, not personalised nutrition advice or an automatically validated dietary plan. The main host and photo-capture endpoint do not yet write this inventory; their proposals must use a separate review step before integration.

## Verification and remaining scope

The automated suite now has 100 passing tests. Additional client tests cover ambiguous responses, exact-command retries, conflict handling, snapshot validation, matching known lots and recipe quantity scaling. Type checking and the production web build pass; existing bundle-size warnings remain.

A Chromium walkthrough against the real local development server and D1 database verified unknown stock, a three-day plan, a larger pack purchase, an intentionally lost successful purchase response and idempotent retry, partial cooking, leftovers, the meal journal, undo, two-writer conflict review, draft preservation across app areas, reload persistence and widths of 320, 390 and 1280 pixels. The walkthrough created uniquely named QA records and removed only those records, checking that the pre-existing food state was unchanged. This is desktop browser emulation, not Android/iPhone device evidence.

Still required for launch: ingredient-photo review and corrections; hosted identity and per-user online testing; account export/deletion covering both food tables and receipts; broader recipe/editorial review; native keyboard, screen-reader and device walkthroughs. No hosting deployment, live AI/voice changes or paid calls are part of this implementation.

## Connected shopping and recovery — 8 October 2026

This checkpoint supersedes the earlier frontend limitations above. Spoken and older grocery notes now appear in the main Shopping view and can be attached to reviewed actual-quantity purchases. No old note becomes inventory automatically. Food drafts and pending save commands can be restored after a reload under the same account, with browser-storage warnings, explicit review and stale-tab protection. Next meals exposes a multi-day review editor, and original planned meals now appear in the calendar.

Shopping still includes all saved plans; photo assistance, personalised plan generation, workout recovery, hosted identity, native devices and complete account lifecycle are not included. See the [implementation and test handover](handover/2026-10-08-connected-food-recovery.md) for the 115-test checkpoint, browser evidence, setup and remaining work. No new database migration or dependencies are required.
