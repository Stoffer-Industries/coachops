# Spec — CoachOps Morning Roster Review Agent

## Source
- **Reference:** `brain/tasks/specs/open/coachops-hacksgiving.md`
- **Topic:** `app-gymtrack`
- **Spec Type:** `assistant feature`
- **Systems:** CoachOps agent, authorised GymTrack roster, Fly.io Sprite runtime
- **Previous revision:** _none_
- **Created:** 2026-11-24

**Status:** Draft
- [ ] **Approved by Tom**

---

## Outcome

A personal trainer can ask CoachOps for a morning review and receive a short prioritised queue of clients who need attention, with each exception grounded in specific roster evidence and paired with a bounded recommended next step.

## Why

The differentiated value is not generating another workout plan for one athlete. It is reducing a trainer's whole roster to the few situations requiring human judgement, allowing the trainer to maintain service quality and follow-through without manually inspecting every client record each morning.

## Acceptance Criteria

- [ ] AC1: A single review evaluates the trainer's complete available roster rather than requiring the trainer to request analysis client by client.
- [ ] AC2: The review can identify and distinguish the scoped routine exception types supported by current GymTrack evidence: no recent activity relative to the client's expected cadence, repeated planned-versus-actual shortfall, and stalled or regressing exercise progression.
- [ ] AC3: Each surfaced exception includes the affected client, its priority and category, the specific GymTrack records and any separately identified trainer context supporting it, a concise explanation, a recommended trainer action, and a confidence indication.
- [ ] AC4: The known exception cases in the public demo accounts are surfaced while normal connected clients are not included without a specific evidence-backed reason.
- [ ] AC5: Repeating a review against the unchanged known starting state produces materially consistent priorities and evidence, even if the wording varies.
- [ ] AC6: The review does not invent completed sessions, planned targets, client notes, constraints, or progression claims that are absent from GymTrack or clearly identified CoachOps-owned trainer context.
- [ ] AC7: Pain or medically sensitive content in a GymTrack workout note or trainer context is categorised for direct human review and is not converted into a diagnosis or automatic programme adjustment.
- [ ] AC8: Failure to retrieve one or more authorised GymTrack connections produces a clear incomplete-review state naming the unavailable clients rather than a confident-looking complete result.

## Non-Goals

- Generating full workout programmes or replacing a trainer's professional judgement.
- Diagnosing injuries, prescribing treatment, or giving medical advice.
- Messaging clients or changing their plans without a separate human approval step.
- General-purpose chat, nutrition coaching, billing, or lead management.

## Notes

The core product claim is roster-level attention management: multiple independently authorised GymTrack histories become a small evidence-backed decision queue. Current GymTrack data supports recent-activity, planned-versus-actual, progression, and note-based signals; broader readiness, recovery, schedule, or equipment claims require separately identified trainer context and must not be presented as GymTrack facts.
