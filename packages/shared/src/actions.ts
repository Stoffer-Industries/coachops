import { sendDemoEmail } from "./connectors.js";
import type { FileStore } from "./store.js";
import type {
  AuditRecord,
  DecisionKind,
  DeliveryStatus,
  MorningReview,
  ReviewException
} from "./types.js";
import { loadRoster } from "./fixtures.js";

export interface DecisionInput {
  reviewId: string;
  exceptionId: string;
  kind: DecisionKind;
  subject?: string;
  body?: string;
}

function alreadyActed(ex: ReviewException): boolean {
  const status = ex.decision?.deliveryStatus;
  return (
    status === "sent" ||
    status === "held_for_human" ||
    status === "skipped_duplicate" ||
    status === "failed"
  );
}

export async function applyDecision(
  store: FileStore,
  input: DecisionInput
): Promise<{ review: MorningReview; exception: ReviewException; audit: AuditRecord }> {
  const review = await store.getReview(input.reviewId);
  if (!review) throw new Error(`Review ${input.reviewId} not found.`);
  const existing = review.exceptions.find((e) => e.id === input.exceptionId);
  if (!existing) throw new Error(`Exception ${input.exceptionId} not found.`);

  if (existing.safetyEscalation && (input.kind === "approve" || input.kind === "edit")) {
    const decidedAt = new Date().toISOString();
    const { review: updatedReview, exception } = await store.updateException(
      input.reviewId,
      input.exceptionId,
      (ex) => ({
        ...ex,
        decision: {
          kind: "escalate_hold",
          decidedAt,
          deliveryStatus: "held_for_human",
          deliveryDetail:
            "Safety-escalated items cannot use the routine send path. Trainer must handle directly."
        }
      })
    );

    const audit: AuditRecord = {
      id: `audit-${crypto.randomUUID()}`,
      reviewId: input.reviewId,
      exceptionId: input.exceptionId,
      clientId: exception.clientId,
      category: exception.category,
      recommendationSummary: exception.recommendedAction.summary,
      evidence: exception.evidence,
      decisionKind: "escalate_hold",
      decidedAt,
      deliveryStatus: "held_for_human",
      deliveryDetail: exception.decision?.deliveryDetail
    };
    await store.appendAudit(audit);
    return { review: updatedReview, exception, audit };
  }

  if (input.kind === "dismiss") {
    const decidedAt = new Date().toISOString();
    const { review: updatedReview, exception } = await store.updateException(
      input.reviewId,
      input.exceptionId,
      (ex) => ({
        ...ex,
        decision: {
          kind: "dismiss",
          decidedAt,
          deliveryStatus: "not_applicable",
          deliveryDetail: "Trainer dismissed; no outbound action."
        }
      })
    );
    const audit: AuditRecord = {
      id: `audit-${crypto.randomUUID()}`,
      reviewId: input.reviewId,
      exceptionId: input.exceptionId,
      clientId: exception.clientId,
      category: exception.category,
      recommendationSummary: exception.recommendedAction.summary,
      evidence: exception.evidence,
      decisionKind: "dismiss",
      decidedAt,
      deliveryStatus: "not_applicable",
      deliveryDetail: exception.decision?.deliveryDetail
    };
    await store.appendAudit(audit);
    return { review: updatedReview, exception, audit };
  }

  // approve or edit
  if (alreadyActed(existing) && existing.decision?.deliveryStatus === "sent") {
    const decidedAt = new Date().toISOString();
    const { review: updatedReview, exception } = await store.updateException(
      input.reviewId,
      input.exceptionId,
      (ex) => ({
        ...ex,
        decision: {
          ...(ex.decision ?? {
            kind: input.kind,
            decidedAt,
            deliveryStatus: "skipped_duplicate"
          }),
          kind: input.kind,
          decidedAt,
          deliveryStatus: "skipped_duplicate",
          deliveryDetail:
            "Outbound already recorded for this recommendation; refusing duplicate send."
        }
      })
    );
    const audit: AuditRecord = {
      id: `audit-${crypto.randomUUID()}`,
      reviewId: input.reviewId,
      exceptionId: input.exceptionId,
      clientId: exception.clientId,
      category: exception.category,
      recommendationSummary: exception.recommendedAction.summary,
      evidence: exception.evidence,
      decisionKind: input.kind,
      decidedAt,
      deliveryStatus: "skipped_duplicate",
      deliveryDetail: exception.decision?.deliveryDetail
    };
    await store.appendAudit(audit);
    return { review: updatedReview, exception, audit };
  }

  const subject =
    input.subject?.trim() ||
    existing.recommendedAction.draftSubject ||
    `CoachOps follow-up — ${existing.clientName}`;
  const body =
    input.body?.trim() ||
    existing.recommendedAction.draftBody ||
    existing.recommendedAction.summary;

  const rosterClient = loadRoster().find((c) => c.id === existing.clientId);
  const to =
    rosterClient?.trainerContext.syntheticEmail ??
    "demo.client@coachops.example";

  const idempotencyKey = `coachops:${input.reviewId}:${input.exceptionId}`;
  const send = await sendDemoEmail({
    to,
    subject,
    text: body,
    html: `<pre style="font-family: ui-sans-serif, system-ui">${body.replace(/</g, "&lt;")}</pre>`,
    idempotencyKey
  });

  const deliveryStatus: DeliveryStatus = send.status === "sent" || send.status === "simulated"
    ? "sent"
    : "failed";

  const decidedAt = new Date().toISOString();
  const { review: updatedReview, exception } = await store.updateException(
    input.reviewId,
    input.exceptionId,
    (ex) => ({
      ...ex,
      decision: {
        kind: input.kind,
        finalSubject: subject,
        finalBody: body,
        decidedAt,
        deliveryStatus,
        deliveryDetail: send.detail
      }
    })
  );

  const audit: AuditRecord = {
    id: `audit-${crypto.randomUUID()}`,
    reviewId: input.reviewId,
    exceptionId: input.exceptionId,
    clientId: exception.clientId,
    category: exception.category,
    recommendationSummary: exception.recommendedAction.summary,
    evidence: exception.evidence,
    decisionKind: input.kind,
    finalContent: { subject, body },
    decidedAt,
    deliveryStatus,
    deliveryDetail: send.detail
  };
  await store.appendAudit(audit);
  return { review: updatedReview, exception, audit };
}
