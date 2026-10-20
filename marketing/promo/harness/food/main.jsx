import "./css.js";
import { createRoot } from "react-dom/client";
import { applyReadingComfort, parseReadingComfort } from "@/lib/reading-comfort";
import * as daywellLib from "@/lib/daywell";
const { defaults, settingsSchema } = daywellLib;
// Branches with About you normalise and merge settings like the server; older branches just spread defaults.
const normalize = daywellLib.normalizeSettings ?? (stored => ({ ...defaults, ...stored }));
import Daywell from "@/app/daywell";
// Food sample data runs only on branches that have the Food basket code.
const foodModule = Object.values(import.meta.glob("../../lib/food.ts"))[0];
const { applyFoodCommand, foodCommandSchema } = foodModule ? await foodModule() : {};
const stateInputModule = Object.values(import.meta.glob("../../lib/state-input.ts"))[0];
const hostChangeModule = Object.values(import.meta.glob("../../lib/host-change.ts"))[0];
const { validateSavedEntries } = stateInputModule ? await stateInputModule() : {};
const { validateHostChange } = hostChangeModule ? await hostChangeModule() : {};
const bridgeModule = Object.values(import.meta.glob("../../lib/shopping-bridge.ts"))[0];
const { connectedShopping } = bridgeModule ? await bridgeModule() : {};
// Like the server, Eat's shopping list includes grocery notes saved from Today.
const foodView = () => connectedShopping ? connectedShopping(food.state, entries.filter(e => e.kind === "grocery").map(e => ({ id: e.id, data: JSON.stringify(e.data) }))) : food.state;

const params = new URLSearchParams(location.search);
applyReadingComfort(document.documentElement, parseReadingComfort(JSON.stringify({ font: params.get("font") ?? "atkinson", size: params.get("size") ?? "standard", spacing: params.get("spacing") ?? "standard" })));

// Sample data standing in for the server. Food commands run through the real lib/food.ts logic.
const seed = "seed";
let settings = { ...defaults, onboarded: true, guideDismissed: true, birthYear: 1991 };
if (params.has("welcome")) settings = { ...settings, onboarded: false, birthYear: null };
// ?profile=new is an account made before About you; ?details=1 adds sample details with calorie tracking on.
if (params.get("profile") === "new") settings = { ...settings, birthYear: null };
if (params.has("details")) settings = { ...settings, sex: "female", heightCm: 165, weights: [{ date: "2026-08-12", kg: 69.8 }, { date: "2026-09-11", kg: 70.4 }, { date: "2026-10-06", kg: 70 }], bodyConsentAt: "2026-08-12T09:00:00.000Z", calorieTracking: true, calorieGoal: 0 };
let entries = [
  { id: "f1", kind: "food", data: { title: "Berry oats", date: "2026-10-06", meal: "Breakfast", calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false } },
  { id: "f2", kind: "food", data: { title: "Chickpea sunshine bowl", date: "2026-10-05", meal: "Lunch", calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false } },
];
const food = { revision: 3, receipts: new Map(), effects: new Map(), actions: [], state: { version: 1,
  stock: [
    { id: "s-rice", ingredient: "rice", quantity: 500, unit: "g", bestBefore: null, changedBy: seed },
    { id: "s-egg", ingredient: "egg", quantity: 6, unit: "each", bestBefore: "2026-10-14", changedBy: seed },
    { id: "s-noodles", ingredient: "egg noodles", quantity: 300, unit: "g", bestBefore: null, changedBy: seed },
    { id: "s-tomato", ingredient: "tomato", quantity: null, unit: "each", bestBefore: null, changedBy: seed },
    { id: "s-milk", ingredient: "milk", quantity: 1000, unit: "ml", bestBefore: "2026-10-09", changedBy: seed },
    { id: "s-spinach", ingredient: "spinach", quantity: 200, unit: "g", bestBefore: "2026-10-08", changedBy: seed },
    { id: "s-chilli", ingredient: "vegetable chilli", quantity: 2, unit: "portion", bestBefore: "2026-10-09", changedBy: seed },
  ],
  plans: [
    { id: "p-1", title: "Spinach omelette", date: "2026-10-07", meal: "Dinner", servings: 2, ingredients: [{ ingredient: "egg", quantity: 4, unit: "each" }, { ingredient: "spinach", quantity: 100, unit: "g" }, { ingredient: "tomato", quantity: 2, unit: "each" }], changedBy: seed },
    { id: "p-2", title: "Tomato rice", date: "2026-10-08", meal: "Lunch", servings: 2, ingredients: [{ ingredient: "rice", quantity: 300, unit: "g" }, { ingredient: "tomato", quantity: 3, unit: "each" }, { ingredient: "onion", quantity: 1, unit: "each" }], changedBy: seed },
  ],
  shopping: [{ id: "sh-bread", title: "Sourdough loaf", quantity: "1", done: false, changedBy: seed }],
} };
// &kitchen adds a freezer and a fruit bowl to the sample, for the Kitchen's shelves (19 October design).
if (params.has("kitchen")) food.state.stock.push(
  { id: "s-peas", ingredient: "frozen peas", quantity: 750, unit: "g", bestBefore: null, place: "freezer", changedBy: seed },
  { id: "s-apple", ingredient: "apple", quantity: 4, unit: "each", bestBefore: null, changedBy: seed });
