# Talk picker: recorded replies first, live AI only when nothing fits

Owner direction, 8 October 2026. Talking to Daywell should feel like a conversation, yet most turns should cost almost nothing, much as Siri handles common requests on its own. Concept page: https://claude.ai/artifact/HQEREJ3ekmY77QWiiNTb62 (the owner's private link).

## How one turn should work

1. **Hear.** The phone's own speech recognition turns speech into text, at no cost.
2. **Safety check.** Daywell's own rules handle urgent and medical requests first, also at no cost. This step must not depend on the picker.
3. **Everyday commands** such as "start a walk" or "add milk" are handled directly, at no cost.
4. **Pick.** Jev (TypeSafe AI) chooses from approved options only: a library topic, then the best reply within it, or "none fits". Jev can't write text, and each pick costs well under 0.01p.
5. **Answer.** Daywell plays the recorded reply and offers a next step. It starts a live ElevenLabs conversation only when nothing fits. Live voice costs about 6–8p a minute.

Each week, the most common requests that still needed live AI become new drafted replies. The owner approves them, and each is recorded once for about 2p. Live agent replies are never replayed word for word.

## Run the accuracy test

The test sends about 90 made-up sentences, with no personal data, and compares Jev with a free keyword matcher. It costs about 3 cents. It needs Node 22.13 or later and a TypeSafe key from console.typesafe.ai.

1. **Store the key privately.** Never put it in chat, GitHub or a committed file.

   On Windows PowerShell, this prompt hides the key as you paste it:

   ```powershell
   $k = Read-Host "Paste your Jev key" -AsSecureString; [Environment]::SetEnvironmentVariable("TYPESAFE_API_KEY", [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($k)), "User"); "Saved."
   ```

   Open a new terminal afterwards so the variable is picked up. On macOS or Linux, use `read -s TYPESAFE_API_KEY && export TYPESAFE_API_KEY` in the terminal that will run the test.

2. **Run the test** from the repository folder:

   ```sh
   node --experimental-strip-types scripts/jev-picker-test.mjs
   ```

   Add `--baseline-only` to run just the free matcher.

3. **Read the results.** The summary prints in the terminal and is saved with every answer in `work/jev-picker/`, which git ignores. It reports:
   - how often each matcher picks a good topic
   - how often Jev correctly says nothing fits
   - accuracy at confidence 0.5, 0.6 and 0.7, and how many confident mistakes each threshold allows
   - speed, tokens and cost
   - the replies Jev chose for the owner's four examples

   The test sentences, with the topics that count as right, are in `scripts/jev-picker-phrases.mjs`.

## What counts as good enough

- Jev picks a good topic for at least 80% of everyday sentences, and says nothing fits for at least 80% of off-topic requests.
- At the chosen confidence threshold there are no more than 3 confident mistakes.
- A turn usually takes under a second.

If Jev falls short, compare it with the free matcher and with a small OpenAI model before deciding.

## Results so far

Recorded 8 October 2026, free matcher only. Jev has not been run yet.

| Library | Picks a good topic | Says nothing fits when it should |
| --- | --- | --- |
| main, 1,500 replies | 48% | 50% |
| #32, 1,417 replies | 49% | 42% |

## Before real people's words go to Jev

- TypeSafe's public API documentation doesn't say how long it keeps inputs or whether it trains on them. Check their terms and data processing agreement, including UK transfers.
- Name TypeSafe on the privacy page.
- Jev launched in early access on 15 September 2026, and independent testing found that planted text can steer its choice while it still reports high confidence. Keep safety decisions in Daywell's own rules, keep every pickable option pre-approved, and keep the free matcher as a fallback.
- Picks are paid API calls, so they count towards usage limits ([usage limits](usage-limits.md)). Give them a generous daily allowance.
- Build the Talk flow after PR #32 merges, because both change the Talk and chat code. Show a preview of the real screens first.

API reference: https://docs.typesafe.ai/api
