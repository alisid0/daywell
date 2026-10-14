"use client";
import { useEffect, useState } from "react";
import { manageUrls, plans, products, type Plan } from "@/lib/plans";
import type { Subscription } from "@/lib/plan-store";

// "Your plan" in settings (approved preview, 13 October 2026; docs/plans.md). Store subscriptions are managed and
// cancelled in the App Store or Google Play; testers can clear a test plan here.
type PlanState = { plan: Plan; subscription: Subscription | null; tester: boolean };
const day = (time: number) => new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "long" });

export function YourPlan() {
  const [state, setState] = useState<PlanState | null>(null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/plan").then(async response => {
      const data = await response.json().catch(() => ({}));
      if (!live) return;
      if (response.ok) setState(data as PlanState);
      else setProblem((data as { error?: string }).error || "Your plan couldn’t be checked just now.");
    }).catch(() => { if (live) setProblem("Your plan couldn’t be checked just now."); });
    return () => { live = false; };
  }, []);

  async function clearTestPlan() {
    setBusy(true);
    const response = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "none" }) }).catch(() => null);
    if (response?.ok) { window.location.assign("/plans"); return; }
    setBusy(false);
    setProblem("Your test plan couldn’t be cleared. Please try again.");
  }

  const subscription = state?.subscription ?? null;
  const store = subscription && subscription.store !== "test" ? subscription.store : null;
  const product = subscription ? products[subscription.productId as keyof typeof products] : undefined;
  let detail = "";
  if (state && state.plan !== "none") {
    const name = plans[state.plan].name, period = product?.period ?? "month";
    const price = `${plans[state.plan].prices[period]} a ${period}`;
    if (!subscription) detail = `${name} · included while Daywell is in private testing`;
    else if (subscription.store === "test") detail = `${name} · test plan, ends on ${day(subscription.expiresAt)}`;
    else detail = `${name} ${price} · ${subscription.willRenew ? "renews" : "ends"} on ${day(subscription.expiresAt)}`;
  }

  return <section className="your-plan" aria-labelledby="your-plan-title">
    <h3 id="your-plan-title">Your plan</h3>
    {!state && !problem && <p>Checking your plan…</p>}
    {problem && <p role="alert">{problem}</p>}
    {state?.plan === "none" && <p>You don’t have a plan yet.</p>}
    {detail && <p><strong>{detail}</strong></p>}
    {state && <div className="your-plan-actions">
      <a className="your-plan-link" href="/plans">{state.plan === "none" ? "Choose a plan" : "Change plan"}</a>
      {store && <a className="your-plan-link" href={manageUrls[store]} target="_blank" rel="noopener">Manage or cancel</a>}
      {state.tester && subscription?.store === "test" && <button className="your-plan-link" type="button" disabled={busy} onClick={() => void clearTestPlan()}>Clear test plan</button>}
    </div>}
    {store && <small>Deleting your Daywell account doesn’t cancel your subscription. Cancel it in your App Store or Google Play subscriptions first.</small>}
  </section>;
}
