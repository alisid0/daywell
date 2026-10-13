import test from "node:test";
import assert from "node:assert/strict";
import { parseHostRequest, entriesForActions, guidanceAt, canUndoHostChange, actionModule, describeAction } from "../lib/host.ts";
import { schemas } from "../lib/daywell.ts";

test("greetings and help receive local replies without creating actions", () => {
  for (const phrase of ["hello", "HELLO!", "Hi Daywell", "hello, Daywell!", "Hey there", "Good evening, Daywell", "  hello   daywell  ", "Daywell?", "thanks", "Thank you, Daywell", "Hello, what can you do?", "How do I use this?", "Are you there?", "Can you hear me?"]) {
    const reply = parseHostRequest(phrase);
    assert.equal(reply.type, "reply", phrase);
    assert.ok(reply.message.length > 0, phrase);
    assert.equal("actions" in reply, false, phrase);
  }
  assert.match(parseHostRequest("Can you hear me?").message, /received your message/);
});

test("greeting prefixes keep the command and confirmation boundary intact", () => {
  assert.deepEqual(parseHostRequest("Hello Daywell, focus for ten minutes"), parseHostRequest("Focus for ten minutes"));
  assert.deepEqual(parseHostRequest("Hi, add milk to my list"), parseHostRequest("Add milk to my list"));
  for (const phrase of ["Hello, don't add milk", "Hello Daywell, add milk then book a flight", "Hello and delete everything", "Thanks and start a workout", "Can you hear me and save everything", "hello ".repeat(110)]) {
    assert.equal(parseHostRequest(phrase).type, "unknown", phrase);
  }
});

