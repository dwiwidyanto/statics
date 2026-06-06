/**
 * Abstract progress repository interface.
 *
 * Hides the storage mechanism so a backend API can be swapped in
 * without rewriting UI code.
 */

import type {
  Attempt,
  ProblemProgress,
  ProgressSummary,
} from '../domain/progress/types';
import type { ProblemModel } from '../domain/models/types';

export interface ProgressRepository {
  /** Persist a new attempt. */
  saveAttempt(attempt: Attempt): void;

  /** Get all attempts, optionally filtered by problemId. */
  getAttempts(problemId?: string): Attempt[];

  /** Get aggregated progress for one problem. */
  getProblemProgress(problemId: string): ProblemProgress;

  /** Get global progress summary across all problems. */
  getSummary(allProblems: ProblemModel[]): ProgressSummary;

  /** Erase all stored progress data. */
  reset(): void;
}
