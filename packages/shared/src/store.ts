import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
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
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async ensure(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
  }

  /** Serialize all read-modify-write transactions on this store instance. */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    // Keep the chain alive even if a task fails.
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private async readUnlocked(): Promise<CoachOpsState> {
    await this.ensure();
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as CoachOpsState;
    } catch {
      return defaultState();
    }
  }

  private async writeAtomic(state: CoachOpsState): Promise<void> {
    await this.ensure();
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
    await rename(tmp, this.filePath);
  }

  /** Single transactional mutation: read → mutate → atomic write. */
  async mutate<T>(fn: (state: CoachOpsState) => T | Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      const state = await this.readUnlocked();
      const result = await fn(state);
      await this.writeAtomic(state);
      return result;
    });
  }

  async read(): Promise<CoachOpsState> {
    return this.enqueue(() => this.readUnlocked());
  }

  async write(state: CoachOpsState): Promise<void> {
    return this.enqueue(() => this.writeAtomic(state));
  }

  async saveReview(review: MorningReview): Promise<MorningReview> {
    return this.mutate((state) => {
      state.reviews[review.id] = review;
      state.latestReview = review;
      return review;
    });
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
    return this.mutate((state) => {
      const review = state.reviews[reviewId];
      if (!review) throw new Error(`Review ${reviewId} not found.`);
      const idx = review.exceptions.findIndex((e) => e.id === exceptionId);
      if (idx < 0) throw new Error(`Exception ${exceptionId} not found.`);
      const updated = updater(review.exceptions[idx]);
      review.exceptions[idx] = updated;
      state.reviews[reviewId] = review;
      if (state.latestReview?.id === reviewId) state.latestReview = review;
      return { review, exception: updated };
    });
  }

  /**
   * Atomically update an exception and append its audit record in one write,
   * so a crash/race between the two cannot drop either.
   */
  async updateExceptionWithAudit(
    reviewId: string,
    exceptionId: string,
    updater: (ex: ReviewException) => ReviewException,
    audit: AuditRecord
  ): Promise<{ review: MorningReview; exception: ReviewException }> {
    return this.mutate((state) => {
      const review = state.reviews[reviewId];
      if (!review) throw new Error(`Review ${reviewId} not found.`);
      const idx = review.exceptions.findIndex((e) => e.id === exceptionId);
      if (idx < 0) throw new Error(`Exception ${exceptionId} not found.`);
      const updated = updater(review.exceptions[idx]);
      review.exceptions[idx] = updated;
      state.reviews[reviewId] = review;
      if (state.latestReview?.id === reviewId) state.latestReview = review;
      state.audit.unshift(audit);
      return { review, exception: updated };
    });
  }

  async appendAudit(record: AuditRecord): Promise<void> {
    await this.mutate((state) => {
      state.audit.unshift(record);
    });
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
