# Handover: the Kitchen in Eat, part 1 (19 October 2026)

```text
Session date: 19 October 2026
Branch and PR: feat/eat-kitchen, branched from feat/eat-quantity-recipes (both pushed). No PR yet: GitHub isn't
  signed in on this PC's browser. Not merged, not deployed.
What changed:
  - The owner approved the "Kitchen, all in" design on 19 October (Design canvas, page "Kitchen, all in").
    It's built in three parts. Part 1 is:
    - the four places;
    - the shelves;
    - a food's card;
    - "I ate some";
    - adding food in three steps.
  - Eat's tabs became four places: Plate (opens first), Kitchen, Week and Trolley. Week and Trolley still show the
    earlier screens until part 2. The Plate shows the capture card, today's nutrition and the meal story until part 3.
  - Each food lot can say where it lives (fridge, freezer, cupboard, fruit and veg). It's an optional field, with no
    migration. Food without one goes where its kind usually lives, a top-up keeps its shelf, and a new pack follows
    the last one.
  - The Kitchen's actions save in one tap. Taking food out can be undone, and a toast above the bottom bar offers
    Undo.
  - "Cook ideas" and "Cook with it" open the recipe ideas card with a wish filled in. Nothing is sent until the person
    asks.
  - "Add by hand" in the capture card opens the three steps.
  - Food-specific icons where the icon set has one (an egg, leafy greens, a banana); otherwise the aisle's icon.
Checks performed and their results:
  - npx tsc --noEmit: clean.
  - node --experimental-strip-types --test tests/*.test.mjs: 280 of 280 pass. The 4 new tests are in
    tests/kitchen.test.mjs, and tests/dialog-colours.test.mjs now covers app/kitchen.css.
  - npm run build: complete. npm run lint:changed: no new lint errors.
  - In the preview harness (&kitchen adds a freezer and fruit), real screens were captured at phone size on
    7 October: every step of the journeys above, plus Move, Used it up with Undo, and Cook ideas. Also checked:
    larger text, tablet width, and the dark Moonlit den look (which needed look-aware colours, now done).
What is not yet verified:
  - A real phone and the deployed app.
  - Real recipe requests: the harness uses canned replies, and there are no paid model tests without approval.
  - GitHub checks: no PR yet.
Remaining work / next step:
  - The owner reviews the screens. Merge only on the owner's "merge".
  - Part 2: the Trolley tray, "Put it away" with a shelf per item (remembered), and the Week board.
  - Part 3: the Plate (tap a quarter, one gentle follow-up), the recipe card deck and cook mode.
  - Still open from 17 October:
    - make recipe ideas Plus-only once the plans branch merges;
    - should Today's shopping list make quantity optional too?
Setup or migration steps needed on the other machine:
  - No database migration. Run npm run install:ci.
  - Preview: use the harness from marketing/promo-v2 (marketing/promo/harness):
    - copy it into .harness/ in a checkout of this branch;
    - run node .harness/food/gen-css.mjs;
    - open ?view=eat&kitchen.
Any work still local, and why:
  - Only private, git-ignored files (keys, the deploy profile) and the screenshots of this preview. Like the older
    previews, the screenshots wait for a private home, which the owner chooses.
```

## Where everything is

| What | Where | State |
| --- | --- | --- |
| The Kitchen, part 1 | `feat/eat-kitchen` | Built; waiting for the owner's review and "merge" |
| Optional quantities and recipe ideas | `feat/eat-quantity-recipes` | Approved 19 October; no PR yet (GitHub not signed in) |
| Kitchen design (all 18 screens) | Design canvas, page "Kitchen, all in" | Approved 19 October |
| Preview harness, capture tool and board maker | `marketing/promo-v2`: `marketing/promo/harness` and `marketing/promo/tools` | `&kitchen` sample added |
| Everything else | See the [17 October handover](2026-10-17-eat-quantity-recipes.md) | Unchanged |

The owner's standing rules and the Windows notes are in the [17 October handover](2026-10-17-eat-quantity-recipes.md).
