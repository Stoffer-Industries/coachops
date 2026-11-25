import cors from "cors";
import express from "express";
import {
  applyDecision,
  buildReadiness,
  defaultStorePath,
  FileStore,
  loadRoster,
  runMorningReview,
  type DecisionKind
} from "@coachops/shared";

const VERSION = "0.1.0";
const PORT = Number(process.env.PORT ?? process.env.COACHOPS_PORT ?? 8080);
const store = new FileStore(defaultStorePath());

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "coachops-agent", version: VERSION });
});

app.get("/ready", async (_req, res) => {
  const readiness = await buildReadiness(VERSION);
  res.status(readiness.ok ? 200 : 503).json(readiness);
});

app.get("/roster", (_req, res) => {
  const roster = loadRoster().map((c) => ({
    id: c.id,
    displayName: c.displayName,
    mode: c.mode,
    demoRole: c.demoRole,
    expectedCadenceDays: c.trainerContext.expectedCadenceDays,
    hasTravelNotes: Boolean(c.trainerContext.travelNotes),
    hasEquipmentNotes: Boolean(c.trainerContext.equipmentNotes),
    syntheticEmail: c.trainerContext.syntheticEmail
  }));
  res.json({ roster, size: roster.length });
});

app.get("/reviews/latest", async (_req, res) => {
  const latest = await store.latest();
  if (!latest) {
    res.status(404).json({ error: "No review yet." });
    return;
  }
  res.json(latest);
});

app.get("/reviews/:id", async (req, res) => {
  const review = await store.getReview(req.params.id);
  if (!review) {
    res.status(404).json({ error: "Review not found." });
    return;
  }
  res.json(review);
});

app.post("/reviews", async (_req, res) => {
  try {
    const review = await runMorningReview();
    await store.saveReview(review);
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({
      status: "failed",
      error: err instanceof Error ? err.message : "Review failed."
    });
  }
});

app.post("/reviews/:reviewId/exceptions/:exceptionId/decision", async (req, res) => {
  try {
    const kind = String(req.body?.kind ?? "") as DecisionKind;
    if (!["approve", "edit", "dismiss"].includes(kind)) {
      res.status(400).json({ error: "kind must be approve, edit, or dismiss." });
      return;
    }
    const result = await applyDecision(store, {
      reviewId: req.params.reviewId,
      exceptionId: req.params.exceptionId,
      kind,
      subject: req.body?.subject,
      body: req.body?.body
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Decision failed."
    });
  }
});

app.get("/audit", async (_req, res) => {
  res.json({ audit: await store.listAudit() });
});

app.post("/demo/reset", async (_req, res) => {
  await store.resetDemo();
  res.json({ ok: true, message: "Demo state cleared. Fixtures remain unchanged." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`coachops-agent listening on 0.0.0.0:${PORT}`);
});
