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

function outboundAlreadySent(ex: ReviewException): boolean {
  return ex.outboundResult?.status === "sent";
}

function buildAudit(
  input: DecisionInput,
  exception: ReviewException,
  decidedAt: string,
  deliveryStatus: DeliveryStatus,
  deliveryDetail?: string,
  finalContent?: { subject: string; body: string }
): AuditRecord {
  return {
    id: `audit-${crypto.randomUUID()}`,
    reviewId: input.reviewId,
    exceptionId: input.exceptionId,
    clientId: exception.clientId,
    category: exception.category,
    recommendationSummary: exception.recommendedAction.summary,
    evidence: exception.evidence,
    decisionKind:
      exception.safetyEscalation && (input.kind === "approve" || input.kind === "edit")
        ? "escalate_hold"
        : input.kind,
    finalContent,
    decidedAt,
    deliveryStatus,
    deliveryDetail
  };
}

export async function applyDecision(
  store: FileStore,
  input: DecisionInput
): Promise<{ review: MorningReview; exception: ReviewException; audit: AuditRecord }> {
  const review = await store.getReview(input.reviewId);
  if (!review) throw new Error(`Review ${input.reviewId} not found.`);
  const existing = review.exceptions.find((e) => e.id === input.exceptionId);
  if (!existing) throw new Error(`Exception ${input.exceptionId} not found.`);

  // Durable send gate — never reopen the send path once outbound succeeded.
  if (outboundAlreadySent(existing) && (input.kind === "approve" || input.kind === "edit")) {
    const decidedAt = new Date().toISOString();
    const detail =
      "Outbound already recorded for this recommendation; refusing duplicate send.";
    const audit = buildAudit(
      input,
      existing,
      decidedAt,
      "skipped_duplicate",
      detail,
      existing.outboundResult?.subject && existing.outboundResult?.body
        ? {
            subject: existing.outboundResult.subject,
            body: existing.outboundResult.body
          }
        : undefined
    );
    const { review: updatedReview, exception } = await store.updateExceptionWithAudit(
      input.reviewId,
      input.exceptionId,
      (ex) => ({
        ...ex,
        // Preserve outboundResult unchanged.
        decision: {
          kind: input.kind,
          finalSubject: ex.outboundResult?.subject ?? ex.decision?.finalSubject,
          finalBody: ex.outboundResult?.body ?? ex.decision?.finalBody,
          decidedAt,
          // Keep deliveryStatus as sent so the durable success marker stays visible.
          deliveryStatus: "sent",
          deliveryDetail: `${ex.outboundResult?.detail ?? "Previously sent."} (${detail})`
        }
      }),
      audit
    );
    return { review: updatedReview, exception, audit };
  }

  if (existing.safetyEscalation && (input.kind === "approve" || input.kind === "edit")) {
    const decidedAt = new Date().toISOString();
    const detail =
      "Safety-escalated items cannot use the routine send path. Trainer must handle directly.";
    const audit = buildAudit(input, existing, decidedAt, "held_for_human", detail);
    const { review: updatedReview, exception } = await store.updateExceptionWithAudit(
      input.reviewId,
      input.exceptionId,
      (ex) => ({
        ...ex,
        decision: {
          kind: "escalate_hold",
          decidedAt,
          deliveryStatus: "held_for_human",
          deliveryDetail: detail
        }
      }),
      audit
    );
    return { review: updatedReview, exception, audit };
  }

  if (input.kind === "dismiss") {
    const decidedAt = new Date().toISOString();
    const alreadySent = outboundAlreadySent(existing);
    const detail = alreadySent
      ? "Trainer dismissed after outbound was already delivered; send path remains closed."
      : "Trainer dismissed; no outbound action.";
    const deliveryStatus: DeliveryStatus = alreadySent ? "sent" : "not_applicable";
    const audit = buildAudit(input, existing, decidedAt, deliveryStatus, detail);
    const { review: updatedReview, exception } = await store.updateExceptionWithAudit(
      input.reviewId,
      input.exceptionId,
      (ex) => ({
        ...ex,
        // Never clear outboundResult on dismiss.
        decision: {
          kind: "dismiss",
          finalSubject: ex.outboundResult?.subject ?? ex.decision?.finalSubject,
          finalBody: ex.outboundResult?.body ?? ex.decision?.finalBody,
          decidedAt,
          deliveryStatus,
          deliveryDetail: detail
        }
      }),
      audit
    );
    return { review: updatedReview, exception, audit };
  }

  // approve or edit — first send attempt
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

  const deliveryStatus: DeliveryStatus =
    send.status === "sent" || send.status === "simulated" ? "sent" : "failed";

  const decidedAt = new Date().toISOString();
  const audit = buildAudit(
    input,
    existing,
    decidedAt,
    deliveryStatus,
    send.detail,
    { subject, body }
  );

  const { review: updatedReview, exception } = await store.updateExceptionWithAudit(
    input.reviewId,
    input.exceptionId,
    (ex) => {
      // Re-check durable marker inside the lock in case another request won the race.
      if (ex.outboundResult?.status === "sent") {
        return {
          ...ex,
          decision: {
            kind: input.kind,
            finalSubject: ex.outboundResult.subject,
            finalBody: ex.outboundResult.body,
            decidedAt,
            deliveryStatus: "sent",
            deliveryDetail: `${ex.outboundResult.detail} (duplicate send refused under lock)`
          }
        };
      }
      return {
        ...ex,
        outboundResult:
          deliveryStatus === "sent"
            ? {
                status: "sent",
                at: decidedAt,
                detail: send.detail,
                subject,
                body,
                idempotencyKey
              }
            : {
                status: "failed",
                at: decidedAt,
                detail: send.detail,
                subject,
                body,
                idempotencyKey
              },
        decision: {
          kind: input.kind,
          finalSubject: subject,
          finalBody: body,
          decidedAt,
          deliveryStatus,
          deliveryDetail: send.detail
        }
      };
    },
    audit
  );

  return { review: updatedReview, exception, audit };
}
