// ChatGPT prompts for the Move workout-guide pictures (owner, 20 October 2026). One chat per figure: the reference sheet
// first, then one prompt per exercise. Moves get two panels side by side (start, end); holds, stretches and steady
// movement get one figure. Each picture is checked against its pose text in poses.mjs. See docs/move-pictures.md.
//   node scripts/move-pictures/prompts.mjs [female|male]  →  prints the prompts, one paragraph each
import { fileURLToPath } from "node:url";
import { exercises } from "./poses.mjs";

const figures = {
  // The default figure: unisex, leaning feminine (the owner's choice).
  female: "a smooth, faceless mannequin figure: plain oval head with no face and no hair, light warm-grey skin (#ECE6EA), a thin deep-plum outline (#522D46) and soft, subtle muscle contour lines. Unisex, leaning slightly feminine: moderate shoulders, a soft waist and gentle hips; healthy and athletic, never bulky. A smooth, featureless surface like a shop mannequin. Wears a plain fitted sports crop top and fitted mid-thigh shorts, both deep plum (#5B2A4A). Bare feet.",
  // For people who choose the male figure.
  male: "a smooth, faceless mannequin figure: plain oval head with no face and no hair, light warm-grey skin (#ECE6EA), a thin deep-plum outline (#522D46) and soft, subtle muscle contour lines. Male proportions: broader shoulders, a straight waist and narrower hips; healthy and athletic, never bulky or bodybuilder-like. A smooth, featureless surface like a shop mannequin, with no nipples or navel. Shirtless, wearing plain fitted mid-thigh shorts in deep plum (#5B2A4A). Bare feet.",
};

export const reference = who => `I'm making exercise guide pictures for a wellbeing app, one exercise at a time in this chat. First, please create a character reference sheet that every later picture must match exactly. Style: a clean fitness-guide illustration, like an anatomy muscle chart. The figure is ${figures[who]} Show the same figure twice, side by side at the same size, standing relaxed with arms by the sides: front view on the left, side view facing right on the right. Transparent background. No text, labels, shadows or floor.`;

const VIEW = { side: "Side view, facing right", front: "Front view, facing the viewer", above: "Seen from directly above, head at the top" };
const kit = "Draw any equipment or furniture as simple pale-grey (#D9D0D5) shapes with the same thin plum outline; weights, bars and kettlebells are dark grey (#4A4048).";
// The pose texts start with a name such as "Squat, lowest position."; a panel needs only what follows.
const strip = pose => pose.replace(/^[^.]*\b(starting|lowest|top|standing|bent|hinged|open|pressed|pulled|curled|reaching|tapping|first|second|catch|finish|low|in the air)\b[^.]*\.\s*/i, "");
const usesKit = e => /kettlebell|dumbbell|barbell|\bbar\b|chair|wall|step\b|counter|table|bench|machine|treadmill|bike|backpack|doorway|stool|stairs|handrail|rope|cable|platform/i.test(e.poses.join(" "));
const floor = (e, each) => e.view === "above" ? "" : `, with a very faint light-grey floor line under ${each ? "each" : "it"}`;

export function prompt(e) {
  const title = e.poses[0].split(/[,.]/)[0].replace(/^(Lying Y raise|Cat position)$/, m => (m === "Cat position" ? "Cat-cow" : "Lying Y-T raises"));
  const highlight = /nothing/i.test(e.works) ? "No muscles are highlighted: all the skin stays light warm grey."
    : `Fill the muscles it works in raspberry pink (#D14E86), like a muscle chart: ${e.works.replace(/^Highlight /, "").replace(/\.$/, "")}. Every other muscle stays light grey.`;
  const extra = usesKit(e) ? ` ${kit}` : "";
  const same = `Next exercise: ${title}. Use exactly the same mannequin figure, clothing, colours and line style as the reference sheet.`;
  if (e.poses.length === 1) return `${same} Make a square image of one figure on a transparent background${floor(e, false)}. No text or labels. ${VIEW[e.view]}. ${e.poses[0]} ${highlight}${extra}`;
  return `${same} Make a wide image with two panels side by side on a transparent background, the figure at the same size and place in both${floor(e, true)}. No text, labels or dividing lines. Left panel, the start: ${strip(e.poses[0])} Right panel, the end: ${strip(e.poses[1])} ${VIEW[e.view]} in both panels. ${highlight}${extra}`;
}

// Exercises that need a picture of their own (sameAs and mirrorOf reuse another one's).
export const queue = exercises.filter(e => e.poses);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const who = process.argv[2] === "male" ? "male" : "female";
  console.log(`# Reference sheet (${who})\n${reference(who)}\n`);
  queue.forEach((e, i) => console.log(`# ${i + 1}. ${e.id}\n${prompt(e)}\n`));
}
