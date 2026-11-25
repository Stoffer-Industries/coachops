import { fixtureHistory, fixtureProgressions } from "./fixtures.js";
import type {
  GymTrackHistory,
  GymTrackProgression,
  RosterClient
} from "./types.js";

export const GYMTRACK_MCP_URL =
  process.env.GYMTRACK_MCP_URL ?? "https://gymtrack-mcp.fly.dev/mcp";

export class GymTrackConnectionError extends Error {
  constructor(
    public readonly clientId: string,
    message: string
  ) {
    super(message);
    this.name = "GymTrackConnectionError";
  }
}

interface McpJsonRpcResult {
  result?: {
    content?: Array<{ type: string; text?: string }>;
    structuredContent?: unknown;
  };
  error?: { message?: string; code?: number };
}

async function mcpCall(
  accessToken: string,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(GYMTRACK_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "tools/call",
      params: { name, arguments: args }
    })
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`GymTrack authorization failed (${res.status}).`);
  }
  if (!res.ok) {
    throw new Error(`GymTrack MCP HTTP ${res.status}.`);
  }

  const body = (await res.json()) as McpJsonRpcResult;
  if (body.error) {
    throw new Error(body.error.message ?? "GymTrack MCP tool error.");
  }

  if (body.result?.structuredContent) {
    return body.result.structuredContent;
  }

  const text = body.result?.content?.find((c) => c.type === "text")?.text;
  if (text) {
    return JSON.parse(text);
  }

  throw new Error("GymTrack MCP returned an empty tool result.");
}

export async function readClientHistory(
  client: RosterClient,
  limit = 20
): Promise<GymTrackHistory> {
  if (client.demoRole === "unavailable") {
    throw new GymTrackConnectionError(
      client.id,
      "GymTrack connection revoked or expired for this client."
    );
  }

  if (client.mode === "fixture") {
    return fixtureHistory(client.id);
  }

  const token = client.tokenEnvVar ? process.env[client.tokenEnvVar] : undefined;
  if (!token) {
    throw new GymTrackConnectionError(
      client.id,
      `Missing GymTrack token env ${client.tokenEnvVar ?? "(unset)"} for live client.`
    );
  }

  return (await mcpCall(token, "read_history", { limit })) as GymTrackHistory;
}

export async function readClientProgression(
  client: RosterClient,
  exerciseName: string,
  limit = 20
): Promise<GymTrackProgression> {
  if (client.demoRole === "unavailable") {
    throw new GymTrackConnectionError(
      client.id,
      "GymTrack connection revoked or expired for this client."
    );
  }

  if (client.mode === "fixture") {
    const found = fixtureProgressions(client.id).find(
      (p) => p.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );
    return found ?? { exerciseName, sets: [] };
  }

  const token = client.tokenEnvVar ? process.env[client.tokenEnvVar] : undefined;
  if (!token) {
    throw new GymTrackConnectionError(
      client.id,
      `Missing GymTrack token env ${client.tokenEnvVar ?? "(unset)"} for live client.`
    );
  }

  return (await mcpCall(token, "read_exercise_progression", {
    exerciseName,
    limit
  })) as GymTrackProgression;
}

/** Best-effort exercise names from recent history for progression checks. */
export function topExercisesFromHistory(history: GymTrackHistory, n = 3): string[] {
  const counts = new Map<string, number>();
  for (const w of history.workouts) {
    for (const s of w.sets) {
      counts.set(s.exerciseName, (counts.get(s.exerciseName) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name]) => name);
}
