# Spec — CoachOps GymTrack-Backed Trainer Roster Data

## Source
- **Reference:** `brain/tasks/specs/open/coachops-hacksgiving.md`
- **Topic:** `app-gymtrack`
- **Spec Type:** `data pipeline`
- **Systems:** CoachOps, GymTrack MCP OAuth server, GymTrack workout history and progression tools
- **Previous revision:** _none_
- **Created:** 2026-11-24

**Status:** Draft
- [x] **Approved by Tom**

---

## Outcome

CoachOps can review multiple individually authorised GymTrack users as one trainer roster, using their real GymTrack workout history, planned-versus-actual performance, progression, and workout notes through the existing GymTrack agent interface. Private validation can include a consenting user's real records, while the public demo remains repeatable and publishable through synthetic demo accounts stored and accessed through GymTrack.

## Why

Using GymTrack as the workout system of record gives the hackathon direct product fit and exercises the agent APIs already shipped. GymTrack currently authorises agents per user rather than exposing a trainer-wide roster, so CoachOps must aggregate explicit client connections without weakening that isolation. Synthetic GymTrack accounts keep the public demonstration safe and repeatable; an explicitly consenting real account provides a private proof that the same path works against genuine workout history.

## Acceptance Criteria

- [ ] AC1: A trainer can assemble one CoachOps roster from multiple GymTrack users who have each explicitly authorised access to their own workout history and progression; revoking one user's GymTrack connection removes that user's records from future reviews without affecting the others.
- [ ] AC2: CoachOps retrieves workout history, planned-versus-actual set results, workout notes, and exercise progression through GymTrack's supported agent interface, without direct access to GymTrack database credentials or cross-user queries.
- [ ] AC3: Private validation proves the integration against at least one explicitly consenting user's genuine GymTrack workout history.
- [ ] AC4: The public demo roster contains enough synthetic GymTrack accounts and records to show recent inactivity, repeated planned-versus-actual shortfall or stalled progression, a sensitive note requiring escalation, and normal clients who should not be surfaced.
- [ ] AC5: CoachOps clearly distinguishes GymTrack-sourced workout evidence from CoachOps-owned trainer context such as expected training cadence, travel, equipment, or follow-up notes.
- [ ] AC6: The public demo accounts can be returned to a documented known starting state so repeated reviews produce comparable evidence through the same GymTrack interface used for private validation.
- [ ] AC7: A failed, expired, or revoked GymTrack connection is reported as unavailable and cannot be silently treated as a healthy client with no exceptions.
- [ ] AC8: No real user's GymTrack records, identity, contact details, or credentials appear in the public repository, screenshots, video, logs, or submission unless that user explicitly approves the specific material for publication.

## Non-Goals

- Adding a trainer-wide bypass credential or weakening GymTrack's existing per-user consent and data isolation.
- Building native trainer/client account relationships, roster management, or trainer billing inside GymTrack during the hackathon.
- Adding new GymTrack workout fields solely to satisfy CoachOps.
- Supporting arbitrary roster sizes, multiple trainers, or multi-tenant CoachOps billing.

## Notes

GymTrack currently exposes `read_history` and `read_exercise_progression` through its user-scoped MCP OAuth service. History includes workout notes and linked planned-versus-actual set values, which support the initial review cases; it does not expose a trainer-wide roster. CoachOps therefore treats its roster as a set of independently consented GymTrack connections. A separate official Sprites Connector used elsewhere in the end-to-end flow still satisfies Hacksgiving's connector requirement; this task does not bypass GymTrack's OAuth boundary merely to make GymTrack itself a connector.
