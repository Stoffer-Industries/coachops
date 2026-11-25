# Spec — CoachOps Demo and Hacksgiving Submission Readiness

## Source
- **Reference:** `brain/tasks/specs/open/coachops-hacksgiving.md`
- **Topic:** `outreach`
- **Spec Type:** `product feature`
- **Systems:** CoachOps, public source repository, Fly.io Hacksgiving submission surfaces
- **Previous revision:** _none_
- **Created:** 2026-11-24

**Status:** Draft
- [ ] **Approved by Tom**

---

## Outcome

CoachOps is independently understandable, repeatably demonstrable, and ready for a valid Hacksgiving submission: reviewers can inspect the public source, see the agent running on a Sprite with connectors, and follow a short end-to-end demonstration from roster review through safe trainer-approved action.

## Why

The product work only creates strategic and exposure value if judges and prospective users can quickly understand what changed, why the Sprite matters, and how the safety boundary works. Packaging and rehearsal must finish before the submission deadline rather than becoming last-minute documentation.

## Acceptance Criteria

- [ ] AC1: The public repository explains the user problem, product behaviour, GymTrack consent boundary, Sprite and connector usage, local demonstration flow, real-versus-synthetic data posture, and known limitations without requiring private workspace context.
- [ ] AC2: A reviewer can return the synthetic GymTrack demo accounts to a known starting state and complete the full flow from an authorised multi-client roster to prioritised exceptions, evidence inspection, trainer approval, delivered synthetic follow-up, and audited result.
- [ ] AC3: The end-to-end flow completes successfully in repeated clean rehearsals without manual data repair, secret editing, or intervention inside the Sprite.
- [ ] AC4: A short recorded demo clearly shows roster-level value, evidence-backed recommendations, explicit human approval, a real connector-mediated action, and the sensitive-case escalation.
- [ ] AC5: The submission package includes the required public code link, demo link, and concise description of the agent, and accurately states which parts run on the Sprite and which interfaces run locally.
- [ ] AC6: The approved public launch post tags `@flydotio`, avoids claims unsupported by the demonstrated behaviour, and accurately discloses which displayed records are synthetic demo data and whether any consenting real-user data was used only for private validation.
- [ ] AC7: The submission is ready for publication by 10:00 NZDT on Monday 30 November 2026, leaving recovery time before the official cutoff at approximately 20:59 NZDT.
- [ ] AC8: The project contains no provider credentials, unauthorised GymTrack data, real client details, private workspace references, or other SIndustries secrets in source, history, screenshots, video, logs, or submission copy.

## Non-Goals

- Publicly hosting the trainer dashboard.
- Launching CoachOps to real trainers or accepting customer data during the hackathon.
- Building pricing, billing, onboarding, or a production support model.
- Publishing any post or submission before Tom approves the final public claims.

## Notes

The live Hacksgiving rules require one entry built during 23–29 November 2026, running on a Sprite with at least one connector, plus a code link, demo, and short description. Video is encouraged but not scored separately. This task packages already accepted product behaviour; it must not expand scope after feature freeze.
