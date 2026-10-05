# Daywell

A cosy home for Move, Relax, Eat and Sleep, with one host and a quiet place to pause.

Built with React, TypeScript, Vinext, shadcn/ui and Cloudflare D1.

## Four-area MVP

The selected **Cosy cove** is the default for new browsers; existing appearance selections are preserved. Home offers **Talk to Daywell**, **Just rest** and **Explore**.

- **Move:** record walks and other activity, save/edit strength sessions with sets, reps and kg, and see previous records for the same exercise.
- **Relax:** untimed quiet company with Luma, optional grounding prompts and locally generated soft rustling audio. No automatic record or score. Reflections are optional.
- **Eat:** three practical meal ideas ranked by typed ingredients, reviewed missing-ingredient shopping lists, and a meal journal with optional nutrition estimates.
- **Sleep:** wind-down space, adjustable bedtime/wake preferences and an editable sleep journal.
- **Calendar:** plans and retrospective history; existing calendar-file and history exports remain available. No live Google/Apple sync.

Focus, clocks/timers and alarms are in **Explore → Everyday extras**. Alarms and encouragement require the app to remain open. This is a local wellbeing MVP, not a medical or validated longevity product.

## Connect ElevenLabs

### Reusable audio: Just listen

Open **Just listen · little words of comfort** on Home, or `/audio-library`. The library contains **500 short recordings in 50 situations**, with ten variations per situation: Relax 100, Sleep 80, Move 80, Eat 60, Focus 40, Progress 40 and Everyday company 100. Choose a situation, press **Listen**, or choose **Another thought**. Search works locally. The resting space also offers recorded Luma guidance.

Each clip is generated once and shipped as an MP3. Listening opens no microphone, live agent, language-model or speech-generation request; ordinary asset delivery still has hosting/bandwidth costs. Playback starts only after a tap and stops on another clip, navigation, hiding the page or starting voice. The words remain readable if an audio file is unavailable. These are brief reusable prompts, not 500 full sessions or personalised answers. All currently use Daywell's existing host voice, with a slower pace for Relax and Sleep; the mascot provides visual company.

Scripts live in `lib/audio-library.ts`; hashed audio assets and the transcript manifest live in `public/audio-library/`. The player refuses to play a recording when its text no longer matches the script. Existing live-agent conversations remain separately metered; adding this library to an agent knowledge base alone would not avoid live-session charges. Subscription access and usage caps still need production billing integration.

To update recordings, edit scripts and run `npm run audio:plan` for an offline estimate, then `npm run audio:generate` for missing or changed clips. Voice/model configuration is in `config/audio-generation.json`. Generation uses the private key from the environment or ignored `.dev.vars`, checks the existing paid-plan allowance, limits a batch to 85,000 characters and preserves a 20,000-credit reserve. It never upgrades a plan or intentionally requests overage. `-- --limit 10` generates at most ten missing clips. A failed batch saves successful clips; review the provider's usage before retrying an ambiguous failed request. Provider credit reporting may be delayed. Review spoken content before public release.

### Live conversation

For direct key entry, open **Voice Setup** at `/voice-setup`, paste your key in the masked **ElevenLabs API key** field and choose **Save key**. You can add an agent ID in the optional section now or later. This form saves local settings; it does not verify credentials or create an agent. It is available only in the signed-in, loopback development preview. Secrets are never returned by the setup endpoint, and Vite blocks direct access to `.dev.vars` files.

To verify credentials or create a prepared Daywell agent:

1. Open **Connect voice.cmd**, or run `npm run voice:setup`.
2. Enter an existing dedicated agent ID, or **NEW** to create the prepared Daywell agent.
3. Enter the key at the hidden prompt. It is verified against ElevenLabs and written to ignored `.dev.vars`; existing unrelated settings are preserved. Do not paste the key into chat or source code.
4. Restart the local preview and reload. **Voice & company** shows whether credentials are configured. A successful live conversation is the final connection test.

The owner guide at `/voice-setup` includes instructions and the complete `config/daywell-agent.json` configuration. Existing agents must have the Daywell prompt and `daywell_request` client tool, signed-URL authentication enabled, no hostname allowlist, and the documented client events enabled. Creating an agent needs Agents write access. Review the chosen voice/model and transcript retention in ElevenLabs; the prepared configuration disables audio recording. Usage is billed to your ElevenLabs account.

The server checks sign-in, same origin and six starts per ten-minute window per user in D1 before requesting a short-lived signed URL. The API key never reaches client code. No saved journal entries are sent to the agent. Audio/text are sent only after the user accepts the connection notice. Agent tools may propose bounded changes; they cannot confirm, undo or delete. Use the on-screen **Do this** button to save. Conversations stop on hiding/leaving the tab, navigating to another area or after 15 minutes. AI chat is available under **Type instead**.

