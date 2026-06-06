/**
 * Progress tracking types.
 * These types define the local progress model.
 * The storage backend is abstracted behind ProgressRepository.
 */

export type GuidedStepId =
  | 'overview'
  | 'determinacy'
  | 'reactions'
  | 'zero_members'
  | 'joint_sequence'
  | 'member_forces'
  | 'summary';

export interface GuidedStepAttempt {
  stepId: GuidedStepId;
  createdAt: string; // ISO 8601
  isCorrect: boolean;
  score: number; // 0 to 1
  answersSnapshot: any; // Record of inputs/answers
  feedbackMessages: string[];
  misconceptions: string[];
  hintLevelUsed: number; // 0 to 3
  attemptNumber: number; // 1-indexed
}

export interface GuidedAttemptTelemetry {
  problemId: string;
  problemVersion: number;
  topic: string;
  startedAt: string; // ISO 8601
  completedAt?: string; // ISO 8601
  totalScore: number;
  completed: boolean;
  stepAttempts: GuidedStepAttempt[];
  misconceptionCounts: Record<string, number>;
  skillBreakdown: Record<string, number>;
  finalAnswers: Record<string, number>;
}

/** A single attempt at solving a problem. */
export interface Attempt {
  id: string;
  problemId: string;
  problemVersion: number;
  createdAt: string; // ISO 8601
  answers: Record<string, number>;
  score: number; // 0 to 1
  feedback: string[];
  completed: boolean;
  topic?: string;
  skillBreakdown?: Record<string, number>;
  misconceptions?: string[];
  guidedTelemetry?: GuidedAttemptTelemetry;
}

/** Aggregated progress for a single problem. */
export interface ProblemProgress {
  problemId: string;
  bestScore: number;
  attemptsCount: number;
  completed: boolean;
  lastAttemptAt: string | null;
}

/** Per-topic aggregate statistics. */
export interface TopicStats {
  total: number;
  attempted: number;
  completed: number;
  averageBestScore: number;
}

/** Global progress summary. */
export interface ProgressSummary {
  totalProblems: number;
  attemptedProblems: number;
  completedProblems: number;
  averageBestScore: number;
  byTopic: Record<string, TopicStats>;
}

/**
 * Versioned schema wrapper for localStorage persistence.
 * Bumping schemaVersion allows future migrations.
 */
export interface ProgressData {
  schemaVersion: number;
  attempts: Attempt[];
}

export const CURRENT_SCHEMA_VERSION = 1;
