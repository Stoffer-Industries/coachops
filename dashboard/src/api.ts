import type { MorningReview, Readiness } from "./types";

const BASE = import.meta.env.VITE_AGENT_URL ?? "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  ready: () => req<Readiness>("/ready"),
  latest: () => req<MorningReview>("/reviews/latest"),
  startReview: () => req<MorningReview>("/reviews", { method: "POST" }),
  decide: (
    reviewId: string,
    exceptionId: string,
    body: { kind: string; subject?: string; body?: string }
  ) =>
    req<{ review: MorningReview }>(
      `/reviews/${reviewId}/exceptions/${exceptionId}/decision`,
      { method: "POST", body: JSON.stringify(body) }
    ),
  reset: () => req<{ ok: boolean }>("/demo/reset", { method: "POST" })
};
