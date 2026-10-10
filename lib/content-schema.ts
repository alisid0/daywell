import { z } from "zod";

// Rules for the files in content/. Tests check every file against these on each pull request.
const text = (max: number) => z.string().trim().min(1).max(max);
const id = z.string().regex(/^[a-z0-9-]{2,40}$/, "Use lowercase letters, numbers and hyphens");
const moods = ["calm", "listening", "thinking", "speaking", "happy", "encouraging", "sleepy", "concerned"] as const;

export const companionSchema = z.object({
  name: text(20), job: text(40), module: z.enum(["alarm", "clock", "focus", "sleep", "grocery", "food", "move"]),
  colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/), hello: text(120), hint: text(200), action: text(40),
  personality: text(160), voice: text(160), movement: text(160), never: text(120),
  lines: z.object(Object.fromEntries(moods.map(m => [m, text(120)])) as Record<typeof moods[number], z.ZodString>).strict(),
}).strict();
export const companionsSchema = z.record(id, companionSchema);

export const recipeSchema = z.object({
  id, title: text(60), time: text(30), ingredients: z.array(text(40)).min(1).max(15),
  steps: z.array(text(300)).min(1).max(10), note: text(200),
}).strict();
export const recipesSchema = z.array(recipeSchema).min(1);

const exerciseSchema = z.object({
  id, name: text(60), where: z.enum(["none", "home", "gym"]), kit: text(60).nullable(),
  focus: z.enum(["cardio", "legs", "push", "pull", "core", "balance", "mobility"]), level: z.number().int().min(1).max(3),
  measure: z.enum(["reps", "seconds", "minutes"]), start: text(40), met: z.number().min(1).max(15), cue: text(160),
  easier: id.nullable(), harder: id.nullable(), caution: text(120).optional(),
}).strict();
const routineSchema = z.object({
  id, name: text(40), where: z.enum(["none", "home", "gym"]), level: z.number().int().min(1).max(3), minutes: z.number().int().min(1).max(120),
  companion: id, when: text(100), rounds: z.number().int().min(2).max(6).optional(), blocks: z.array(z.tuple([id, text(60)])).min(1).max(10),
  setup: text(400).optional(), restSeconds: z.number().int().min(10).max(300).optional(),
}).strict();
export const workoutsSchema = z.object({
  version: z.literal(1), notes: z.string(), exercises: z.array(exerciseSchema).min(1), routines: z.array(routineSchema).min(1),
}).strict();
