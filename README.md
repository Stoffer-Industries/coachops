# CoachOps

Personal operations agent for an independent trainer: review a roster of individually authorised [GymTrack](https://gymtrack-mcp.fly.dev/) connections, surface the few clients who need attention with evidence, and complete a **human-approved** synthetic follow-up.

Built for [Fly.io Hacksgiving 2026](https://fly.io/hacksgiving/) — the agent runs on a **Sprite** in the `quinn-stoffer` org and uses at least one official **Sprites Connector** (OpenRouter and/or Resend). Credentials stay in Fly Connectors, not in this repo.

## What it does

1. Aggregates a trainer roster from per-user GymTrack MCP authorisations (fixtures for the public demo).
2. Runs a morning review: inactivity, planned-vs-actual shortfall, stalled progression, sensitive-note escalation.
3. Serves a **local** trainer dashboard to inspect evidence and approve / edit / dismiss.
4. Sends approved routine follow-ups through the Resend connector to synthetic demo recipients only; safety cases never auto-send.

## Quick start (local)

```bash
npm install
npm run build
npm run test

# Terminal A — agent on :8080
npm run dev:agent

# Terminal B — dashboard on :5173
npm run dev:dashboard
```

Open http://127.0.0.1:5173 → **Run morning review**.

CLI:

```bash
npm run ready
npm run review
npm run reset-demo
```

## Sprite deploy

See [docs/fly-setup.md](docs/fly-setup.md). Short version:

```bash
sprite login
./scripts/sprite-setup.sh
# Configure OpenRouter + Resend connectors in the Fly dashboard for quinn-stoffer
./scripts/sprite-deploy.sh
```

## GymTrack consent boundary

CoachOps never receives a trainer-wide GymTrack credential. Each client is a separate OAuth connection to `https://gymtrack-mcp.fly.dev/mcp` (`read_history`, `read_exercise_progression`). Details: [docs/gymtrack-roster.md](docs/gymtrack-roster.md).

## Data posture

| Surface | Data |
|---------|------|
| Public demo / screenshots / video | Synthetic demo accounts (fixtures mirroring GymTrack shapes) |
| Private validation | Optional consenting real GymTrack user via live token env |
| Outbound email | Synthetic recipients only |

## Layout

```
agent/          Sprite HTTP agent (:8080)
dashboard/      Local trainer review UI
packages/shared Review engine, fixtures, GymTrack client, connectors
docs/           Fly, GymTrack, demo script
specs/          Accepted hackathon workstream specs
scripts/        Sprite setup / deploy helpers
```

## Submission checklist

- [ ] Public repo + this README
- [ ] Agent on Sprite with connector-mediated action
- [ ] Recorded demo per [docs/demo-script.md](docs/demo-script.md)
- [ ] Post tagging `@flydotio` after Tom approves claims

## Specs

Workstream index and acceptance criteria live under [`specs/`](specs/).
