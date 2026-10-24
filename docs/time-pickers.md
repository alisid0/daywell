# Time pickers and the week strip

Approved by the owner on 24 October 2026. They picked "Wheels" for how long, "Wheels" for clock times and the week strip for the calendar on the "Calendar and Time Pickers" options page, then approved the "Time Picks on Daywell" preview of those picks on the real screens.

## What people see

- **How long** (Timers, a plan, a task, an edited move, and Record a move's Other minutes): two endless wheels, hours and minutes. After 59 comes 00, and the hours come back round. Timers keep their 5, 15, 25 and 50 minute shortcuts, which turn the wheels.
- **What time** (alarms, plans, the sleep log, Your evening and the settings panel): wheels for the hour, the minutes in five-minute steps, and am or pm, matching how Daywell shows times. A time saved before stays exact until someone changes it.
- **In forms**, each time or length is a button showing it, such as "9:00 am" or "1 h". Tapping it opens its wheels under the row; only one opens at a time. A new alarm opens straight onto its wheels.
- **The calendar** shows a strip of days to swipe through instead of the month grid:
  - today is peach and the chosen day is forest (each look's own colours without the sticker look);
  - the arrows still change the month, and Today and Go to date stay;
  - the chosen day's plans show underneath as bubbles, and read "9:00 am · 1 h" instead of "60 min".
- **Dates** still use the phone's own date picker.

## How it works

- `app/time-wheels.tsx` has `Wheel`, `ClockWheels`, `LengthWheels` and `WheelFields`. The arithmetic is in `lib/time-wheels.ts` and tested in `tests/time-wheels.test.mjs`.
- **Endless wheels:** a wheel stacks about 600 rows of its values. Once it settles two laps from the middle, it jumps to the same value in the middle copy, so nobody reaches an end.
- **The drum:** rows tilt and fade as they leave the middle. Phones that allow it give a soft tick as each number passes, but only after the person has tapped the page; browsers refuse vibration before that.
- **Limits:** a length stays within its field's limits, at least 1 minute and at most:
  - 24 hours for timers and plans;
  - 4 hours for a task;
  - 10 hours for a move.
- **Keyboard and screen readers:** each wheel is a spin button that reads out its value. The arrow keys move one row, and Page Up and Page Down move five.
- **Styles:** `app/time-wheels.css` and the strip rules in `app/calendar.css` use each look's colours. `app/personality.css` adds the sticker outline, the hard shadow and the mint band. One row is 48 px in both the stylesheet and the component, and a test checks that they match.
