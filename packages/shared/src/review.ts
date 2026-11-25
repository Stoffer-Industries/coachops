import { demoNow, loadRoster } from "./fixtures.js";
import {
  GymTrackConnectionError,
  readClientHistory,
  readClientProgression,
  topExercisesFromHistory
} from "./gymtrack.js";
import { detectSensitiveContent } from "./sensitive.js";
import type {
  EvidenceItem,
  GymTrackHistory,
  GymTrackProgression,
  MorningReview,
  RecommendedAction,
  ReviewException,
  RosterClient,
  UnavailableClient
} from "./types.js";

function daysBetween(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24);
}

function draftCheckIn(client: RosterClient, reason: string): RecommendedAction {
  const subject = `Quick check-in — ${client.displayName}`;
  const body = [
    `Hi ${client.displayName.split(" ")[0]},`,
    "",
    reason,
    "",
    "Want to hop on a short message or tweak this week's plan?",
    "",
    "— Your coach (via CoachOps demo)"
  ].join("\n");
  return {
    kind: "check_in",
    summary: `Send a check-in about ${reason.toLowerCase()}`,
    draftSubject: subject,
    draftBody: body
  };
}

function analyzeInactivity(
  client: RosterClient,
  history: GymTrackHistory,
  now: Date
): ReviewException | null {
  const latest = history.workouts[0];
  const cadence = client.trainerContext.expectedCadenceDays;
  if (!latest) {
    return {
      id: `${client.id}:inactivity`,
      clientId: client.id,
      clientName: client.displayName,
      category: "inactivity",
      severity: "high",
      priority: 80,
      confidence: "high",
      explanation: `No GymTrack workouts on record while expected cadence is every ${cadence} days.`,
      evidence: [
        {
          source: "gymtrack",
          label: "Workout history",
          detail: "read_history returned zero workouts."
        },
        {
          source: "trainer_context",
          label: "Expected cadence",
          detail: `Trainer expects training every ${cadence} days.`
        }
      ],
      recommendedAction: draftCheckIn(
        client,
        "I noticed there are no recent GymTrack sessions logged against your usual cadence."
      ),
      safetyEscalation: false
    };
  }

  const last = new Date(latest.performedAt);
  const gap = daysBetween(now, last);
  if (gap <= cadence * 2) return null;

  const evidence: EvidenceItem[] = [
    {
      source: "gymtrack",
      label: "Last workout",
      detail: `Performed ${latest.performedAt} (${gap.toFixed(1)} days ago).`,
      recordIds: [latest.id]
    },
    {
      source: "trainer_context",
      label: "Expected cadence",
      detail: `Trainer expects training every ${cadence} days (threshold ~${cadence * 2} days).`
    }
  ];

  return {
    id: `${client.id}:inactivity`,
    clientId: client.id,
    clientName: client.displayName,
    category: "inactivity",
    severity: gap > cadence * 3 ? "high" : "medium",
    priority: Math.min(95, 50 + Math.round(gap)),
    confidence: "high",
    explanation: `${client.displayName} has not trained in ${Math.floor(gap)} days versus an expected cadence of every ${cadence} days.`,
    evidence,
    recommendedAction: draftCheckIn(
      client,
      `I noticed it's been about ${Math.floor(gap)} days since your last logged session, and your usual cadence is every ${cadence} days.`
    ),
    safetyEscalation: false
  };
}

