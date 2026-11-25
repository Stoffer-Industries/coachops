# Spec — CoachOps Local Trainer Review Dashboard

## Source
- **Reference:** `brain/tasks/specs/open/coachops-hacksgiving.md`
- **Topic:** `app-gymtrack`
- **Spec Type:** `app feature`
- **Systems:** CoachOps local dashboard, CoachOps Sprite agent
- **Previous revision:** _none_
- **Created:** 2026-11-24

**Status:** Draft
- [ ] **Approved by Tom**

---

## Outcome

A trainer can use a local CoachOps dashboard to start a roster review, understand the resulting priority queue, inspect the evidence behind each recommendation, and record an approval, edit, or dismissal without needing to inspect raw data or operate the Sprite directly.

## Why

The hackathon concept needs a legible human decision surface. A small local dashboard is sufficient to demonstrate the value and safety model while avoiding public-site hosting, authentication, and multi-tenant product work that do not improve the core experiment.

## Acceptance Criteria

- [ ] AC1: The dashboard clearly shows the roster size, review status, time of the latest completed review, and number of clients currently requiring attention.
- [ ] AC2: A trainer can start a review from the dashboard and see whether the Sprite agent is working, completed, incomplete, or failed.
- [ ] AC3: The completed review is presented as a prioritised queue with client, category, severity, concise rationale, and proposed next action visible for every item.
- [ ] AC4: A trainer can inspect the specific workout, feedback, schedule, or equipment evidence supporting an exception without leaving the review experience.
- [ ] AC5: A trainer can approve, edit, or dismiss a proposed routine follow-up, and the interface makes clear that no outbound action occurs merely because a recommendation was generated.
- [ ] AC6: Safety-escalated items are visually distinct from routine follow-ups and cannot be mistaken for an approved automatic coaching action.
- [ ] AC7: The complete demo workflow can be operated locally without deploying a public dashboard or exposing authorised GymTrack records or synthetic demo accounts to an unauthenticated public site.

## Non-Goals

- Public dashboard hosting, user registration, authentication, or multi-tenancy.
- Mobile-native applications or production design-system integration.
- A general conversational interface.
- Editing the underlying synthetic workout records from the dashboard.

## Notes

Tom explicitly approved a local-only site/dashboard posture for the hackathon. The dashboard is a review and approval surface; the agent itself must still run on the Sprite to satisfy the product concept and Hacksgiving rules.
