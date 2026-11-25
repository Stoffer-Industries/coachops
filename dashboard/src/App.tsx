import { useEffect, useState } from "react";
import { api } from "./api";
import type { MorningReview, Readiness, ReviewException } from "./types";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-NZ", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Pacific/Auckland"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function App() {
  const [ready, setReady] = useState<Readiness | null>(null);
  const [review, setReview] = useState<MorningReview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const selected =
    review?.exceptions.find((e) => e.id === selectedId) ?? review?.exceptions[0] ?? null;

  useEffect(() => {
    void (async () => {
      try {
        setReady(await api.ready());
        try {
          const latest = await api.latest();
          setReview(latest);
          setSelectedId(latest.exceptions[0]?.id ?? null);
        } catch {
          // no review yet
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Agent unreachable");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selected) {
      setSubject("");
      setBody("");
      return;
    }
    setSubject(selected.recommendedAction.draftSubject ?? "");
    setBody(selected.recommendedAction.draftBody ?? "");
  }, [selected?.id]);

  async function startReview() {
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const next = await api.startReview();
      setReview(next);
      setSelectedId(next.exceptions[0]?.id ?? null);
      setFlash(`Review ${next.status}: ${next.attentionCount} needing attention.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  async function decide(kind: "approve" | "edit" | "dismiss") {
    if (!review || !selected) return;
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const result = await api.decide(review.id, selected.id, {
        kind,
        subject: kind === "dismiss" ? undefined : subject,
        body: kind === "dismiss" ? undefined : body
      });
      setReview(result.review);
      const updated = result.review.exceptions.find((e) => e.id === selected.id);
      setFlash(
        updated?.decision
          ? `${updated.decision.kind} → ${updated.decision.deliveryStatus}. ${updated.decision.deliveryDetail ?? ""}`
          : "Decision recorded."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetDemo() {
    setBusy(true);
    try {
      await api.reset();
      setReview(null);
      setSelectedId(null);
      setFlash("Demo state cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <strong>CoachOps</strong>
          <span>Local trainer review — GymTrack roster attention queue</span>
        </div>
        <div className="actions">
          <button className="primary" disabled={busy} onClick={() => void startReview()}>
            {busy ? "Working…" : "Run morning review"}
          </button>
          <button disabled={busy} onClick={() => void resetDemo()}>
            Reset demo state
          </button>
        </div>
      </header>

      <div className="status-line">
        Agent: {ready ? (ready.ok ? "ready" : "degraded") : "checking…"}
        {ready ? ` · mode ${ready.mode}` : ""}
        {ready?.sprite.detected ? ` · sprite ${ready.sprite.name}` : " · local"}
        {review ? ` · review ${review.status}` : " · no review yet"}
      </div>

      <section className="stats">
        <div className="stat">
          <label>Roster size</label>
          <strong>{review?.rosterSize ?? ready?.gymtrack.fixtureClients ?? "—"}</strong>
        </div>
        <div className="stat">
          <label>Review status</label>
          <strong>{review?.status ?? "idle"}</strong>
        </div>
        <div className="stat">
          <label>Latest completed</label>
          <strong>{formatWhen(review?.completedAt)}</strong>
        </div>
        <div className="stat">
          <label>Needs attention</label>
          <strong>{review?.attentionCount ?? 0}</strong>
        </div>
      </section>

      {error ? <div className="notice safety">{error}</div> : null}
      {flash ? <div className="notice ok">{flash}</div> : null}

      <div className="layout">
        <section className="panel">
          <h2>Priority queue</h2>
          {!review ? (
            <p className="empty">Start a review to build the attention queue. Generating a recommendation never sends a message.</p>
          ) : (
            <>
              <div className="queue">
                {review.exceptions.map((ex) => (
                  <QueueItem
                    key={ex.id}
                    item={ex}
                    active={selected?.id === ex.id}
                    onSelect={() => setSelectedId(ex.id)}
                  />
                ))}
              </div>
              {review.unavailable.length > 0 ? (
                <div className="unavailable">
                  Incomplete:{" "}
                  {review.unavailable
                    .map((u) => `${u.clientName} (${u.reason})`)
                    .join("; ")}
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="panel detail">
          <h2>Evidence & decision</h2>
          {!selected ? (
            <p className="empty">Select a queue item to inspect GymTrack evidence and trainer context.</p>
          ) : (
            <>
              <h3>{selected.clientName}</h3>
              <p>{selected.explanation}</p>

              {selected.safetyEscalation ? (
                <div className="notice safety">
                  Safety escalation — no diagnosis, programme change, or automatic send. Direct trainer review only.
                </div>
              ) : (
                <div className="notice">
                  No outbound action occurs until you explicitly approve the final content below.
                </div>
              )}

              <div className="evidence">
                {selected.evidence.map((ev, i) => (
                  <article key={`${ev.label}-${i}`}>
                    <div className="source">
                      {ev.source} · {ev.label}
                    </div>
                    <div>{ev.detail}</div>
                  </article>
                ))}
              </div>

              <p>
                <strong>Proposed next step:</strong> {selected.recommendedAction.summary}
              </p>

              {!selected.safetyEscalation ? (
                <div className="draft">
                  <label>Subject</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} />
                  <label>Message</label>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} />
                </div>
              ) : null}

              <div className="actions" style={{ marginTop: "0.9rem" }}>
                {selected.safetyEscalation ? (
                  <button className="danger" disabled={busy} onClick={() => void decide("approve")}>
                    Acknowledge hold
                  </button>
                ) : (
                  <>
                    <button className="primary" disabled={busy} onClick={() => void decide("approve")}>
                      Approve & send
                    </button>
                    <button disabled={busy} onClick={() => void decide("edit")}>
                      Save edit & send
                    </button>
                  </>
                )}
                <button disabled={busy} onClick={() => void decide("dismiss")}>
                  Dismiss
                </button>
              </div>

              {selected.decision ? (
                <div className="notice ok" style={{ marginTop: "0.9rem" }}>
                  Decision: {selected.decision.kind} · delivery {selected.decision.deliveryStatus}
                  {selected.decision.deliveryDetail ? ` — ${selected.decision.deliveryDetail}` : ""}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function QueueItem({
  item,
  active,
  onSelect
}: {
  item: ReviewException;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`item ${active ? "active" : ""} ${item.safetyEscalation ? "safety" : ""}`}
      onClick={onSelect}
    >
      <strong>{item.clientName}</strong>
      <div className="meta">
        <span className={`badge ${item.safetyEscalation ? "safety" : item.severity}`}>
          {item.safetyEscalation ? "safety" : item.severity}
        </span>
        <span>{item.category}</span>
        <span>confidence {item.confidence}</span>
      </div>
      <span>{item.recommendedAction.summary}</span>
    </button>
  );
}
