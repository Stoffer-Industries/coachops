# CoachOps Hacksgiving — Work Index

This is a tracking index, not an executable specification. CoachOps is a time-boxed GymTrack validation experiment for Fly.io Hacksgiving 2026, delivered through the linked feature specs below.

## Objective

Demonstrate a personal operations agent for an independent personal trainer that reviews a roster of individually authorised GymTrack connections, identifies the few clients requiring attention, explains the GymTrack evidence, and completes a safe human-approved follow-up action.

The experiment supports the **GymTrack** initiative and its **Money or Users** impact while also proving SIndustries' ability to shape, build, verify, and publicly demonstrate a small agent product under a fixed deadline. It does not create a new strategy initiative.

## Hard Constraints

- Source code lives in a new public repository under the Stoffer-Industries GitHub organisation.
- The agent runs on a Sprite in a new dedicated Fly.io personal organisation using the free tier.
- The running agent uses at least one official Sprites Connector.
- CoachOps reads workout history and progression through GymTrack's existing user-authorised agent interface rather than directly querying GymTrack's database.
- Each client connection preserves GymTrack's current per-user consent and isolation boundary; CoachOps has no trainer-wide bypass credential.
- Private validation may use workout data from an explicitly consenting GymTrack user. The public demo uses synthetic demo accounts stored in GymTrack unless that user separately approves specific real records for publication.
- CoachOps-owned trainer context and all outbound demo communications are synthetic.
- Sites and dashboards may run locally; public dashboard hosting is not required.
- The submission includes a public code link, a short demo, and an approved public post tagging `@flydotio`.

## Workstream Specs

1. [Sprite foundation and project isolation](coachops-sprite-foundation.md)
2. [GymTrack-backed trainer roster data](coachops-synthetic-roster-data.md)
3. [Morning roster review agent](coachops-morning-review-agent.md)
4. [Local trainer review dashboard](coachops-trainer-review-dashboard.md)
5. [Human-approved actions and safety escalation](coachops-approved-actions-safety.md)
6. [Demo and submission readiness](coachops-demo-submission-readiness.md)

## Dependencies

- Workstream 1 is the shared foundation.
- Workstreams 2 and 4 may proceed independently once the foundation is available.
- Workstream 3 depends on the GymTrack-backed roster data.
- Workstream 5 depends on the review agent and dashboard.
- Workstream 6 depends on the accepted end-to-end action loop.

## Delivery Window

- **Foundation and data proof:** Wednesday 25 November 2026.
- **Review agent and dashboard:** Thursday 26 November 2026.
- **Approved action loop and feature freeze:** Friday 27 November 2026.
- **Demo, documentation, and recording:** Saturday 28 November 2026.
- **Final QA and Tom approval of public claims:** Sunday 29 November 2026.
- **Publish and submit target:** Monday 30 November 2026 by 10:00 NZDT.
- **Official submission cutoff:** Monday 30 November 2026 at approximately 20:59 NZDT (midnight PST at the end of Sunday 29 November).

## Completion

CoachOps is complete when all six workstream specs are accepted and the submission package proves the complete loop from authorised GymTrack roster review to evidence-backed trainer decision and safe approved action.

<!-- backlog-maintenance: stub; left unpromoted pending a real Outcome or Acceptance Criteria section. -->