Local browser speech remains available when ElevenLabs is unconfigured; it uses the browser's speech service, not the AI agent. Meal photo recognition and wearable integrations are outside this MVP.

Before public hosting, use a trusted authentication gateway (the existing server expects authenticated-user headers) and hosted D1, set the two ElevenLabs secrets on the server, review provider retention/cost settings and verify the agent end to end. The local loopback identity is for development only. Never expose the development server publicly.

Implementation references: [ElevenLabs JavaScript SDK](https://elevenlabs.io/docs/eleven-agents/libraries/java-script), [private agent authentication](https://elevenlabs.io/docs/eleven-agents/customization/authentication), [client tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools).

## Single-host experience

The saved MVP at `/` now opens with **Daywell**, one place for requests. Users
never need to select or name a mascot. Tools and existing entries are available
under **Your tools & saved day**, as well as the sidebar.

- Pip accompanies focus, Luma winding down, and Bounce movement.
- Momo, Nori and Sunny briefly acknowledge shopping, meal and alarm changes.
- Tock is a quiet timer indicator. Helpers do not hold separate conversations.
- Activities start with quiet company. Optional guidance happens halfway, or
  at a quarter, halfway and three-quarters. Luma's timer ends silently.
- Browser voice input is tap-to-talk, stops after one request or 30 seconds,
  and stops when the page is hidden. Browser support and service availability
  vary. The browser may send speech to its speech service. Typing always works.
- Replies use one browser speech voice and are captioned. Spoken replies and
  companion pictures can be switched off; preferences stay in this browser.
- Review the proposed actions and press **Do this**, or say yes. Up to 20 host
  changes can be undone during this visit. Undo refuses to overwrite an entry
  that has since changed through another tool. Reloading clears undo history.
- Saved activities survive reload; encouragement does not replay missed cues.
  Keep Daywell open for timers, alarms and spoken guidance.

Without credentials, Daywell uses bounded everyday commands. Connecting an ElevenLabs agent enables open voice and AI text conversations.
Use **Things you can say** for supported phrases. Examples include “Add milk
and focus on my email for ten minutes”, “Help me wind down”, “Start a walk for
fifteen minutes”, “Set an alarm for 7 am”, “Log a meal”, and “Undo that”.
Unknown requests produce guidance without saving partial actions. Meal and
sleep requests open forms rather than inventing nutrition or sleep data.

Browser audio references: [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
and [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).
Live microphone transcription has not been verified on the user's device.

## Calendar and history

Open **Calendar & history** in the sidebar, or visit `/calendar`.

- Plan dated tasks and appointments, including all-day items, a start time,
  duration, location and notes. Browse months or choose a date directly.
- **Look back** gathers completed priorities and plans, finished focus sessions,
  and saved movement, sleep, meal, shopping and reflection entries.
- Filter by day, month or all time; compare six months of recorded activity.
  There are no streaks, missed-day scores or assumptions about unlogged time.
- New completions receive their actual local completion date, separate from
  the planned date. Editing preserves that date; reopening removes completion.
  Older completed records without dates stay in a separate earlier-records list.
- Completed focus sessions use their timer's finish date, even when the app is
  reopened later. Reflections can record a small step in the user's own words.
- Export the selected history as CSV, or unfinished plans in the visible month
  as an iCalendar (.ics) file. History exports include personal notes; calendar
  exports include event notes/locations but exclude reflections and wellbeing logs.
- The host understands “Show my calendar”, “Show my progress”, “Plan an event”
  and “Add a reflection”. No extra mascot needs to be remembered.

Google Calendar and Apple Calendar support importing the exported file:
[Google instructions](https://support.google.com/calendar/answer/37118?hl=en),
[Apple instructions](https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac).
**Live account sync is not connected.** Imports are one-time copies and later
changes do not sync; repeat imports may create duplicates. Times use the device's
local time zone. Recurring plans, calendar notifications and inbound imports are
not implemented. Set reminders in the destination calendar after importing.

This is a saved personal record, not an immutable audit log: editing or deleting
an entry changes its history. Local records remain in the local D1 database and
are not uploaded with source code. Calendar tests cover completion dates, legacy
history, date boundaries, exports, CSV escaping and host navigation commands.

## What's new in 0.2

- A daily overview with priorities, focus time, movement and sleep.
- Quick actions for manual entries, without an AI connection.
- Inline task creation and Today, Upcoming, Completed and All tasks views.
  Unfinished priorities from earlier days stay visible in Today.
- Quick grocery entry with quantities, To get/Bought filters and shopping progress.
- Focus, short-break and long-break controls with appropriate timer titles.
- A stopwatch that survives switching tools and displays elapsed hours beyond 24.
- Improved desktop, tablet and phone layouts, keyboard focus and save status.
- Repeatable local database setup and regression tests.

## First-time experience

New users see a three-step welcome: an introduction, a choice of tools, and
instructions tailored to those tools. The dashboard includes a dismissible
checklist linked to real entry forms. The choice to hide it is saved.

Open `/welcome` to replay setup without deleting existing entries, or select
**Getting started** in the app. Fresh workspaces begin with three suggested
tools: priorities, timers and groceries. Users can choose any combination.

## Choose your style

Open **Your style** (the palette button) for the **Appearance studio**. Changes
apply live, and **Done** returns to the working app. Nook is the default design;
Stillwater and the earlier Cloud, Grove and Moonlight designs remain available.

- **Iterations:** Breathing room, Cosy cove and Gentle company refine the selected
  Stillwater / Berry / paper flecks / rounded lettering / pillowy buttons / side-by-side
  companions reference. **Try this design** opens the working app with temporary
  comparison buttons. **Your reference** restores that exact selection. No iteration
  is designated final; the global default stays Nook.
- **Composition** in **Mix your own** lets these arrangements use any palette,
  backdrop, lettering, buttons and companion choice. Compositions are included in
  saved favourites; earlier saved looks retain their original layout.
- **Starting looks:** Original Nook, Berry blanket, Moonlit den, Lakeside friends,
  Sage journal and Original Stillwater. Earlier designs are in a disclosure.
- **Mix your own:** combine five palettes, four backdrops, three lettering
  styles, three button treatments and three companion arrangements. Swap Nook's
  layout for Stillwater's while keeping the other choices.
- **Surprise me** creates a new combination. **Undo** steps back through up to
  30 changes in the open studio. **Start over** restores the look used when it opened.
- **Keep a favourite:** name and save up to 12 combinations. Apply them from
  **Saved**, or remove one; its restore button remains until the studio closes
  or another favourite is removed.

Preferences and named looks stay in this browser and sync between its tabs.
Existing theme preferences migrate automatically. If browser storage is blocked,
changes last for the visit and the studio reports that they could not be saved.
Appearance choices do not change tasks, timers or history. The host stays mounted
while mixing. Companion arrangements affect the home scene; the active helper
still appears during an activity. **Hide companion pictures** takes priority in
the working app. The preview is an appearance sample, with non-interactive controls.

The palettes use checked text contrast, the studio supports keyboard navigation,
and reduced-motion preferences are respected. Gingham and paper flecks are drawn
with CSS. Portraits are the existing local Pip, Luma and Bounce assets.

Stillwater takes visual inspiration from
[The Mindfulness App](https://www.themindfulnessapp.com/). Its original landscape,
generated with the built-in image tool, is stored in
`public/scenes/stillwater-lake.png`; its prompt is in
`public/scenes/generation-prompts.json`. It can now be combined with the mascots.

## Design previews

Open `/designs` to compare three interactive directions: **Daybreak**, **Pocket**,
and **Current**. Each has a first-visit introduction and a sample daily workspace.
Use **First visit** and **Your day** to switch screens, or the design names to
compare the same screen in another direction.

Try changing the name and selected tools, adding and completing priorities,
starting or pausing the focus timer, ticking off groceries, and choosing a
wind-down time. **Show me how** explains the controls. These are design previews:
all entries are fictional, changes stay in memory and reset on reload, and
wind-down plans do not send notifications. They never call the saved-state API.
The MVP at `/` now uses the single-host flow above and retains existing saved entries.
These three previews remain earlier visual explorations.

The preview typefaces are self-hosted in `public/fonts`: Manrope, DM Sans,
Bricolage Grotesque and Newsreader from the Google Fonts repository. Their
SIL Open Font License files are included alongside the fonts.

## Daywell companions

Seven original furry mascots accompany the tools: Pip (focus/priorities), Tock
(timers), Momo (groceries), Luma (sleep), Nori (food), Bounce (movement), and
Sunny (alarms). Meet the whole family at `/designs`, or find your enabled
companions during activities in the saved workspace. The earlier visual
previews have optional character introductions. Completing tasks and groceries triggers a brief celebration; reduced
motion preferences disable these animations. The family introductions include
an optional “Send a little love” interaction.

These assistants use local, contextual guidance rather than an AI chat service.
They don't send messages or change records on their own. Original transparent
PNG artwork lives in `public/companions`, with the complete built-in image
generation prompts in `public/companions/generation-prompts.json`.

## Run locally

Install Node.js 22.13 or newer. In the project folder:

```sh
npm run install:ci
npm run setup
npm run dev
```

Open **http://127.0.0.1:5173/** and complete onboarding. Development sign-in uses
one local test identity. Records are stored on this machine in the ignored
`.wrangler/state` directory. No API key or Cloudflare login is required.

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands.

`npm run setup` builds the app and applies pending local database migrations.
It can be repeated on a database initialized through this command; it does not
remove records or contact a production database. Existing databases initialized
with the old raw SQL command need their migration history reconciled before
using the migration runner. Keep a backup and do not delete an existing database.

For later sessions, run only `npm run dev`. Stop it with Ctrl+C.

## Check the project

```sh
npm run typecheck
npm test
npm run build
```

Or run `npm run check` for all three. The GitHub workflow performs these checks
and verifies local database setup. `npm run lint` is also available, but the
inherited MVP has lint debt (primarily broad `any` types and hook rules). It is
not currently a passing quality gate. The new everyday components and routines
pass their scoped lint check.

Regression tests cover carried-over tasks, task filtering, long stopwatch
sessions, timer titles, overnight sleep and entry validation. Manual browser
checks cover onboarding, tasks, grocery quantities and completion, timer modes,
stopwatch navigation, saved data and responsive layout.

## Optional AI adapter

The current host uses browser speech and the bounded commands described above.
The older photo/AI capture components remain in source for future integration
and are no longer the primary entry point. The optional server adapter in
`app/api/capture/route.ts` is inactive without server credentials; open-ended
The older OpenAI capture adapter and photo analysis remain unconnected and unverified. ElevenLabs conversation is integrated separately as described above.

Keep keys in local secret files or hosting secrets, never in client code or
Git. `.env.example` is a blank template. `.env*`, `.dev.vars*`, runtime state,
local records, dependencies and generated builds are ignored.

## Deployment and limits

This repository upload is not a live website deployment. The current runtime
uses Cloudflare Workers and D1 and expects trusted Sites authentication headers.
Local mock sign-in is restricted to loopback development. Production hosting
needs the appropriate authenticated gateway and database bindings; the app is
not configured for generic public hosting or GitHub Pages.

- Alarms and sounds need the app to remain open; use a device alarm for waking up.
- One-time alarms use the next occurrence of a clock time, not a calendar date.
- The stopwatch survives navigation within the app, but resets on page reload.
- Sleep and movement are self-reported; there is no wearable integration.
- Food values are estimates. Groceries are a list, not an ordering service.
- Confirmed structured records are saved; raw captures are transient.
- The beta Vinext runtime and AI adapter need further production hardening.

The existing `.openai/hosting.json` metadata and vendored Sites support files
are retained because the build uses them. Uploading this repository does not
publish or change the original hosted project.

## Project map

- `app/` — dashboard, everyday tools, dialogs and API routes
- `lib/` — validation, capture drafts and routine helpers
- `db/`, `drizzle/` — database access, schema and migrations
- `scripts/`, `build/` — local tooling and Sites runtime adapters
- `tests/` — regression tests

## Photo credit

Salmon bowl photo by [Oskar Kadaksoo on Unsplash](https://unsplash.com/photos/a-bowl-of-food-on-a-plate-Be2IMDyTDII).
Third-party notices are preserved in `vendor/` and `build/`.

## Expressive breathing and meditation

**Stay for a little longer** in Just listen opens `/meditate`: **An easy breath** (2 minutes), **Leave the feed behind** (3 minutes), and **A softer goodnight** (5 minutes). Relax and Sleep also link to these sessions. Each uses a saved Eleven v4 recording, with explicit warm, unhurried delivery directions and measured quiet intervals. Daywell's connected live host was already configured for Eleven v4 Turbo; these sessions do not open a live connection.

The player provides pause/continue, end, position and volume controls, current-passage captions and the full written guidance. It pauses when the tab is hidden and stops when leaving the page; return to the same page to resume a paused session. A new page visit starts at the beginning. Playback does not save a completion, open a microphone, or incur new speech-generation/agent usage. The 500 short-response library remains available separately.

Scripts and timelines are in `lib/guided-sessions.ts`; configuration is in `config/guided-audio-generation.json`. Run `npm run meditation:plan`, then `npm run meditation:generate` to generate missing sessions. Generation requires FFmpeg/FFprobe on PATH, checks the existing included allowance with a conservative two-credit-per-character budget and a 20,000-credit reserve, and never buys an upgrade. Private keys remain in the environment or ignored `.dev.vars`. Narration is cached under ignored `work/guided-audio`; final recordings and timing metadata are under `public/guided-audio`. The assembler rejects a passage that would overflow its allotted slot instead of cutting off speech. Review the audio before public release.

Delivery references: [Eleven v4](https://elevenlabs.io/v4) and [audio-tag guidance](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices). The breathing script follows the general principle of gentle, comfortable, unforced breathing described by the [NHS](https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/); this short introductory recording is not the NHS's full recommended practice or a treatment protocol. No breath holds or claimed health outcomes are included.
