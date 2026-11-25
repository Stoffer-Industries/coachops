#!/usr/bin/env bash
# Sync CoachOps onto the Sprite and register the agent HTTP service on port 8080.
set -euo pipefail

ORG="${FLY_ORG:-quinn-stoffer}"
SPRITE_NAME="${COACHOPS_SPRITE_NAME:-coachops}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

export PATH="${HOME}/.fly/bin:${HOME}/.local/bin:${PATH}"

sprite use -o "${ORG}" "${SPRITE_NAME}"

echo "Syncing repository to Sprite..."
sprite exec -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "mkdir -p /home/sprite/coachops"
# Prefer git clone when public; otherwise push local tree.
if sprite exec -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "test -d /home/sprite/coachops/.git"; then
  sprite exec -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "cd /home/sprite/coachops && git pull --ff-only || true"
else
  tar -C "${ROOT}" --exclude=node_modules --exclude=dist --exclude=.coachops --exclude=.git \
    -cf - . | sprite exec -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "tar -C /home/sprite/coachops -xf -"
fi

sprite exec -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "cd /home/sprite/coachops && npm install && npm run build"

# Service on 8080 (Sprite HTTP default)
sprite exec -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc \
  "sprite-env services create coachops-agent --cmd npm --args run,start:agent --http-port 8080 --cwd /home/sprite/coachops || sprite-env services restart coachops-agent"

echo "Readiness:"
sprite exec -o "${ORG}" -s "${SPRITE_NAME}" -- bash -lc "cd /home/sprite/coachops && npm run ready"

sprite url -o "${ORG}" -s "${SPRITE_NAME}" || true
echo "Agent should answer GET /ready and POST /reviews on the Sprite URL."
