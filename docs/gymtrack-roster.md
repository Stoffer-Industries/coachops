# GymTrack-backed roster

GymTrack authorises agents **per user** via MCP OAuth (`https://gymtrack-mcp.fly.dev/mcp`). CoachOps does **not** use a trainer-wide bypass. The roster is a list of independently consented connections.

## Tools used

| Tool | Purpose |
|------|---------|
| `read_history` | Recent workouts, notes, planned-versus-actual sets |
| `read_exercise_progression` | Per-exercise loading over time |

## Public demo (fixtures)

Default mode loads synthetic clients from `@coachops/shared` fixtures that mirror GymTrack MCP response shapes:

| Client | Role |
|--------|------|
| Alex Rivera | Inactivity vs expected cadence |
| Jordan Lee | Repeated planned-vs-actual shortfall |
| Sam Okonkwo | Stalled progression |
| Casey Nguyen | Sensitive / pain note → safety escalation |
| Morgan Patel, Riley Brooks | Healthy — should not surface |
| Taylor Kim | Unavailable connection |

Reset review/audit state: `npm run reset-demo` or `POST /demo/reset`. Fixtures themselves are code-defined and return to a known starting state every review when `COACHOPS_DEMO_NOW` is pinned.

## Private live validation

1. In ChatGPT (Plus+): Settings → Apps → Developer Mode → custom MCP `https://gymtrack-mcp.fly.dev/mcp` → OAuth authorize as the consenting user.
2. Export that user's access token into a Sprite env var (never commit).
3. Overlay a live roster entry:

```bash
export COACHOPS_LIVE_ROSTER_JSON='[{
  "id":"live-consenting-user",
  "displayName":"Consenting Athlete",
  "mode":"live",
  "demoRole":"live",
  "tokenEnvVar":"GYMTRACK_TOKEN_LIVE_1",
  "trainerContext":{"expectedCadenceDays":3,"syntheticEmail":"demo.only@coachops.example"}
}]'
```

Revoking GymTrack consent / clearing the token removes that client from future successful reviews; failures are reported as **unavailable**, never as a healthy empty history.

## Evidence labelling

Review items mark each evidence row as `gymtrack` or `trainer_context` so cadence, travel, and equipment notes are never presented as GymTrack facts.
