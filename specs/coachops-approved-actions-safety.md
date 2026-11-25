# Spec — CoachOps Human-Approved Actions and Safety Escalation

## Source
- **Reference:** `brain/tasks/specs/open/coachops-hacksgiving.md`
- **Topic:** `app-gymtrack`
- **Spec Type:** `assistant feature`
- **Systems:** CoachOps agent, local trainer dashboard, Sprites Resend Connector, CoachOps action record
- **Previous revision:** _none_
- **Created:** 2026-11-24

**Status:** Draft
- [ ] **Approved by Tom**

---

## Outcome

CoachOps can turn a routine evidence-backed recommendation into a real client follow-up only after the trainer reviews and approves the final content, while sensitive cases stop at a clear human escalation and every decision and delivery result remains auditable.

## Why

The strongest demo is a closed loop from signal to safe action, not a static analysis screen. Requiring explicit trainer approval preserves professional judgement, demonstrates a credible operating model for personal agents, and prevents sensitive client feedback from triggering reckless autonomous behaviour.

## Acceptance Criteria

- [ ] AC1: For a routine exception, CoachOps prepares a client-specific follow-up draft that accurately reflects the evidence and proposed trainer action.
- [ ] AC2: No client communication is sent until the trainer explicitly approves the final content; generating or viewing a recommendation is not approval.
- [ ] AC3: The trainer can edit or dismiss a draft before any action occurs, and CoachOps uses only the final approved content.
- [ ] AC4: An approved follow-up is delivered through an official Sprites Connector to a controlled synthetic/demo recipient, with a clear success or failure result returned to the trainer.
- [ ] AC5: CoachOps records the original recommendation, supporting evidence, trainer decision, final approved content, decision time, and delivery result in an audit history.
- [ ] AC6: A pain or medically sensitive case cannot follow the routine send path; it is held for direct trainer review with no diagnosis, programme change, or medical recommendation generated automatically.
- [ ] AC7: Retrying or refreshing after an uncertain delivery result does not silently send the same approved communication more than once.
- [ ] AC8: Provider credentials used for outbound delivery are absent from source control, client-visible responses, agent-visible configuration, and audit content.

## Non-Goals

- Autonomous workout-plan changes or unsupervised client messaging.
- Medical diagnosis, treatment, rehabilitation advice, or emergency triage.
- Production email deliverability, bulk campaigns, SMS, push notifications, or trainer CRM features.
- Contacting real clients during the hackathon.

## Notes

Fly.io's live connector catalogue confirms that the Resend Connector can send email from a Sprite without placing the Resend API key inside it. Public demonstration must use controlled synthetic recipients. Anything that could plausibly require clinical judgement remains a stop-and-escalate case.

