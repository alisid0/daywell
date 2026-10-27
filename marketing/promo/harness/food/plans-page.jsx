// Harness-only page (page=plans): the real plan screen. plan=none|daywell|plus, tester, signedout, store=apple|google.
const loader = Object.values(import.meta.glob("../../app/plans/plans.tsx"))[0];
const Plans = loader ? (await loader()).default : () => <p>Plans aren't on this branch.</p>;
const params = new URLSearchParams(location.search);
if (params.get("store")) window.Capacitor = { isNativePlatform: () => true, getPlatform: () => (params.get("store") === "apple" ? "ios" : "android") };
export default function PlansPage() {
  return <Plans plan={params.get("plan") ?? "none"} signedIn={!params.has("signedout")} tester={params.has("tester")} returnTo="/?view=today" />;
}
