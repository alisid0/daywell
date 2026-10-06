import type { CompanionId } from "./companions";

export type CompanionMotion = "idle" | "listening" | "thinking" | "speaking" | "happy" | "encouraging" | "sleepy" | "concerned" | "reaction" | "action";
export type CompanionPose = Record<string, number>;
export type CompanionLayers = Record<"body" | "furLeft" | "furRight" | "armLeft" | "armRight" | "prop" | "foot", HTMLImageElement>;
export interface CompanionDrawOptions { pose?: CompanionPose; furTime?: number; furStrength?: number; shadow?: boolean }

export const companionLayerFiles = {
  body: "body.webp", furLeft: "fur-left.webp", furRight: "fur-right.webp",
  armLeft: "arm-left.webp", armRight: "arm-right.webp", prop: "prop.webp", foot: "foot.webp",
} as const;
export const companionArtworkRoot = "/companions/illustrated-v4";
export function hostCompanionMotion(state: string): CompanionMotion {
  if (state === "blocked") return "concerned";
  if (state === "listening" || state === "thinking" || state === "speaking") return state;
  return "idle";
}
export function activityCompanionMotion(id: CompanionId, running: boolean, finished: boolean): CompanionMotion {
  if (finished) return id === "luma" ? "sleepy" : "happy";
  if (!running) return "idle";
  return id === "luma" ? "sleepy" : id === "bounce" ? "encouraging" : "idle";
}

// Celebrations settle once; all other approved states have seamless eight-second loops.
export function motionTime(mode: CompanionMotion, elapsed: number) {
  return mode === "reaction" ? Math.min(3, Math.max(0, elapsed)) : Math.max(0, elapsed) % 8;
}
