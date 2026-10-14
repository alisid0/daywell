import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { getChatGPTUser, safeRelativeReturnPath } from "../chatgpt-auth";
import { isPlanTester } from "@/lib/plan-store";
import Plans from "./plans";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choose your plan · Daywell" };

// The plan screen (docs/plans.md). Anyone can look; signing in comes before subscribing.
export default async function PlansPage({ searchParams }: { searchParams: Promise<{ return_to?: string | string[] }> }) {
  const query = await searchParams;
  const user = await getChatGPTUser();
  const returnTo = safeRelativeReturnPath(typeof query.return_to === "string" ? query.return_to : "/");
  const tester = !!user && user.userId.startsWith("dw:") && isPlanTester(user.email, env.DAYWELL_PLAN_TESTERS);
  return <Plans plan={user?.plan ?? "none"} signedIn={!!user} tester={tester} returnTo={returnTo} />;
}
