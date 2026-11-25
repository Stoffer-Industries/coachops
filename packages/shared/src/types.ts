export type EvidenceSource = "gymtrack" | "trainer_context";

export type ExceptionCategory =
  | "inactivity"
  | "planned_vs_actual_shortfall"
  | "stalled_progression"
  | "sensitive_note"
  | "connection_unavailable";

export type Severity = "low" | "medium" | "high" | "safety";

export type Confidence = "low" | "medium" | "high";

export type ReviewStatus =
  | "idle"
  | "running"
  | "completed"
  | "incomplete"
  | "failed";

export type DecisionKind = "approve" | "edit" | "dismiss" | "escalate_hold";

export type DeliveryStatus =
  | "not_applicable"
  | "pending"
  | "sent"
  | "failed"
  | "skipped_duplicate"
  | "held_for_human";

export interface GymTrackSet {
  id?: string;
  exerciseName: string;
  setIndex: number;
  reps: number;
  weight: number;
  unit: "kg" | "lb";
  plannedReps: number | null;
  plannedWeight: number | null;
}

export interface GymTrackWorkout {
  id: string;
  performedAt: string;
  notes: string | null;
  plannedWorkoutId: string | null;
  sets: GymTrackSet[];
}

export interface GymTrackHistory {
  workouts: GymTrackWorkout[];
}

export interface ProgressionSet {
  performedAt: string | null;
  workoutId: string | null;
  setIndex: number;
  reps: number;
  weight: number;
  unit: "kg" | "lb";
  plannedReps: number | null;
  plannedWeight: number | null;
}

export interface GymTrackProgression {
  exerciseName: string;
  sets: ProgressionSet[];
}

export interface TrainerContext {
  expectedCadenceDays: number;
  travelNotes?: string;
  equipmentNotes?: string;
  followUpNotes?: string;
  syntheticEmail?: string;
}

export interface RosterClient {
  id: string;
  displayName: string;
  mode: "fixture" | "live";
  demoRole:
    | "inactive"
    | "shortfall"
    | "stalled"
    | "sensitive"
    | "healthy"
    | "unavailable"
    | "live";
  trainerContext: TrainerContext;
  /** Env var name holding a GymTrack OAuth access token for live mode. Never commit the value. */
  tokenEnvVar?: string;
}

export interface EvidenceItem {
  source: EvidenceSource;
  label: string;
  detail: string;
  recordIds?: string[];
}

export interface RecommendedAction {
  kind: "check_in" | "adjust_plan" | "human_review";
  summary: string;
  draftSubject?: string;
  draftBody?: string;
}

/** Durable outbound marker — once status is "sent", later decisions must not clear or resend. */
export interface OutboundResult {
  status: "sent" | "failed";
  at: string;
  detail: string;
  subject?: string;
  body?: string;
  idempotencyKey: string;
}

export interface ReviewException {
  id: string;
  clientId: string;
  clientName: string;
  category: ExceptionCategory;
  severity: Severity;
  priority: number;
  confidence: Confidence;
  explanation: string;
  evidence: EvidenceItem[];
  recommendedAction: RecommendedAction;
  safetyEscalation: boolean;
  /** Survives subsequent approve/dismiss decisions; gates the send path permanently once sent. */
  outboundResult?: OutboundResult;
  decision?: {
    kind: DecisionKind;
    finalSubject?: string;
    finalBody?: string;
    decidedAt: string;
    deliveryStatus: DeliveryStatus;
    deliveryDetail?: string;
  };
}

export interface UnavailableClient {
  clientId: string;
  clientName: string;
  reason: string;
}

export interface MorningReview {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: ReviewStatus;
  rosterSize: number;
  attentionCount: number;
  exceptions: ReviewException[];
  unavailable: UnavailableClient[];
  notes: string[];
}

export interface AuditRecord {
  id: string;
  reviewId: string;
  exceptionId: string;
  clientId: string;
  category: ExceptionCategory;
  recommendationSummary: string;
  evidence: EvidenceItem[];
  decisionKind: DecisionKind;
  finalContent?: { subject: string; body: string };
  decidedAt: string;
  deliveryStatus: DeliveryStatus;
  deliveryDetail?: string;
}

export interface AgentReadiness {
  ok: boolean;
  service: string;
  version: string;
  mode: "fixture" | "live" | "mixed";
  sprite: {
    detected: boolean;
    name: string | null;
  };
  connectors: {
    openrouter: ConnectorProbe;
    resend: ConnectorProbe;
  };
  gymtrack: {
    endpoint: string;
    fixtureClients: number;
    liveClients: number;
  };
  checkedAt: string;
  messages: string[];
}

export interface ConnectorProbe {
  configured: boolean;
  reachable: boolean | null;
  detail: string;
}
