export type EvidenceSource = "gymtrack" | "trainer_context";

export interface EvidenceItem {
  source: EvidenceSource;
  label: string;
  detail: string;
  recordIds?: string[];
}

export interface ReviewException {
  id: string;
  clientId: string;
  clientName: string;
  category: string;
  severity: string;
  priority: number;
  confidence: string;
  explanation: string;
  evidence: EvidenceItem[];
  recommendedAction: {
    kind: string;
    summary: string;
    draftSubject?: string;
    draftBody?: string;
  };
  safetyEscalation: boolean;
  decision?: {
    kind: string;
    finalSubject?: string;
    finalBody?: string;
    decidedAt: string;
    deliveryStatus: string;
    deliveryDetail?: string;
  };
}

export interface MorningReview {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  rosterSize: number;
  attentionCount: number;
  exceptions: ReviewException[];
  unavailable: Array<{ clientId: string; clientName: string; reason: string }>;
  notes: string[];
}

export interface Readiness {
  ok: boolean;
  mode: string;
  sprite: { detected: boolean; name: string | null };
  connectors: {
    openrouter: { configured: boolean; detail: string };
    resend: { configured: boolean; detail: string };
  };
  gymtrack: { fixtureClients: number; liveClients: number; endpoint: string };
  messages: string[];
}