function analyzeShortfall(
  client: RosterClient,
  history: GymTrackHistory
): ReviewException | null {
  const recent = history.workouts.slice(0, 3);
  let shortfallSessions = 0;
  const evidence: EvidenceItem[] = [];

  for (const w of recent) {
    const plannedSets = w.sets.filter((s) => s.plannedReps != null && s.plannedWeight != null);
    if (plannedSets.length === 0) continue;
    const misses = plannedSets.filter((s) => {
      const repsShort = (s.plannedReps ?? 0) - s.reps >= 2;
      const weightShort = (s.plannedWeight ?? 0) - s.weight >= 5;
      return repsShort || weightShort;
    });
    if (misses.length >= Math.ceil(plannedSets.length / 2)) {
      shortfallSessions += 1;
      evidence.push({
        source: "gymtrack",
        label: `Session ${w.id}`,
        detail: `${misses.length}/${plannedSets.length} sets missed planned targets (e.g. ${misses[0].exerciseName}: ${misses[0].reps}×${misses[0].weight} vs planned ${misses[0].plannedReps}×${misses[0].plannedWeight}).`,
        recordIds: [w.id, ...misses.map((m) => m.id).filter(Boolean) as string[]]
      });
    }
  }

  if (shortfallSessions < 2) return null;

  if (client.trainerContext.equipmentNotes) {
    evidence.push({
      source: "trainer_context",
      label: "Equipment constraint",
      detail: client.trainerContext.equipmentNotes
    });
  }

  return {
    id: `${client.id}:shortfall`,
    clientId: client.id,
    clientName: client.displayName,
    category: "planned_vs_actual_shortfall",
    severity: "medium",
    priority: 70,
    confidence: "high",
    explanation: `${client.displayName} missed planned targets in ${shortfallSessions} of the last ${recent.length} sessions with planned sets.`,
    evidence,
    recommendedAction: {
      kind: "adjust_plan",
      summary: "Review plan targets and send a supportive check-in about recent shortfalls.",
      draftSubject: `Plan tweak check-in — ${client.displayName}`,
      draftBody: [
        `Hi ${client.displayName.split(" ")[0]},`,
        "",
        "Your recent GymTrack sessions show repeated gaps versus planned sets. Want to dial targets back slightly so we rebuild consistency?",
        "",
        "— Your coach (via CoachOps demo)"
      ].join("\n")
    },
    safetyEscalation: false
  };
}

function analyzeStalled(
  client: RosterClient,
  progression: GymTrackProgression
): ReviewException | null {
  const tops = progression.sets
    .filter((s) => s.performedAt)
    .slice(0, 4);
  if (tops.length < 3) return null;

  const weights = tops.map((s) => s.weight);
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const flat = max - min <= 0.01;
  const regressing = weights[0] < weights[weights.length - 1] - 0.01;

  if (!flat && !regressing) return null;

  return {
    id: `${client.id}:stalled:${progression.exerciseName}`,
    clientId: client.id,
    clientName: client.displayName,
    category: "stalled_progression",
    severity: regressing ? "medium" : "low",
    priority: regressing ? 65 : 55,
    confidence: "medium",
    explanation: `${progression.exerciseName} looks ${regressing ? "regressing" : "stalled"} across the last ${tops.length} logged top sets.`,
    evidence: [
      {
        source: "gymtrack",
        label: `${progression.exerciseName} progression`,
        detail: tops
          .map(
            (s) =>
              `${s.performedAt}: ${s.reps}×${s.weight}${s.unit}`
          )
          .join("; "),
        recordIds: tops.map((s) => s.workoutId).filter(Boolean) as string[]
      }
    ],
    recommendedAction: {
      kind: "adjust_plan",
      summary: `Discuss progression strategy for ${progression.exerciseName}.`,
      draftSubject: `Progression check — ${client.displayName}`,
      draftBody: [
        `Hi ${client.displayName.split(" ")[0]},`,
        "",
        `GymTrack shows ${progression.exerciseName} holding steady without progression across recent sessions. Happy to adjust volume or loading next week.`,
        "",
        "— Your coach (via CoachOps demo)"
      ].join("\n")
    },
    safetyEscalation: false
  };
}

