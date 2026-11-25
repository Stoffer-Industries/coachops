import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { FileStore } from "./store.js";
import type { AuditRecord } from "./types.js";

test("concurrent appendAudit calls all persist", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "coachops-store-"));
  const store = new FileStore(path.join(dir, "state.json"));

  const records: AuditRecord[] = Array.from({ length: 20 }, (_, i) => ({
    id: `audit-${i}`,
    reviewId: "r1",
    exceptionId: "e1",
    clientId: "c1",
    category: "inactivity",
    recommendationSummary: `n${i}`,
    evidence: [],
    decisionKind: "approve",
    decidedAt: new Date().toISOString(),
    deliveryStatus: "sent"
  }));

  await Promise.all(records.map((r) => store.appendAudit(r)));
  const audit = await store.listAudit();
  assert.equal(audit.length, 20);
  const ids = new Set(audit.map((a) => a.id));
  assert.equal(ids.size, 20);

  const raw = JSON.parse(await readFile(path.join(dir, "state.json"), "utf8")) as {
    audit: AuditRecord[];
  };
  assert.equal(raw.audit.length, 20);
});
