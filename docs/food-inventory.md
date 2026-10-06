# Connected food inventory: backend contract

This closes the first food-system foundation in the [mobile release plan](mobile-release-plan.md): authenticated persistence and consistent stock, plans, shopping and cooking operations. It does **not** replace the existing Eat screen yet. The first mobile builds, production identity/hosting, photo review, recipe selection and frontend integration remain outstanding.

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

## Frontend handoff

Keep the selected Cosy cove style. The proposed Eat structure is **Food basket · Next meals · Shopping**, with the meal journal/calendar retained. The owner chose **Food basket** as the user-facing name on 6 October 2026; use that label consistently in future screens. Build and approve an interactive before/after preview under the repository's existing preview-first workflow before replacing the visible screen.

The UI must review ingredient recognition and uncertain quantities before saving; show actual purchased packs and actual cooking usage; explicitly confirm using another meal's reserved stock; preserve drafts on failure; and never infer calorie values from a stock deduction. Expand the curated recipe collection and store reviewed quantity snapshots when creating plans. The main Daywell host can propose these actions later, but it must not bypass confirmation.

The next deliverable is the connected Eat frontend, followed by reviewed ingredient-photo assistance. Do not describe this backend checkpoint alone as a finished meal planner or a completed mobile launch milestone.
