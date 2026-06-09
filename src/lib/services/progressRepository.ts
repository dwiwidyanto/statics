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
  ProgressData,
} from '../domain/progress/types';
import type { ProblemModel } from '../domain/models/types';
import type { TrussModel } from '../domain/truss/types';

export type AnyProblem = ProblemModel | TrussModel;

export interface ProgressRepository {
  /** Persist a new attempt. */
  saveAttempt(attempt: Attempt): void;

  /** Get all attempts, optionally filtered by problemId. */
  getAttempts(problemId?: string): Attempt[];

  /** Get aggregated progress for one problem. */
  getProblemProgress(problemId: string): ProblemProgress;

  /** Get global progress summary across all problems. */
  getSummary(allProblems: AnyProblem[]): ProgressSummary;

  /** Export the full local progress payload. */
  exportProgress(): ProgressData;

  /** Import progress from an unknown JSON-compatible value. */
  importProgress(data: unknown, mode: 'replace' | 'merge', options?: { allowDangerousEmptyReplace?: boolean }): {
    importedAttempts: number;
    skippedAttempts: number;
    duplicateAttempts: number;
    internalDuplicateAttempts: number;
    schemaVersion: number;
    validAttempts: number;
    replacedAttempts: number;
    warnings: string[];
  };

  /** Erase all stored progress data. */
  reset(): void;
}
