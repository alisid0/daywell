import { env } from "cloudflare:workers";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database } from "@/db/store";
import { currentSubscription, isPlanTester, setTestPlan } from "@/lib/plan-store";
import { readLimited, sameOrigin } from "@/lib/request-guards";

// The person's plan, for Your plan in settings and the plan screen (docs/plans.md). Until store purchases are
// connected, testers named in DAYWELL_PLAN_TESTERS can switch plans here without paying.
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
const testChoice = z.object({ plan: z.enum(["daywell", "plus", "none"]) }).strict();

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in to see your plan." }, 401);
  const tester = isPlanTester(user.email, env.DAYWELL_PLAN_TESTERS);
  // Only accounts from email sign-in have subscriptions; the private test and the local preview don't.
  if (!user.userId.startsWith("dw:")) return json({ plan: user.plan, subscription: null, tester });
  try {
    return json({ plan: user.plan, subscription: await currentSubscription(database(), user.userId), tester });
  } catch {
    return json({ error: "Your plan couldn’t be checked just now. Please try again." }, 503);
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in to change your plan." }, 401);
  if (!sameOrigin(request)) return json({ error: "Request origin is not allowed." }, 403);
  if (!isPlanTester(user.email, env.DAYWELL_PLAN_TESTERS)) return json({ error: "Plans are bought in the Daywell app on your phone." }, 403);
  if (!user.userId.startsWith("dw:")) return json({ error: "Plan testing works for accounts made with email sign-in." }, 409);
  const raw = await readLimited(request, 200);
  let choice: z.infer<typeof testChoice>;
  try {
    choice = testChoice.parse(JSON.parse(new TextDecoder().decode(raw ?? new Uint8Array())));
  } catch {
    return json({ error: "Choose Daywell, Daywell Plus or no plan." }, 400);
  }
  try {
    await setTestPlan(database(), user.userId, choice.plan);
    return json({ ok: true, plan: choice.plan });
  } catch {
    return json({ error: "Your test plan couldn’t be saved. Please try again." }, 503);
  }
}
