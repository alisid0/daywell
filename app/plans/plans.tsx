"use client";
import { useState, useSyncExternalStore } from "react";
import { paidPlans, plans, type PaidPlan, type Period, type Plan } from "@/lib/plans";

// Choose your plan (approved preview, 13 October 2026; docs/plans.md). Purchases happen in the phone apps through
// the store's own payment sheet once RevenueCat is connected; the web app doesn't sell subscriptions in version 1.
// Until then, named testers can switch plans without paying.
type Store = "apple" | "google" | null;
type Capacitor = { isNativePlatform?: () => boolean; getPlatform?: () => string };
function phoneStore(): Store {
  const capacitor = (globalThis as { Capacitor?: Capacitor }).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.getPlatform?.() === "ios" ? "apple" : "google";
}

const noUpdates = () => () => {};

export default function Plans({ plan, signedIn, tester, returnTo = "/" }: { plan: Plan; signedIn: boolean; tester: boolean; returnTo?: string }) {
  const [period, setPeriod] = useState<Period>("month");
  const [chosen, setChosen] = useState<PaidPlan>(plan === "daywell" ? "daywell" : "plus");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  // Read once in the browser; the server render has no phone, so the first paint matches it.
  const store = useSyncExternalStore(noUpdates, phoneStore, () => null);

  const price = plans[chosen].prices[period];
  const every = period === "month" ? "month" : "year";

  async function chooseForTesting() {
    setBusy(true); setProblem("");
    try {
      const response = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: chosen }) });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Your test plan couldn’t be saved. Please try again.");
      window.location.assign(returnTo);
    } catch (error) {
      setBusy(false);
      setProblem(error instanceof Error && error.message !== "Failed to fetch" ? error.message : "You seem to be offline. Check your connection, then try again.");
    }
  }

  let action;
  if (!signedIn) action = <a className="plans-primary" href={`/sign-in?return_to=${encodeURIComponent("/plans")}`}>Sign in to subscribe</a>;
  else if (chosen === plan) action = <button className="plans-primary" type="button" disabled>Your current plan</button>;
  else if (tester) action = <>
    <button className="plans-primary" type="button" disabled={busy} onClick={() => void chooseForTesting()}>{busy ? "Saving…" : `Use ${plans[chosen].name} for testing`}</button>
    <p className="plans-fine">Testing only. No payment is taken, and the test plan ends after 30 days.</p>
  </>;
  else if (store) action = <>
    <button className="plans-primary" type="button" disabled>Subscribe for {price} a {every}</button>
    <p className="plans-note">Payments in the app open soon.</p>
  </>;
  else action = <p className="plans-note">You can subscribe in the Daywell app for iPhone or Android.</p>;

  return <main className="plans" aria-labelledby="plans-title">
    <div className="plans-card">
      <div className="plans-head">
        <h1 id="plans-title">Choose your plan</h1>
        <span className="plans-pill">No free trial</span>
      </div>
      <div className="plans-period" role="group" aria-label="How often to pay">
        <button type="button" aria-pressed={period === "month"} onClick={() => setPeriod("month")}>Monthly</button>
        <button type="button" aria-pressed={period === "year"} onClick={() => setPeriod("year")}>Yearly</button>
      </div>
      <fieldset className="plans-options">
        <legend className="plans-hidden">Plan</legend>
        {paidPlans.map(id => <div key={id} className="plans-option" onClick={() => setChosen(id)}>
          <div className="plans-option-top">
            <label>
              <input type="radio" name="plan" value={id} checked={chosen === id} onChange={() => setChosen(id)} />
              {plans[id].name}
              {plan === id && <span className="plans-current">Your plan</span>}
            </label>
            <span className="plans-price">
              {plans[id].prices[period]}
              <small>{period === "month" ? "a month" : `a year · ${plans[id].prices.yearPerMonth} a month`}</small>
            </span>
          </div>
          <p className="plans-lead">{plans[id].lead}</p>
          <ul>{plans[id].features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        </div>)}
      </fieldset>
      {action}
      {problem && <p className="plans-problem" role="alert">{problem}</p>}
      {store === "apple" && <p className="plans-fine">Payment is taken from your Apple Account when you confirm. Your subscription renews automatically at {price} each {every} unless you cancel at least 24 hours before it renews. Cancel any time in Settings, then your name, then Subscriptions. No free trial.</p>}
      {store === "google" && <p className="plans-fine">Payment is taken from your Google Play account when you confirm. Your subscription renews automatically at {price} each {every} until you cancel. Cancel any time in Google Play, under Payments and subscriptions. No free trial.</p>}
      {signedIn && <a className="plans-quiet" href="/signout-with-chatgpt">Sign out</a>}
    </div>
  </main>;
}
