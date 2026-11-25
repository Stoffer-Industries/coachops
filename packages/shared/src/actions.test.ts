import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { applyDecision } from "./actions.js";
import { DEMO_ROSTER, runMorningReview } from "./index.js";
import { FileStore } from "./store.js";

test("triple approve keeps outbound sent and never opens a second send", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "coachops-actions-"));
  const store = new FileStore(path.join(dir, "state.json"));
  const review = await runMorningReview(DEMO_ROSTER.filter((c) => c.demoRole === "inactive"));
  await store.saveReview(review);
  const ex = review.exceptions[0];
  assert.ok(ex);

  const first = await applyDecision(store, {
    reviewId: review.id,
    exceptionId: ex.id,
    kind: "approve"
  });
  assert.equal(first.exception.outboundResult?.status, "sent");
  assert.equal(first.exception.decision?.deliveryStatus, "sent");

  const second = await applyDecision(store, {
    reviewId: review.id,
    exceptionId: ex.id,
    kind: "approve"
  });
  assert.equal(second.exception.outboundResult?.status, "sent");
  assert.equal(second.audit.deliveryStatus, "skipped_duplicate");
  // Durable marker on the exception stays "sent", not overwritten to skipped_duplicate.
  assert.equal(second.exception.decision?.deliveryStatus, "sent");

  const third = await applyDecision(store, {
    reviewId: review.id,
    exceptionId: ex.id,
    kind: "approve"
  });
  assert.equal(third.exception.outboundResult?.status, "sent");
  assert.equal(third.audit.deliveryStatus, "skipped_duplicate");

  const dismiss = await applyDecision(store, {
    reviewId: review.id,
    exceptionId: ex.id,
    kind: "dismiss"
  });
  assert.equal(dismiss.exception.outboundResult?.status, "sent");
  assert.equal(dismiss.exception.decision?.deliveryStatus, "sent");

  const audit = await store.listAudit();
  assert.ok(audit.length >= 4);
});
