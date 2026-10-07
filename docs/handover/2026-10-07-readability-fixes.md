# Readability fixes handover — 7 October 2026

**Session date:** Wednesday 7 October 2026 (Claude, Claude Code)

**Branch and PR:** `fix/opendyslexic-phone-overflow`, based on `main` at `42017b3`. No pull request yet: the browser's GitHub session was signed out, so the PR couldn't be opened from this machine. Open it from [the compare page](https://github.com/alisid0/daywell/compare/main...fix/opendyslexic-phone-overflow?expand=1) and paste this file as the description. The owner has the before/after screenshots and must approve before merging.

## What changed

Phone layouts at large reading sizes, and text that was too pale to read.

**Running off the screen** (OpenDyslexic at Large or Larger text on a phone):

- **Bottom bar** (`app/navigation.css`): tab labels overflowed and "Sleep"/"Relax" collided. With OpenDyslexic on phones, labels now stop growing at the size that fits five tabs, never below 14px. Other fonts keep the chosen size.
- **Area headings** (`app/wellbeing.css`): a long word like "Something" pushed the mascot off the screen. The mascot now moves under the heading only when a word can't share the line; normal layouts are unchanged. On phones under 400px the heading caps at 11vw so one word always fits. PR 26's new Eat heading uses the same component, so it is covered too.
- **Calendar** (`app/calendar.css`, `app/calendar-workspace.tsx`): "Go to date" and its field ran past the card. They now wrap onto separate lines, and the Calendar/Look back switch narrows on phones. Weekday names collided ("MonTueWed"), so at large sizes or with OpenDyslexic on phones they show single letters, as in the 7-day strip. They're hidden from screen readers either way.

**Contrast** with the berry palette, the launch look (`app/appearance-mixes.css`, `app/wellbeing.css`, `app/calendar.css`):

- Calendar subtitle "Make plans. Remember your progress.": was 1.1:1. It now uses the palette's muted colour (5.3:1).
- Sleep evening card caption "Your evening rhythm": was 1.9:1. It now keeps its own light colour (5.4:1).
- Calendar small notes and secondary buttons: were 4.41:1, now above 4.5:1.

## Checks performed and their results

- `npm run check`: type check, 70 tests and build passed.
- `npm run lint:changed`: no new lint errors.
- Rendered the real app with sample data (a local Vite page) at 320, 360, 375 and 414px wide. Covered all five Reading comfort fonts at standard, Large and Larger, plus Roomy spacing. Nothing runs off the screen, and layouts that fitted before are unchanged.
- Contrast scan of every visible text on Today, Move, Eat, Sleep, Relax and Calendar: all reach 4.5:1 (3:1 for large text).
- GitHub checks run when the pull request is opened. They haven't been seen yet.

## What is not yet verified

- Real Android and iPhone devices.
- Appearance styles other than Cosy cove with the berry palette.

## Remaining work / next step

Open the pull request, let GitHub's check pass, and merge after the owner approves. Other quick launch fixes found in the same review, not in this branch:

- Explicit opt-in before photos and recordings go to OpenAI.
- A privacy policy and support page.
- In-app account deletion and data export, including the Food basket tables from PR 26.
- Friendly dates and a shorter cook form in Food basket, after PR 26 merges.

## Setup or migration steps needed on the other machine

None. Styles and one small markup change only; no packages or database changes.

## Any work still local, and why

None. The branch is pushed and matches this machine.
