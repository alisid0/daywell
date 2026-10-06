import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { chars, modes, poseAt, blendPose, furDefaults } from "../lib/companion-renderer.mjs";
import { activityCompanionMotion, hostCompanionMotion, motionTime, companionLayerFiles } from "../lib/companion-motion.ts";
import { companionIds } from "../lib/companions.ts";

test("every configured companion ships matching still and animation layers within the MVP asset budget", () => {
  assert.deepEqual(Object.keys(chars).sort(), [...companionIds].sort());
  let bytes = 0;
  for (const id of companionIds) for (const file of ["portrait.webp", ...Object.values(companionLayerFiles)]) {
    const path = new URL(`../public/companions/illustrated-v4/${id}/${file}`, import.meta.url);
    const buffer = readFileSync(path);
    assert.equal(buffer.toString("ascii", 0, 4), "RIFF", `${id}/${file}`);
    assert.equal(buffer.toString("ascii", 8, 12), "WEBP", `${id}/${file}`);
    bytes += statSync(path).size;
  }
  assert.ok(bytes < 5 * 1024 * 1024, "Do not ship bulk frame/video exports to the app");
  assert.equal(furDefaults.strength, .22, "Keep the approved minimal fur strength");
});

test("all seventy animation states produce finite poses and continuous loop boundaries", () => {
  for (const id of companionIds) for (const mode of Object.keys(modes)) {
    const seconds = mode === "reaction" ? 3 : 8;
    for (let time = 0; time <= seconds; time += 1 / 24) {
      for (const [key, value] of Object.entries(poseAt(id, mode, time))) assert.ok(Number.isFinite(value), `${id}/${mode}/${key}`);
    }
    if (mode !== "reaction") {
      const start = poseAt(id, mode, 0), end = poseAt(id, mode, 8);
      for (const key of Object.keys(start)) if (key !== "fur") assert.ok(Math.abs(start[key] - end[key]) < 1e-8, `${id}/${mode}/${key} loop seam`);
    }
  }
});

test("pose transitions preserve endpoints and celebrations do not loop", () => {
  const a = poseAt("luma", "idle", 0), b = poseAt("luma", "happy", 2);
  assert.deepEqual(blendPose(a, b, 0), a);
  const end = blendPose(a, b, 1);
  for (const key of Object.keys(b)) assert.ok(Math.abs(end[key] - b[key]) < 1e-10);
  assert.equal(motionTime("reaction", 100), 3);
  assert.equal(motionTime("idle", 17), 1);
  assert.equal(motionTime("idle", -1), 0);
});

test("voice expressions follow actual microphone states; sleep completion stays calm", () => {
  for (const mode of ["listening", "thinking", "speaking"]) assert.equal(hostCompanionMotion(mode), mode);
  assert.equal(hostCompanionMotion("blocked"), "concerned");
  assert.equal(hostCompanionMotion("connected"), "idle");
  assert.equal(activityCompanionMotion("luma", false, true), "sleepy");
  assert.equal(activityCompanionMotion("bounce", true, false), "encouraging");
  assert.equal(activityCompanionMotion("bounce", false, false), "idle");
  assert.equal(activityCompanionMotion("bounce", false, true), "happy");
});
