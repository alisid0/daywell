# Daywell

A calmer home for your day. Seven optional tools for focus, timers, alarms,
sleep, groceries, food and movement — in one personal workspace.

Built with React, TypeScript, Vinext, shadcn/ui and Cloudflare D1.

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

## Photo and voice preview

Photo and voice flows include clearly labelled guided examples. Examples never
save real records. Manual entry works without AI. The optional server adapter
in `app/api/capture/route.ts` is inactive without server credentials; live
recognition and transcription remain unverified.

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
