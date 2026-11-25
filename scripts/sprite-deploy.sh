#!/usr/bin/env bash
# Sync CoachOps onto the Sprite and register the agent HTTP service on port 8080.
set -euo pipefail

ORG="${FLY_ORG:-quinn-stoffer}"
SPRITE_NAME="${COACHOPS_SPRITE_NAME:-coachops}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OPENROUTER_ID="${COACHOPS_OPENROUTER_CONNECTION_ID:-}"
RESEND_ID="${COACHOPS_RESEND_CONNECTION_ID:-}"

export PATH="${HOME}/.fly/bin:${HOME}/.local/bin:${PATH}"

sprite use -o "${ORG}" "${SPRITE_NAME}"

echo "Syncing repository to Sprite..."
sprite exec --no-stdin -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "mkdir -p /home/sprite/coachops"
tar -C "${ROOT}" --exclude=node_modules --exclude=dist --exclude=.coachops --exclude=.git \
  -cf - . | sprite exec --stdin -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "tar -C /home/sprite/coachops -xf -"

sprite exec --no-stdin -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "cd /home/sprite/coachops && npm install && npm run build"

ENV_VARS="PORT=8080,COACHOPS_DEMO_NOW=2026-11-25T08:00:00+13:00,SPRITE_NAME=${SPRITE_NAME}"
if [[ -n "${OPENROUTER_ID}" ]]; then
  ENV_VARS+=",COACHOPS_OPENROUTER_CONNECTION_ID=${OPENROUTER_ID}"
fi
if [[ -n "${RESEND_ID}" ]]; then
  ENV_VARS+=",COACHOPS_RESEND_CONNECTION_ID=${RESEND_ID}"
fi

sprite exec --no-stdin -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "
  sprite-env services delete coachops-agent >/dev/null 2>&1 || true
  sprite-env services create coachops-agent \
    --cmd /.sprite/bin/npm \
    --args 'run,start:agent' \
    --dir /home/sprite/coachops \
    --http-port 8080 \
    --env '${ENV_VARS}' \
    --duration 10s
  curl -sS http://127.0.0.1:8080/ready
  echo
"

sprite info -o "${ORG}" -s "${SPRITE_NAME}"
echo "Agent should answer GET /ready and POST /reviews on the Sprite URL (token auth by default)."
