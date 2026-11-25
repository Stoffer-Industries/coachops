#!/usr/bin/env bash
# Create / configure the CoachOps Sprite in the quinn-stoffer Fly.org.
set -euo pipefail

ORG="${FLY_ORG:-quinn-stoffer}"
SPRITE_NAME="${COACHOPS_SPRITE_NAME:-coachops}"

export PATH="${HOME}/.fly/bin:${HOME}/.local/bin:${PATH}"

if ! command -v sprite >/dev/null; then
  echo "Installing Sprites CLI..."
  curl https://sprites.dev/install.sh | bash
  export PATH="${HOME}/.local/bin:${PATH}"
fi

echo "Using org: ${ORG}"
sprite org list || true

if sprite list -o "${ORG}" --json 2>/dev/null | grep -q "\"${SPRITE_NAME}\""; then
  echo "Sprite ${SPRITE_NAME} already exists."
else
  echo "Creating sprite ${SPRITE_NAME}..."
  sprite create --skip-console -o "${ORG}" "${SPRITE_NAME}"
fi

sprite use -o "${ORG}" "${SPRITE_NAME}"
sprite info -o "${ORG}" -s "${SPRITE_NAME}"

echo
echo "Next:"
echo "  1. In Fly dashboard → ${ORG} → Connectors: enable OpenRouter + Resend, grant coachops* access"
echo "  2. Export COACHOPS_OPENROUTER_CONNECTION_ID / COACHOPS_RESEND_CONNECTION_ID on the Sprite"
echo "  3. Run scripts/sprite-deploy.sh"
