# Spec — CoachOps Sprite Foundation and Project Isolation

## Source
- **Reference:** `brain/tasks/specs/open/coachops-hacksgiving.md`
- **Topic:** `app-gymtrack`
- **Spec Type:** `infra workflow`
- **Systems:** Fly.io Sprites, Sprites Connectors, Stoffer-Industries GitHub organisation
- **Previous revision:** _none_
- **Created:** 2026-11-24

**Status:** Draft
- [x] **Approved by Tom**

---

## Outcome

CoachOps has an isolated, reproducible project foundation: its source is available in a dedicated public Stoffer-Industries repository, its agent executes on a Sprite in a dedicated Fly.io personal organisation, and the running agent can successfully use an official Sprites Connector without placing the connector credential in project code or agent-visible configuration.

## Why

Hacksgiving requires the submitted personal agent to run on a Sprite and use at least one Sprites Connector. Proving those requirements first removes the largest eligibility risk and keeps the experiment isolated from SIndustries production infrastructure and GymTrack customer data.

## Acceptance Criteria

- [ ] AC1: CoachOps source is available in a dedicated public repository under the Stoffer-Industries GitHub organisation, with enough project documentation for another developer to understand its purpose and run the supported development workflow.
- [ ] AC2: CoachOps has a dedicated Fly.io personal organisation on the free tier, separate from existing SIndustries production and staging organisations.
- [ ] AC3: The CoachOps agent executes successfully on a Sprite in that organisation and exposes a clear readiness result to an operator.
- [ ] AC4: The running agent completes a live request through at least one official Sprites Connector, and the associated provider credential is absent from source control, application output, and agent-visible configuration.
- [ ] AC5: A new environment can be recreated from the documented project and Fly.io setup without relying on undocumented state from the SIndustries monorepo or the Mac mini.

## Non-Goals

- Building the trainer roster, review logic, dashboard, outbound action, or public demo.
- Deploying a public CoachOps website or dashboard.
- Changing any existing SIndustries Fly.io organisation, application, or production service.
- Integrating with production GymTrack.

## Notes

Fly.io's live Sprites documentation confirms that a Sprite is a persistent Linux computer for agents and that official connectors can mediate external API access without putting the provider credential inside the Sprite. The Hacksgiving rules require a Sprite plus at least one connector; this spec establishes that eligibility foundation before product work proceeds.

