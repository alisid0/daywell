import data from "../content/companions.json" with { type: "json" };

// Companion names, colours, personalities and mood lines live in content/companions.json.
export const companions = data;
export type CompanionId = keyof typeof companions;
export const companionIds = Object.keys(companions) as CompanionId[];
export const companionForModule: Record<string, CompanionId> = Object.fromEntries(companionIds.map(id => [companions[id].module, id]));
export const companionMoods = ["calm", "listening", "thinking", "speaking", "happy", "encouraging", "sleepy", "concerned"] as const;
export type CompanionMood = typeof companionMoods[number];
