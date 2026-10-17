// Connected wearables. WHOOP comes first (owner, 17 October 2026); Apple Health and Health Connect follow with the
// phone apps. Daywell copies only daily steps, workouts and sleep times: never scores, recovery or heart data.
// Workouts and nights become ordinary Move and Sleep entries marked with their source (`source` and `externalId` in
// lib/daywell.ts), so they show in the movement story, the sleep journal and the calendar. Steps stay one daily
// figure. Disconnecting deletes everything Daywell copied from that wearable.
export const wearableSources = ["whoop"] as const;
export type WearableSource = (typeof wearableSources)[number];
export const wearableNames: Record<WearableSource, string> = { whoop: "WHOOP" };

// WHOOP counts a day from waking up to waking up, so `dayStartedAt` (local "HH:MM") says when today's count began.
export type WearableSteps = { count: number; date: string; dayStartedAt: string | null };
export type WearableConnection = { source: WearableSource; connected: boolean; lastSyncedAt: string | null; steps: WearableSteps | null };
export type WearableSummary = { connections: WearableConnection[] };

/** "from WHOOP" for an entry a wearable added, or "" for one the person added. */
export function sourceLabel(source: unknown): string {
  return typeof source === "string" && source in wearableNames ? `from ${wearableNames[source as WearableSource]}` : "";
}

/** When a connection last updated, in the person's own words: "just now", "at 9:41 am" or "on 16 Oct". */
export function syncedLabel(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const minutes = (now.getTime() - at.getTime()) / 60_000;
  if (minutes < 2) return "just now";
  if (at.toDateString() === now.toDateString()) {
    const h = at.getHours(), m = String(at.getMinutes()).padStart(2, "0");
    return `at ${h % 12 || 12}:${m} ${h >= 12 ? "pm" : "am"}`;
  }
  return `on ${at.getDate()} ${at.toLocaleString("en-GB", { month: "short" })}`;
}
