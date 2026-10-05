export const directions = {
  daybreak: {
    name: "Daybreak", character: "Clear skies. A little headspace.",
    description: "An open, sunlit workspace. One clear priority, a generous focus dial and the small things close at hand.",
    welcomeTitle: "A good day starts small.", welcomeText: "Make a little space for what matters. Daywell keeps your focus, errands and evenings together.",
    type: "Manrope + DM Sans", colours: ["#183D8C", "#E6EFFB", "#F8CB4A", "#FFFFFF", "#142443"],
  },
  pocket: {
    name: "Pocket", character: "Your everyday, all tucked in.",
    description: "A colourful personal organiser. Tabbed lists, useful little reminders and a place for everything on your mind.",
    welcomeTitle: "A place for your everyday.", welcomeText: "The thing you need to finish. The milk you must remember. The time you want back. Put it all in your pocket.",
    type: "Bricolage Grotesque + DM Sans", colours: ["#472E55", "#F7E7ED", "#FF9855", "#D9EEE1", "#FFFCFE"],
  },
  current: {
    name: "Current", character: "Find a rhythm that feels like you.",
    description: "A calm path through your day. Focus now, keep later in view, and leave a little room for winding down.",
    welcomeTitle: "There’s a rhythm to your day.", welcomeText: "A moment to focus. A few things to remember. Time to switch off. Give each part of your day a little space.",
    type: "Newsreader + DM Sans", colours: ["#174C43", "#EDF4F1", "#B8D9DC", "#F2A18C", "#FFFFFF"],
  },
} as const;
export type Direction = keyof typeof directions;
export function isDirection(value: string): value is Direction { return value in directions && Object.hasOwn(directions, value); }
export const directionKeys: Direction[] = ["daybreak", "pocket", "current"];
