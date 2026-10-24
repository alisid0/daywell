# Daywell's personality

Owner-approved on 23 October 2026 ("approved, full"), after choosing the recipe in the button tuner. The style is bold and playful, for people who move fast. Every button is a solid colour with a dark outline and a hard offset shadow, and it sinks into that shadow when pressed. Cards, tab strips, fields and the Talk to Daywell key share the same outline and shadow.

It lives in `app/personality.css`, which loads last in `app/layout.tsx` and uses `!important` so it wins over each look's own button styles. Colours are the same in every look. In the dark looks (Stillwater and Moonlight with their own palettes), the outlines and shadows turn light so they still show.

## The four kinds of button

| Kind | Colour | Use it for | Classes today |
| --- | --- | --- | --- |
| Main | Forest `#2f7a55`, white text | The one action a screen is for: Start, Save entry, Take a photo | `.well-button`, `.kitchen-primary`, `.host-primary`, `.mv-btn`, `.calendar-primary`, `Button` (default) |
| Second | Peach `#ffc7a6`, dark text | The other choice: Not today, Record a move, Cook ideas | `.mv-btn.is-ghost`, `.kitchen-secondary`, `.mv-round` with text, `Button` (outline, secondary) |
| Round icon | Mint `#a9dfd4`, satin sheen | Icon-only buttons: header, search, add, close | `.stillwater-header-button`, `.kitchen-round`, `.mv-round` with only an icon, dialog close, `Button` (icon sizes) |
| Choice chip | Forest when chosen, peach when not, puffy | Picking one of a few: durations, filters, a meal's place | `.mv-chip`, `.mv-seg > button`, `.calendar-areas > button`, `.capture-choices > button`, `.preset-row > button` |

All of them have 2.5 px outlines, a 4 px shadow (3 px on icons and chips), 16 px corners (14 px on icons and chips) and heavy text. Main buttons are at least 50 px tall and grow with larger text, and icons and chips are at least 44 px.

Pressed, every button sinks into its shadow in 60 ms, with no bounce. Chips also brighten, then settle back gently. With Reduce Motion on, the press still shows but nothing animates.

## The rest

- **Cards and tiles** get a 2 px outline and a 4 px shadow. Tappable ones sink when pressed.
- **The tab bar and Eat's Plate, Kitchen, Week and Trolley tabs** are sticker strips, with the current page in puffy forest.
- **Talk to Daywell** is a big forest key.
- **Fields** get a dark outline and a forest ring while you type. Tick boxes and switches turn forest.
- **Page titles** are weight 800.

## Adding a button

Give it one of the classes above, or use the shared `Button` with the right variant, so it picks up the personality without new styles. If a new kind of control doesn't fit the four kinds, preview it first. The owner approves visible changes before they're built.