test("one request routes shopping and focus without requiring a mascot name", () => {
  const plan = parseHostRequest("Add milk and eggs to my list and help me focus on my email for ten minutes");
  assert.equal(plan.type, "plan");
  assert.deepEqual(plan.actions, [{ type: "grocery", titles: ["milk", "eggs"] }, { type: "activity", companion: "pip", title: "my email", minutes: 10 }]);
  assert.deepEqual(plan.actions.map(actionModule), ["grocery", "focus"]);
});
test("everyday shopping phrases become a shopping plan the person confirms", () => {
  for (const [phrase, titles] of [
    ["I need to buy eggs and chicken", ["eggs", "chicken"]],
    ["I need to buy some eggs and chicken for dinner", ["eggs", "chicken"]],
    ["We’re out of milk", ["milk"]],
    ["I'm running low on bread and butter", ["bread", "butter"]],
    ["We've run out of washing-up liquid", ["washing-up liquid"]],
    ["Put oat milk on my shopping list", ["oat milk"]],
    ["I have to buy apples, rice and tea", ["apples", "rice", "tea"]],
    ["Need to buy bin bags", ["bin bags"]],
    ["Get bread from the shop", ["bread"]],
    ["Remind me to buy milk", ["milk"]],
  ]) {
    const plan = parseHostRequest(phrase);
    assert.equal(plan.type, "plan", phrase);
    assert.deepEqual(plan.actions, [{ type: "grocery", titles }], phrase);
  }
  assert.deepEqual(parseHostRequest("We're out of milk and I need to buy eggs").actions, [{ type: "grocery", titles: ["milk", "eggs"] }]);
  assert.deepEqual(parseHostRequest("Add milk and focus for 10 minutes and buy eggs").actions.map(action => action.type), ["grocery", "activity"]);
  assert.equal(describeAction({ type: "grocery", titles: ["eggs", "chicken"] }), "Add eggs and chicken to your shopping list");
  assert.equal(describeAction({ type: "grocery", titles: ["apples", "rice", "tea"] }), "Add apples, rice and tea to your shopping list");
  assert.equal(describeAction({ type: "grocery", titles: ["milk"] }), "Add milk to your shopping list");
});
test("phrases about the person, or that aren't about buying, are not shopping", () => {
  for (const phrase of ["I'm out of energy", "I'm running out of time", "I'm out of patience today", "I need to get some sleep", "I need to pick up the kids", "I need a break", "Add milk and get going", "Remind me to buy milk tomorrow"]) {
    assert.equal(parseHostRequest(phrase).type, "unknown", phrase);
  }
});
test("unsupported compound requests and negative instructions never partially save", () => {
  for (const phrase of ["Add milk and remind me tomorrow", "Don't add milk", "Add milk and don't start a timer", "Focus for ten minutes and start a walk for fifteen minutes", "Set an alarm for 7", "Set an alarm for 7 am tomorrow", "Set an alarm for 29 pm", "Focus for 0 minutes", "Start a workout for 999 minutes", "Add milk then book a flight"]) {
    assert.equal(parseHostRequest(phrase).type, "unknown", phrase);
  }
});
test("activity mapping leaves Tock quiet and gives the three companions specific activities", () => {
  for (const [phrase, companion, minutes] of [["Help me wind down for five minutes", "luma", 5], ["Start a walk for fifteen minutes", "bounce", 15], ["Set a timer for five minutes", "tock", 5], ["Focus on my email for twenty five minutes", "pip", 25]]) {
    const parsed = parseHostRequest(phrase);
    assert.equal(parsed.type, "plan", phrase);
    assert.equal(parsed.actions[0].companion, companion);
    assert.equal(parsed.actions[0].minutes, minutes);
  }
});
test("plans become valid stored records, including the activity identity", () => {
  let id = 0;
  const plan = parseHostRequest("Add milk and focus on my email for 10 minutes");
  const entries = entriesForActions(plan.actions, "2026-10-04", 100000, () => `test-${++id}`);
  entries.forEach(entry => assert.deepEqual(schemas[entry.kind].parse(entry.data), entry.data));
  assert.equal(entries[1].data.endAt, 700000);
  assert.equal(entries[1].data.companion, "pip");
  assert.equal(entries[1].data.startedAt, 100000);
  assert.equal(entries[1].id, "timer");
  const alarm = parseHostRequest("Set an alarm for 7:30 pm");
  assert.equal(alarm.actions[0].time, "19:30");
});
test("no calorie or sleep facts are invented for logging requests", () => {
  assert.deepEqual(parseHostRequest("Log a meal"), { type: "open", module: "food", kind: "food" });
  assert.deepEqual(parseHostRequest("Log my sleep"), { type: "open", module: "sleep", kind: "sleep" });
  assert.deepEqual(parseHostRequest("Show my shopping list"), { type: "open", module: "grocery", kind: undefined });
});
test("support levels and stop/undo are handled by the same host", () => {
  assert.deepEqual(parseHostRequest("Stay quiet"), { type: "support", level: "quiet" });
  assert.deepEqual(parseHostRequest("Encourage me occasionally"), { type: "support", level: "occasional" });
  assert.deepEqual(parseHostRequest("Guide me through this"), { type: "support", level: "guided" });
  assert.deepEqual(parseHostRequest("Stop"), { type: "control", command: "pause" });
  assert.deepEqual(parseHostRequest("Undo that"), { type: "control", command: "undo" });
  assert.deepEqual(parseHostRequest("What did you change?"), { type: "control", command: "changes" });
});
test("quiet gives no prompts, occasional waits until halfway, and ended activities stay silent", () => {
  assert.equal(guidanceAt("pip", .5, "quiet"), null);
  assert.equal(guidanceAt("tock", .5, "guided"), null);
  assert.equal(guidanceAt("pip", .26, "occasional"), null);
  assert.ok(guidanceAt("pip", .5, "occasional"));
  assert.equal(guidanceAt("luma", 1, "guided"), null);
  assert.ok(guidanceAt("bounce", .76, "guided"));
});
test("undo refuses to overwrite a newer change to an entry", () => {
  const original = { id: "x", kind: "grocery", data: { title: "Milk", quantity: "1", done: false } };
  assert.equal(canUndoHostChange([original], [original]), true);
  assert.equal(canUndoHostChange([{ ...original, data: { ...original.data, done: true } }], [original]), false);
  assert.equal(canUndoHostChange([], [original]), false);
});