function analyzeSensitive(
  client: RosterClient,
  history: GymTrackHistory
): ReviewException | null {
  for (const w of history.workouts.slice(0, 5)) {
    if (!detectSensitiveContent(w.notes)) continue;
    return {
      id: `${client.id}:sensitive:${w.id}`,
      clientId: client.id,
      clientName: client.displayName,
      category: "sensitive_note",
      severity: "safety",
      priority: 100,
      confidence: "high",
      explanation: `GymTrack workout note may involve pain or medical sensitivity and needs direct trainer review. CoachOps will not auto-diagnose or change the programme.`,
      evidence: [
        {
          source: "gymtrack",
          label: "Workout note",
          detail: w.notes ?? "",
          recordIds: [w.id]
        }
      ],
      recommendedAction: {
        kind: "human_review",
        summary: "Hold for direct trainer review — no automatic client message or programme change."
      },
      safetyEscalation: true
    };
  }
  return null;
}

async function reviewClient(
  client: RosterClient,
  now: Date
): Promise<{ exceptions: ReviewException[]; unavailable?: UnavailableClient }> {
  try {
    const history = await readClientHistory(client, 20);
    const exceptions: ReviewException[] = [];

    const sensitive = analyzeSensitive(client, history);
    if (sensitive) {
      exceptions.push(sensitive);
      // Still surface other routine signals but safety stays highest priority.
    }

    const inactivity = analyzeInactivity(client, history, now);
    if (inactivity) exceptions.push(inactivity);

    const shortfall = analyzeShortfall(client, history);
    if (shortfall) exceptions.push(shortfall);

    const exerciseNames = topExercisesFromHistory(history, 3);
    for (const name of exerciseNames) {
      const progression = await readClientProgression(client, name, 20);
      const stalled = analyzeStalled(client, progression);
      if (stalled) exceptions.push(stalled);
    }

    return { exceptions };
  } catch (err) {
    const reason =
      err instanceof GymTrackConnectionError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Unknown GymTrack error";
    return {
      exceptions: [],
      unavailable: {
        clientId: client.id,
        clientName: client.displayName,
        reason
      }
    };
  }
}

export async function runMorningReview(roster = loadRoster()): Promise<MorningReview> {
  const startedAt = new Date().toISOString();
  const now = demoNow();
  const id = `review-${startedAt.slice(0, 19).replace(/[:T]/g, "")}-${crypto.randomUUID().slice(0, 8)}`;

  const exceptions: ReviewException[] = [];
  const unavailable: UnavailableClient[] = [];

  for (const client of roster) {
    const result = await reviewClient(client, now);
    exceptions.push(...result.exceptions);
    if (result.unavailable) unavailable.push(result.unavailable);
  }

  // Prefer one primary exception per client (highest priority), keep safety always.
  const byClient = new Map<string, ReviewException[]>();
  for (const ex of exceptions) {
    const list = byClient.get(ex.clientId) ?? [];
    list.push(ex);
    byClient.set(ex.clientId, list);
  }

  const surfaced: ReviewException[] = [];
  for (const [, list] of byClient) {
    list.sort((a, b) => b.priority - a.priority);
    const safety = list.filter((e) => e.safetyEscalation);
    if (safety.length) {
      surfaced.push(safety[0]);
      continue;
    }
    if (list[0]) surfaced.push(list[0]);
  }

  surfaced.sort((a, b) => b.priority - a.priority);

  const status =
    unavailable.length > 0
      ? "incomplete"
      : surfaced.length >= 0
        ? "completed"
        : "completed";

  const notes: string[] = [];
  if (unavailable.length) {
    notes.push(
      `Incomplete review: ${unavailable.length} client connection(s) unavailable.`
    );
  }
  notes.push(
    "GymTrack-sourced evidence is labelled gymtrack; cadence/equipment/travel notes are trainer_context."
  );

  return {
    id,
    startedAt,
    completedAt: new Date().toISOString(),
    status,
    rosterSize: roster.length,
    attentionCount: surfaced.length,
    exceptions: surfaced,
    unavailable,
    notes
  };
}
