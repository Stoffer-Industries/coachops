import type { AgentReadiness, ConnectorProbe } from "./types.js";
import { GYMTRACK_MCP_URL } from "./gymtrack.js";
import { loadRoster } from "./fixtures.js";

/**
 * Sprites Connectors are called from inside a Sprite without attaching credentials.
 * Outside a Sprite (local dashboard/dev), we only report configuration intent.
 */
export function gatewayUrl(provider: string, connectionId: string, path = ""): string {
  const clean = path.replace(/^\//, "");
  return `https://api.sprites.dev/v1/gateway/${provider}/${connectionId}/${clean}`;
}

export function isRunningOnSprite(): boolean {
  return Boolean(
    process.env.SPRITE_NAME ||
      process.env.SPRITES_SPRITE_NAME ||
      process.env.FLY_SPRITE_NAME
  );
}

export function openRouterConnectionId(): string | undefined {
  return process.env.COACHOPS_OPENROUTER_CONNECTION_ID;
}

export function resendConnectionId(): string | undefined {
  return process.env.COACHOPS_RESEND_CONNECTION_ID;
}

export async function probeConnector(
  provider: string,
  connectionId: string | undefined,
  testPath = ""
): Promise<ConnectorProbe> {
  if (!connectionId) {
    return {
      configured: false,
      reachable: null,
      detail: `Set COACHOPS_${provider.toUpperCase()}_CONNECTION_ID after creating the connector in the Fly.org dashboard.`
    };
  }

  if (!isRunningOnSprite()) {
    return {
      configured: true,
      reachable: null,
      detail: `Configured as ${connectionId}; live gateway calls only succeed from inside a Sprite.`
    };
  }

  try {
    const url = gatewayUrl(provider, connectionId, testPath);
    const res = await fetch(url, { method: "GET" });
    return {
      configured: true,
      reachable: res.status < 500,
      detail: `Gateway responded HTTP ${res.status} for ${provider}/${connectionId}.`
    };
  } catch (err) {
    return {
      configured: true,
      reachable: false,
      detail: err instanceof Error ? err.message : "Connector probe failed."
    };
  }
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}

export interface SendEmailResult {
  ok: boolean;
  status: "sent" | "failed" | "simulated";
  detail: string;
  providerMessageId?: string;
}

/**
 * Deliver via Resend Sprites Connector when on Sprite; otherwise simulate for local demo.
 * Idempotency is enforced by the caller (action store) — this function does not resend blindly.
 */
export async function sendDemoEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const connectionId = resendConnectionId();
  const from =
    process.env.COACHOPS_RESEND_FROM ?? "CoachOps Demo <onboarding@resend.dev>";

  if (!isRunningOnSprite() || !connectionId) {
    return {
      ok: true,
      status: "simulated",
      detail: `Simulated send to ${input.to} (subject: ${input.subject}). Configure Resend connector + run on Sprite for live delivery.`,
      providerMessageId: `sim_${input.idempotencyKey}`
    };
  }

  try {
    const res = await fetch(gatewayUrl("resend", connectionId, "emails"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        headers: {
          "X-CoachOps-Demo": "true",
          "X-CoachOps-Idempotency-Key": input.idempotencyKey
        }
      })
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        status: "failed",
        detail: `Resend connector HTTP ${res.status}: ${text.slice(0, 300)}`
      };
    }

    let messageId: string | undefined;
    try {
      const parsed = JSON.parse(text) as { id?: string };
      messageId = parsed.id;
    } catch {
      // ignore
    }

    return {
      ok: true,
      status: "sent",
      detail: `Delivered via Resend connector to ${input.to}.`,
      providerMessageId: messageId
    };
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      detail: err instanceof Error ? err.message : "Send failed."
    };
  }
}

export async function buildReadiness(version: string): Promise<AgentReadiness> {
  const roster = loadRoster();
  const fixtureClients = roster.filter((c) => c.mode === "fixture").length;
  const liveClients = roster.filter((c) => c.mode === "live").length;
  const onSprite = isRunningOnSprite();

  const [openrouter, resend] = await Promise.all([
    probeConnector("openrouter", openRouterConnectionId(), "models"),
    probeConnector("resend", resendConnectionId(), "domains")
  ]);

  const messages: string[] = [];
  if (!onSprite) {
    messages.push("Not running inside a Sprite; connector live probes are informational only.");
  }
  if (!openrouter.configured) {
    messages.push("OpenRouter connector id not configured.");
  }
  if (!resend.configured) {
    messages.push("Resend connector id not configured (local sends will simulate).");
  }
  if (liveClients === 0) {
    messages.push("Using synthetic GymTrack fixture roster for public demo.");
  }

  const ok =
    fixtureClients + liveClients > 0 &&
    (onSprite ? openrouter.configured || resend.configured : true);

  return {
    ok,
    service: "coachops-agent",
    version,
    mode: liveClients && fixtureClients ? "mixed" : liveClients ? "live" : "fixture",
    sprite: {
      detected: onSprite,
      name:
        process.env.SPRITE_NAME ??
        process.env.SPRITES_SPRITE_NAME ??
        process.env.FLY_SPRITE_NAME ??
        null
    },
    connectors: { openrouter, resend },
    gymtrack: {
      endpoint: GYMTRACK_MCP_URL,
      fixtureClients,
      liveClients
    },
    checkedAt: new Date().toISOString(),
    messages
  };
}
