# Handover: Plus assistant, receipt photos and talking (22 October 2026)

```text
Session date: 22 October 2026
Branch and PR: feat/plus-assistant, from main 47a7466. PR to main. Not deployed.
What changed:
  - The owner chose ideas 3, 5 and 9 from "Daywell: where AI can help" and approved the canvas "Plus assistant,
    receipts and talk" ("approved", with a budget for test calls, 22 October). Its assumptions stand: OpenAI gpt-4.1-mini,
    the four areas below, no chat kept, its own branch, not the store build.
  - The Plus assistant (lib/assistant.ts, app/api/assistant/route.ts, app/assistant.tsx, app/use-assistant.ts). One
    assistant speaks as Nori, Bounce, Luma or Pip. It reads only the areas the person turned on (meals and kitchen,
    moves, sleep, plans and to-dos), field by field: never About you details, nutrition numbers or notes. The first
    question opens "Let Daywell look at your day?": the switches start off (UK GDPR wants a clear yes for health
    records) and agreeing is saved with its time in the new settings assistantAreas and assistantConsentAt. The server
    reads only what the saved choice allows. Replies say what they looked at, can be reported, and offer up to three
    next steps. Changes come only as "Here's the plan" (meals for the food space, calendar plans, to-dos, trolley
    notes); lines can be left out; Do this saves them together and Undo reverses them, meals included. The
    conversation lives in the page's memory and is forgotten when the chat ends or the page closes.
  - It replaces the ElevenLabs chat in the host: the host no longer starts ElevenLabs conversations. Everyday commands
    and recorded replies still come first; anything else, and requests that need fresh understanding, go to the
    assistant; "What can I cook?" goes to it instead of the meal-plan capture. use-eleven-agent.ts, /api/voice,
    lib/host-input.ts and lib/voice-tools.ts are now unused by the app and can go in a clean-up PR.
  - Receipt photos (lib/receipt.ts, app/receipt.tsx): "Back from the shops?" on the Trolley. OpenAI reads the photo in
    a new capture mode, receipt (it counts as a photo check). Daywell matches lines to the trolley list on the device
    (lib/receipt.ts matchList), suggests where each food goes, leaves off what isn't food, counts unreadable lines,
    then saves one purchase with Undo and shows "All 8 put away".
  - Talking (app/use-host-voice.ts): Talk to Daywell shows the words as they're heard, sends at a pause or with Send
    now, reads replies a sentence at a time in the device's own voice with the sentence marked, and listens again
    after each reply while talking. Daywell's voice, its speed, reading aloud and keep listening are chosen in Voice &
    company and kept in the browser.
  - Supporting changes: food saves can choose their operation ID and skip the notice (app/use-food.ts); planned meals
    added together can now be undone (lib/food.ts undoableActions gains plan.add); photo shrinking is shared
    (app/photo.ts); a 300-a-day assistant cap only stops scripts (lib/request-guards.ts); docs updated (usage limits,
    data inventory, picture and voice workflow, response routing).
Checks performed and their results:
  - npm run check: type check clean, 319 of 319 tests pass (new: tests/assistant.test.mjs, tests/receipt.test.mjs;
    updated: onboarding, profile guard, AI consent wording), build complete.
  - npm run lint:changed: no new lint errors.
  - Preview harness (fix-harness, phone size, canned replies, no provider calls): the trolley card, reading a receipt,
    changing an amount and leaving one out, Put 8 away, Undo; the first question and consent sheet, an answer with
    chips, Here's the plan, Do this (a meal in the food space and a walk on the calendar), Undo of both; Voice &
    company and Daywell's voice; talking with a pretend microphone and voice (listening, sending at a pause, the
    reply read a sentence at a time, listening again, End the chat); a dark look.
What is not yet verified:
  - Real OpenAI replies and receipt reading: the key is only on the deployed app.
  - The assistant needs the person's own yes before it reads records, so its first real try is the owner's.
  - A real phone. The phone apps need a native speech plugin for talking (a store build); until then they type.
Remaining work / next step:
  - Merge only on "merge"; deploy to the private app only when asked. Then try it there, within the test-call budget.
  - Later: remove the unused ElevenLabs chat code; the native speech plugin for the phone apps; Plus checks when plans
    exist (the assistant and receipt photos are Plus features, but there is no plan check in the code yet).
Setup or migration steps needed on the other machine:
  - None. The two settings are optional with defaults; no database migration. OPENAI_API_KEY is already set on the
    private app.
Any work still local, and why:
  - None in the repo. The preview harness, its canned replies and capture plan are local tools, outside Git.
```
