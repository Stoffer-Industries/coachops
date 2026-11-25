import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditRecord, MorningReview, ReviewException } from "./types.js";

export interface CoachOpsState {
  latestReview: MorningReview | null;
  reviews: Record<string, MorningReview>;
  audit: AuditRecord[];
}

const defaultState = (): CoachOpsState => ({
  latestReview: null,
  reviews: {},
  audit: []
});

export class FileStore {
  constructor(private readonly filePath: string) {}

  private async ensure(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
  }

  async read(): Promise<CoachOpsState> {
    await this.ensure();
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as CoachOpsState;
    } catch {
      return defaultState();
    }
  }

  async write(state: CoachOpsState): Promise<void> {
    await this.ensure();
    await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
  }

  async saveReview(review: MorningReview): Promise<MorningReview> {
    const state = await this.read();
    state.reviews[review.id] = review;
    state.latestReview = review;
    await this.write(state);
    return review;
  }

  async getReview(id: string): Promise<MorningReview | null> {
    const state = await this.read();
    return state.reviews[id] ?? null;
  }

  async latest(): Promise<MorningReview | null> {
    const state = await this.read();
    return state.latestReview;
  }

  async updateException(
    reviewId: string,
    exceptionId: string,
    updater: (ex: ReviewException) => ReviewException
  ): Promise<{ review: MorningReview; exception: ReviewException }> {
    const state = await this.read();
    const review = state.reviews[reviewId];
    if (!review) throw new Error(`Review ${reviewId} not found.`);
    const idx = review.exceptions.findIndex((e) => e.id === exceptionId);
    if (idx < 0) throw new Error(`Exception ${exceptionId} not found.`);
    const updated = updater(review.exceptions[idx]);
    review.exceptions[idx] = updated;
    state.reviews[reviewId] = review;
    if (state.latestReview?.id === reviewId) state.latestReview = review;
    await this.write(state);
    return { review, exception: updated };
  }

  async appendAudit(record: AuditRecord): Promise<void> {
    const state = await this.read();
    state.audit.unshift(record);
    await this.write(state);
  }

  async listAudit(): Promise<AuditRecord[]> {
    const state = await this.read();
    return state.audit;
  }

  async resetDemo(): Promise<void> {
    await this.write(defaultState());
  }
}

export function defaultStorePath(): string {
  return (
    process.env.COACHOPS_STATE_PATH ??
    path.resolve(process.cwd(), ".coachops", "state.json")
  );
}