// It also adds two trolley notes: one household thing (ticked off, never shelved) and one with an amount.
if (params.has("kitchen")) food.state.shopping.push(
  { id: "sh-soap", title: "Washing-up liquid", quantity: "", done: false, changedBy: seed },
  { id: "sh-soy", title: "Soy sauce", quantity: "150 ml", done: false, changedBy: seed });
// ?promo=1: the sample week for the promo video. Sam has a week of walks, meals and sleep to look back on, a basket
// without milk, no saved meal plans, and photo and plan understanding that run canned model output through the app's
// own converters (no provider calls).
const promo = params.has("promo");
const captureModule = Object.values(import.meta.glob("../../lib/capture.ts"))[0];
const journeyModule = Object.values(import.meta.glob("../../lib/food-journey.ts"))[0];
const { draftEntries } = promo && captureModule ? await captureModule() : {};
const { mealPlanDraft } = promo && journeyModule ? await journeyModule() : {};
if (promo) {
  // Dates hang off the story day (14 October 2026), so captures on the next morning see last night as not yet logged.
  const day = n => { const d = new Date(new Date("2026-10-14T12:00:00").getTime() - n * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  settings = { ...settings, name: "Sam" };
  const nights = [[1, "23:05", "07:00", "Rested"], [2, "23:40", "07:10", "Okay"], [3, "22:50", "06:55", "Rested"], [4, "00:10", "07:20", "Tired"], [5, "23:15", "07:05", "Okay"], [6, "23:00", "07:30", "Rested"]];
  const sleepMins = (b, w) => { const n = x => Number(x.slice(0, 2)) * 60 + Number(x.slice(3)); return (n(w) - n(b) + 1440) % 1440; };
  const meal = (id, n, title, m) => ({ id, kind: "food", data: { title, date: day(n), meal: m, calories: 0, protein: 0, carbs: 0, fat: 0, nutritionKnown: false } });
  entries = [
    ...nights.map(([n, b, w, q]) => ({ id: `sl${n}`, kind: "sleep", data: { date: day(n - 1), bedtime: b, wakeTime: w, minutes: sleepMins(b, w), quality: q } })),
    { id: "mv1", kind: "move", data: { title: "After-meal stroll", date: day(1), minutes: 15 } },
    { id: "mv2", kind: "move", data: { title: "Desk break", date: day(2), minutes: 5 } },
    { id: "mv3", kind: "move", data: { title: "Walk to the park", date: day(3), minutes: 25 } },
    { id: "mv5", kind: "move", data: { title: "Core in ten", date: day(5), minutes: 10 } },
    meal("fd1", 1, "Berry oats", "Breakfast"), meal("fd2", 1, "Vegetable chilli", "Dinner"), meal("fd3", 2, "Chickpea sunshine bowl", "Lunch"),
    meal("fd4", 3, "Eggs & greens on toast", "Breakfast"), meal("fd5", 4, "Tomato rice", "Dinner"), meal("fd6", 5, "Berry oats", "Breakfast"),
    { id: "ss2", kind: "session", data: { title: "Reply to emails", date: day(2), minutes: 10 } },
    { id: "ss4", kind: "session", data: { title: "Tidy the inbox", date: day(4), minutes: 25 } },
    { id: "tk1", kind: "task", data: { title: "Book the dentist", done: true, date: day(3), completedDate: day(3), minutes: 15 } },
    { id: "tk2", kind: "task", data: { title: "Return the parcel", done: true, date: day(2), completedDate: day(2), minutes: 15 } },
    { id: "tk3", kind: "task", data: { title: "Water the plants", done: true, date: day(1), completedDate: day(1), minutes: 5 } },
  ];
  if (params.get("whoop") === "1") {
    // A connected WHOOP: last night and this morning's run came from it, and last night has no feeling yet.
    entries = entries.map(e => e.id === "sl1" ? { ...e, data: { date: e.data.date, bedtime: "23:42", wakeTime: "07:05", minutes: sleepMins("23:42", "07:05"), source: "whoop", externalId: "whoop-sleep-1" } } : e);
    entries.push({ id: "wh-run", kind: "move", data: { title: "Running", date: day(0), minutes: 32, source: "whoop", externalId: "whoop-workout-1" } });
  }
  food.state = { ...food.state,
    stock: food.state.stock.filter(item => item.id !== "s-milk").map(item => item.id === "s-tomato" ? { ...item, quantity: 4 } : item),
    plans: [], shopping: [{ id: "sh-bread", title: "Sourdough loaf", quantity: "1", done: false, changedBy: seed }] };
}
const cannedPhoto = date => ({ summary: "A salmon and quinoa bowl with peas, carrot, pepper and red cabbage. The portion and nutrition are estimates.", question: null, actions: [
  { kind: "food", title: "Salmon & quinoa bowl", date, minutes: null, time: null, endTime: null, quantity: null, calories: 520, protein: 32, carbs: 46, fat: 21, meal: "Breakfast", quality: null, repeatDays: [], portions: 1, sugarGrams: null, sugarSource: null, stockQuantity: null, stockUnit: null }] });
const cannedPlan = { summary: "Three dinners for one from your basket, no mushrooms.", question: null, meals: [
  { title: "Vegetable chilli with rice", ingredients: [{ ingredient: "vegetable chilli", quantity: 1, unit: "portion" }, { ingredient: "rice", quantity: 75, unit: "g" }], steps: ["Cook the rice following the pack instructions.", "Heat the chilli until piping hot and serve with the rice."], caloriesPerServing: null, nutritionNote: "" },
  { title: "Spinach and egg fried rice", ingredients: [{ ingredient: "rice", quantity: 75, unit: "g" }, { ingredient: "egg", quantity: 2, unit: "each" }, { ingredient: "spinach", quantity: 80, unit: "g" }], steps: ["Cook the rice and let it cool a little.", "Scramble the eggs, add the spinach until it wilts, then stir through the rice."], caloriesPerServing: null, nutritionNote: "" },
  { title: "Tomato egg noodles", ingredients: [{ ingredient: "egg noodles", quantity: 75, unit: "g" }, { ingredient: "egg", quantity: 2, unit: "each" }, { ingredient: "tomato", quantity: 2, unit: "each" }, { ingredient: "spring onion", quantity: 2, unit: "each" }, { ingredient: "lime", quantity: 1, unit: "each" }], steps: ["Cook the noodles following the pack instructions.", "Soften the tomatoes, scramble in the eggs, then toss with the noodles, spring onion and a squeeze of lime."], caloriesPerServing: null, nutritionNote: "" },
] };
// Recipe ideas (branches with lib/recipe-ideas.ts): canned model replies run through the app's own converters, so
// what Daywell decides (in the basket or missing, extras not already listed) is real. No provider calls.
// &norecipes hides the feature, as when OpenAI isn't connected.
const recipesModule = Object.values(import.meta.glob("../../lib/recipe-ideas.ts"))[0];
const recipes = recipesModule ? await recipesModule() : null;
const cannedIdeas = { summary: "Three easy ideas from your rice, eggs, spinach, milk and chilli.", ideas: [
  { title: "Spinach and egg fried rice", meal: "Dinner", minutes: 20, ingredients: [{ ingredient: "rice", quantity: 75, unit: "g" }, { ingredient: "egg", quantity: 2, unit: "each" }, { ingredient: "spinach", quantity: 60, unit: "g" }, { ingredient: "soy sauce", quantity: 10, unit: "ml" }, { ingredient: "vegetable oil", quantity: 5, unit: "ml" }],
    steps: ["Cook the rice following the pack instructions, then spread it out to cool a little.", "Heat the oil in a large pan and scramble the eggs until fully set.", "Add the spinach and stir until it wilts.", "Stir in the rice and soy sauce, and fry until piping hot."] },
  { title: "Chilli rice bowl", meal: "Lunch", minutes: 15, ingredients: [{ ingredient: "vegetable chilli", quantity: 1, unit: "portion" }, { ingredient: "rice", quantity: 75, unit: "g" }],
    steps: ["Cook the rice following the pack instructions.", "Heat the chilli until piping hot all the way through.", "Spoon the chilli over the rice."] },
  { title: "Creamy rice pudding", meal: "Breakfast", minutes: 35, ingredients: [{ ingredient: "rice", quantity: 50, unit: "g" }, { ingredient: "milk", quantity: 300, unit: "ml" }, { ingredient: "ground cinnamon", quantity: null, unit: "g" }],
    steps: ["Put the rice and milk in a small pan.", "Simmer gently for 25 to 30 minutes, stirring often, until soft and creamy.", "Add a splash more milk if it gets too thick.", "Serve warm with a pinch of cinnamon."] },
] };
const cannedSteps = request => ({ summary: "Simple steps for your meal.", title: request.title || "Tomato and spinach noodles",
  steps: ["Cook the egg noodles following the pack instructions, then drain.", "Warm the olive oil in a pan and soften the garlic for a minute.", "Add the chopped tomatoes and cook for 5 minutes until saucy.", "Stir in the spinach until it wilts, then toss everything with the noodles."],
  extras: ["olive oil", "garlic"] });
window.__food = food; window.__entries = () => entries;
const realFetch = window.fetch.bind(window);
// Branches with the timer and reply-routing endpoints get mirrors that use the app's own rules (no provider calls).
const timerStoreModule = Object.values(import.meta.glob("../../lib/timer-store.ts"))[0];
const routerModule = Object.values(import.meta.glob("../../lib/response-router.ts"))[0];
const { timerStartSchema } = timerStoreModule ? await timerStoreModule() : {};
const router = routerModule ? await routerModule() : null;
const replyManifest = router ? (await import("@/public/audio-library/manifest.json")).default : null;
const eligible = router ? router.eligibleReplies(replyManifest) : [];
const sha256 = async text => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))), b => b.toString(16).padStart(2, "0")).join("");
async function savedTimer() { const entry = entries.find(e => e.id === "timer" && e.kind === "timer"); const raw = entry ? JSON.stringify(entry.data) : null; return { timer: entry ? entry.data : null, version: raw ? await sha256(raw) : null }; }
let whoopConnected = params.get("whoop") === "1";
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
window.fetch = async (input, init = {}) => {
  const path = new URL(typeof input === "string" ? input : input.url, location.href).pathname;
  const method = (init.method || "GET").toUpperCase();
  if (path.startsWith("/api/wearables")) {
    // ?whoop=1: a connected WHOOP with today's steps; ?whoop=0: not connected yet. Without it, wearables aren't offered.
    if (!params.has("whoop")) return reply({ error: "Not found" }, 404);
    if (method === "POST" && path.endsWith("/disconnect")) whoopConnected = false;
    if (method === "POST") return reply({ ok: true });
    const now = new Date(), date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return reply({ connections: [{ source: "whoop", connected: whoopConnected, lastSyncedAt: whoopConnected ? new Date(now.getTime() - 4 * 60e3).toISOString() : null, steps: whoopConnected ? { count: 6240, date, dayStartedAt: "07:05" } : null }] });
  }
  if (path === "/api/state") {
    if (method === "GET") return reply({ recoveryScope: "a".repeat(64), settings, entries });
    // Mirrors app/api/state/route.ts, using the app's own validation where the branch has it.
    let body; try { body = JSON.parse(init.body || "{}"); } catch { return reply({ error: "Please check the entry and try again." }, 400); }
    try {
      if (body.action === "settings") { settings = daywellLib.normalizeSettings ? settingsSchema.parse({ ...normalize(settings), ...body.data }) : body.data; return reply({ ok: true, data: settings }); }
      if (body.action === "upsert" || body.action === "host-change") {
        const change = body.action === "host-change" ? (validateHostChange ? validateHostChange(body) : body) : { entries: validateSavedEntries ? validateSavedEntries(body.entries) : body.entries, removeIds: [] };
        const ids = new Set([...change.entries.map(e => e.id), ...change.removeIds]);
        entries = [...entries.filter(e => !ids.has(e.id)), ...change.entries];
        window.__saves = (window.__saves || 0) + 1;
        return reply({ ok: true, entries: change.entries });
      }
      if (body.action === "remove") { entries = entries.filter(e => e.id !== body.id); return reply({ ok: true }); }
      if (body.settings) settings = { ...settings, ...body.settings }; if (Array.isArray(body.entries)) entries = body.entries;
      return reply({ ok: true });
    } catch (error) { console.warn("harness rejected", error?.message); return reply({ error: "Please check the entry and try again." }, 400); }
  }
  if (path === "/api/timer" && timerStartSchema) {
    // Mirrors app/api/timer/route.ts and lib/timer-store.ts: compare-and-set on the saved timer.
    if (method === "GET") return reply(await savedTimer());
    let input; try { input = timerStartSchema.parse(JSON.parse(init.body || "{}")); } catch { return reply({ error: "Check the timer’s activity and duration, then try again." }, 400); }
    const before = await savedTimer();
    if (before.timer?.confirmationId === input.confirmationId) return reply(before);
    if (before.version !== input.version) return reply({ error: "Your timer changed since we discussed this. Check it before starting another.", ...before }, 409);
    const now = Date.now(), seconds = input.minutes * 60;
    const data = { title: input.title, duration: seconds, remaining: seconds, mode: input.companion === "pip" ? "Focus" : "Timer", companion: input.companion, startedAt: now, endAt: now + seconds * 1000, confirmationId: input.confirmationId };
    entries = [...entries.filter(e => !(e.id === "timer" && e.kind === "timer")), { id: "timer", kind: "timer", data }];
    return reply(await savedTimer());
  }
  if (path === "/api/respond" && router) {
    // Mirrors app/api/respond/route.ts with the picker off, as on the private app until JEV is approved.
    if (method === "GET") return reply({ picker: false, generation: false });
    let body; try { body = JSON.parse(init.body || "{}"); } catch { return reply({ error: "Try a short request from Daywell." }, 400); }
    return reply(await router.routeReply({ text: String(body.text || ""), area: body.area || "today", replies: eligible, allowAi: false, pick: undefined, signal: new AbortController().signal }));
  }
  if (path === "/api/food" && foodCommandSchema) {
    if (method === "GET") return reply({ recoveryScope: "a".repeat(64), revision: food.revision, state: foodView(), recentActions: food.actions.slice(0, 50) });
    let command;
    try { command = foodCommandSchema.parse(JSON.parse(init.body)); } catch { return reply({ error: "Please check the food details and try again." }, 400); }
    if (food.receipts.has(command.operationId)) return reply({ recoveryScope: "a".repeat(64), ok: true, revision: food.receipts.get(command.operationId), replayed: true });
    if (command.expectedRevision !== food.revision) return reply({ error: "Your food space has changed on another screen. Refresh and review your change before saving." }, 409);
    try {
      const undo = command.action.type === "undo" ? food.effects.get(command.action.operationId) : undefined;
      const { state, effect } = applyFoodCommand(food.state, command, undo);
      food.state = state; food.revision += 1; food.receipts.set(command.operationId, food.revision); food.effects.set(command.operationId, effect);
      if (command.action.type === "undo") { const target = food.actions.find(a => a.operationId === command.action.operationId); if (target) target.undone = true; if (effect.meal) entries = entries.filter(e => e.id !== effect.meal.id); }
      else if (command.action.type === "cook" && effect.meal) entries = [...entries, { id: effect.meal.id, kind: "food", data: effect.meal.data }];
      food.actions.unshift({ operationId: command.operationId, revision: food.revision, type: command.action.type, createdAt: new Date().toISOString(), undone: false, mealId: effect.meal?.id ?? null });
      return reply({ recoveryScope: "a".repeat(64), ok: true, revision: food.revision, replayed: false });
    } catch (error) { return reply({ error: error.message }, error.status || 400); }
  }
  if (path === "/api/voice") {
    // voice=day|all simulates a live conversation refused at a daily cap (texts from the voice limits branch).
    const limit = params.get("voice");
    if (!limit) return reply({ configured: false });
    if (method === "GET") return reply({ configured: true });
    return reply({ error: limit === "all"
      ? "Live conversations are unavailable until tomorrow because Daywell’s daily limit has been reached. Typing everyday commands still works."
      : "You’ve had today’s 10 live conversations. More are available tomorrow, and typing everyday commands still works." }, 429);
  }
  if (path === "/api/account") {
    if (method === "GET") return new Response(JSON.stringify({ about: "Sample export", entries }, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="daywell-data-2026-10-08.json"' } });
    return params.has("deletefails") ? reply({ error: "Your account couldn’t be deleted just now. Nothing was removed. Please try again." }, 503) : reply({ ok: true });
  }
  if (path === "/api/ai-report") {
    // Mirrors app/api/ai-report/route.ts with the real validation; reportfails simulates a storage outage.
    if (params.has("reportfails")) return reply({ error: "Your report couldn’t be sent. Please try again." }, 503);
    // Branches without PR #49 have no report module; glob tolerates the missing file.
    const reportModule = Object.values(import.meta.glob("../../lib/ai-report.ts"))[0];
    if (!reportModule) return reply({ error: "Reports aren’t on this branch." }, 404);
    const { aiReportSchema } = await reportModule();
    let parsed; try { parsed = aiReportSchema.safeParse(JSON.parse(init.body || "{}")); } catch { parsed = { success: false }; }
    if (!parsed.success) return reply({ error: "Choose what’s wrong, then send the report again." }, 400);
    window.__aiReports = [...(window.__aiReports || []), parsed.data];
    return reply({ ok: true });
  }
  if (path === "/api/plan") {
    // planstate=store|test|none, else the private test: Plus with no subscription.
    if (method === "POST") return reply({ ok: true });
    const state = params.get("planstate"), soon = Date.parse("2026-11-12T09:00:00Z");
    if (state === "none") return reply({ plan: "none", subscription: null, tester: params.has("tester") });
    const subscription = state === "store" ? { store: "app_store", productId: "daywell_plus_monthly", plan: "plus", status: "active", expiresAt: soon, willRenew: true }
      : state === "test" ? { store: "test", productId: "daywell_plus_monthly", plan: "plus", status: "active", expiresAt: soon, willRenew: false } : null;
    return reply({ plan: "plus", subscription, tester: params.has("tester") });
  }
  if (path === "/api/sign-in/code") {
    // Mirrors lib/public-access.ts messages; signinfails simulates the email service being down.
    if (params.has("signinfails")) return reply({ error: "We couldn't send a code just now. Try again in a few minutes." }, 503);
    const body = JSON.parse(init.body || "{}"), email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply({ error: "Enter your email address, like name@example.com." }, 400);
    window.__signIn = { email, tries: 5 };
    return reply({ ok: true });
  }
  if (path === "/api/sign-in/verify") {
    const body = JSON.parse(init.body || "{}"), pending = window.__signIn;
    if (!pending || pending.tries <= 0) return reply({ error: "That code has expired. Ask for a new one." }, 400);
    if (String(body.code) !== "246810") { pending.tries--; return reply({ error: "That code isn't right. Check the newest email from Daywell.", triesLeft: pending.tries }, 400); }
    return reply({ ok: true, created: pending.email !== "sam@example.com" });
  }
  if (path === "/api/recipes" && recipes) {
    if (method === "GET") return reply({ connected: !params.has("norecipes") });
    let request; try { request = recipes.recipeRequestSchema.parse(JSON.parse(init.body || "{}")); } catch { return reply({ error: "Please check the ingredients and try again." }, 400); }
    await new Promise(r => setTimeout(r, 400));
    if (request.kind === "basket") return reply({ ...recipes.basketIdeasDraft(cannedIdeas, food.state), source: "ai" });
    return reply({ ...recipes.mealStepsDraft(cannedSteps(request), request.ingredients.map(item => item.ingredient)), source: "ai" });
  }
  if (path === "/api/capture" && promo && draftEntries && mealPlanDraft) {
    if (method === "GET") return reply({ connected: true });
    const form = init.body, mode = String(form.get("mode") || "auto"), date = String(form.get("date"));
    await new Promise(r => setTimeout(r, 300));
    if (mode === "plan") return reply({ ...mealPlanDraft(cannedPlan, { start: String(form.get("planStart")), count: Number(form.get("planCount")), meal: String(form.get("planMeal")) }), transcript: "", source: "ai" });
    return reply({ ...draftEntries(cannedPhoto(date), date, settings.modules, mode), transcript: "", source: "ai" });
  }
  if (path === "/api/capture") return reply({ connected: false });
  return realFetch(input, init);
};
if (params.has("before")) { const st = document.createElement("style"); st.textContent = "html[data-reading-font=opendyslexic] .stillwater-dock[data-tabs=\"5\"] button{font-size:calc(14px*var(--rc-scale,1))!important}.well-pillar-heading{flex-wrap:nowrap!important}.well-pillar-heading>div{flex:0 1 auto!important}.calendar-navigation>div:last-child{flex-wrap:nowrap!important;max-width:none!important}.calendar-navigation label{flex-wrap:nowrap!important}.calendar-view-tabs{flex-wrap:nowrap!important;max-width:none!important}.calendar-view-tabs button{padding:11px 22px!important}.calendar-weekdays .day-short{display:none!important}.calendar-weekdays .day-long{display:inline!important}.well-pillar-heading h1{font-size:calc(32px*var(--rc-scale,1))!important}html[data-appearance-palette] .stillwater-shell .page-heading p{color:rgb(210,229,227)!important}.well-space .sleep-hero>p{color:var(--well-muted)!important}html[data-appearance-palette] :is(.calendar-view-tabs button:not([aria-pressed=true]),.calendar-add-actions button:not(.calendar-primary),.calendar-small){color:var(--dw-muted)!important}"; document.head.appendChild(st); }
{ const bar = params.get("bar"); if (bar) { const opts = await import("./bar-options.js"); const st = document.createElement("style"); st.textContent = opts.compactToday + (bar === "attached" ? opts.attached : bar === "fade" ? opts.fade : bar === "gradient" ? opts.gradient : ""); document.head.appendChild(st); } }
// Promo captures: the capture sheet's buttons use --well-accent, which is only defined inside .well-space, so in the
// app they render white on white (a real bug, reported to the owner on 14 Oct 2026). Promo captures show them fixed.
// &nopatch leaves the app's own CSS alone, for before/after previews of the real fix.
// ?fix=dialog adds the proposed rules (the "after" preview, before they're built): the dialog colour tokens for
// wellbeing.css, and rows that never shrink below their content for the capture sheet in capture.css.
if (params.get("fix") === "dialog") { const st = document.createElement("style"); st.textContent = "[data-slot=\"dialog-content\"]{--well-surface:var(--dw-surface,#fff7fb);--well-ink:var(--dw-ink,#522d46);--well-accent:var(--dw-accent,#803c65);--well-muted:var(--dw-muted,#7d536e);--well-line:var(--dw-line,#d8b7cc)}.food-capture-dialog{grid-auto-rows:max-content}"; document.head.appendChild(st); }
if (params.has("promo") && !params.has("nopatch")) { const st = document.createElement("style"); st.textContent = "[role=dialog]{--well-surface:var(--dw-surface,#fff7fb);--well-ink:var(--dw-ink,#522d46);--well-accent:var(--dw-accent,#803c65);--well-muted:var(--dw-muted,#7d536e);--well-line:var(--dw-line,#d8b7cc)}"; document.head.appendChild(st); }
if (params.has("still")) { const st = document.createElement("style"); st.textContent = "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}.stillwater-dock,.stillwater-header-button{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}"; document.head.appendChild(st); }
if (params.has("old17")) { const st = document.createElement("style"); st.textContent = ".response-bank-meta [data-handling]{color:var(--dw-muted)!important}.meditation-choices button{text-align:center!important}"; document.head.appendChild(st); }
// Standalone pages (page=meditate|bank|library); each exists only on branches that have it.
const pages = { meditate: import.meta.glob("../../app/meditate/space.tsx"), bank: import.meta.glob("../../app/response-bank/bank.tsx"), library: import.meta.glob("../../app/audio-library/library.tsx"),
  aireport: import.meta.glob("./ai-report-page.jsx"), account: import.meta.glob("../../app/account/your-data.tsx"), privacy: import.meta.glob("../../app/privacy/page.tsx"), support: import.meta.glob("../../app/support/page.tsx"), deleted: import.meta.glob("../../app/account-deleted/page.tsx"), signin: import.meta.glob("./sign-in-page.jsx"), plans: import.meta.glob("./plans-page.jsx") };
const pageLoader = Object.values(pages[params.get("page")] ?? {})[0];
const Page = pageLoader ? (await pageLoader()).default : null;
createRoot(document.getElementById("root")).render(Page ? <Page initialSessionId={params.get("session") ?? undefined} signOutHref="/signout-with-chatgpt?return_to=%2F" /> : <Daywell initialView={params.get("view") ?? "eat"} account={params.has("account") ? { email: "sam@example.com", emailSignIn: true, plan: "plus" } : undefined} />);
if (params.get("scroll")) setTimeout(() => window.scrollTo(0, Number(params.get("scroll"))), 1800);
if (params.get("anchor")) setTimeout(() => document.querySelector(params.get("anchor"))?.scrollIntoView({ block: "center", behavior: "instant" }), 1800);
