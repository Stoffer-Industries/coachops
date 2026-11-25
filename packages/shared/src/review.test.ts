import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_ROSTER, demoNow } from "./fixtures.js";
import { runMorningReview } from "./review.js";
import { detectSensitiveContent } from "./sensitive.js";

test("demoNow is fixed for deterministic reviews", () => {
  const a = demoNow().toISOString();
  const b = demoNow().toISOString();
  assert.equal(a, b);
});

test("sensitive detector catches pain notes", () => {
  assert.equal(
    detectSensitiveContent("Sharp pain in right shoulder during overhead press"),
    true
  );
  assert.equal(detectSensitiveContent("Felt strong today"), false);
});

test("morning review surfaces known demo exceptions and skips healthy clients", async () => {
  const review = await runMorningReview(DEMO_ROSTER);
  assert.ok(review.status === "completed" || review.status === "incomplete");
  assert.equal(review.rosterSize, DEMO_ROSTER.length);

  const byClient = new Map(review.exceptions.map((e) => [e.clientId, e]));
  assert.ok(byClient.has("demo-alex-inactive"));
  assert.equal(byClient.get("demo-alex-inactive")?.category, "inactivity");

  assert.ok(byClient.has("demo-jordan-shortfall"));
  assert.equal(
    byClient.get("demo-jordan-shortfall")?.category,
    "planned_vs_actual_shortfall"
  );

  assert.ok(byClient.has("demo-sam-stalled"));
  assert.equal(byClient.get("demo-sam-stalled")?.category, "stalled_progression");

  assert.ok(byClient.has("demo-casey-sensitive"));
  assert.equal(byClient.get("demo-casey-sensitive")?.safetyEscalation, true);
  assert.equal(byClient.get("demo-casey-sensitive")?.category, "sensitive_note");

  assert.equal(byClient.has("demo-morgan-healthy"), false);
  assert.equal(byClient.has("demo-riley-healthy"), false);

  assert.ok(review.unavailable.some((u) => u.clientId === "demo-taylor-unavailable"));
  assert.equal(review.status, "incomplete");

  for (const ex of review.exceptions) {
    assert.ok(ex.evidence.some((e) => e.source === "gymtrack"));
  }
});

test("repeated review against unchanged fixtures is materially consistent", async () => {
  const a = await runMorningReview(DEMO_ROSTER);
  const b = await runMorningReview(DEMO_ROSTER);
  const catsA = a.exceptions.map((e) => `${e.clientId}:${e.category}`).sort();
  const catsB = b.exceptions.map((e) => `${e.clientId}:${e.category}`).sort();
  assert.deepEqual(catsA, catsB);
  assert.equal(a.attentionCount, b.attentionCount);
});
