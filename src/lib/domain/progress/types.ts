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

export type MisconceptionCode =
  | 'sign_reversed'
  | 'zero_force_missed'
  | 'zero_force_false_positive'
  | 'wrong_joint_order'
  | 'reaction_count_error'
  | 'tension_compression_confusion';

export interface DeterminacySnapshot {
  kind: 'determinacy';
  m: number | null;
  r: number | null;
  j: number | null;
  classification: 'statically_determinate' | 'statically_indeterminate' | 'unstable' | null;
}

export interface ReactionsSnapshot {
  kind: 'reactions';
  answers: Record<string, number | null>;
}

export interface ZeroForceSnapshot {
  kind: 'zero_members';
  selectedMemberIds: string[];
}

export interface JointSequenceSnapshot {
  kind: 'joint_sequence';
  jointId: string | null;
  availableJointIds: string[];
  recommendedJointIds: string[];
}

export interface MemberForcesSnapshot {
  kind: 'member_forces';
  jointId: string;
  answers: Record<string, number | null>;
  unknownMemberIds: string[];
}

export type GuidedAnswersSnapshot =
  | DeterminacySnapshot
  | ReactionsSnapshot
  | ZeroForceSnapshot
  | JointSequenceSnapshot
  | MemberForcesSnapshot;

export interface BaseStepAttempt {
  createdAt: string; // ISO 8601
  isCorrect: boolean;
  score: number; // 0 to 1
  feedbackMessages: string[];
  misconceptions: string[];
  hintLevelUsed: number; // 0 to 3
  attemptNumber: number; // 1-indexed
}

export interface DeterminacyStepAttempt extends BaseStepAttempt {
  stepId: 'determinacy';
  answersSnapshot: DeterminacySnapshot;
}

export interface ReactionsStepAttempt extends BaseStepAttempt {
  stepId: 'reactions';
  answersSnapshot: ReactionsSnapshot;
}

export interface ZeroMembersStepAttempt extends BaseStepAttempt {
  stepId: 'zero_members';
  answersSnapshot: ZeroForceSnapshot;
}

export interface JointSequenceStepAttempt extends BaseStepAttempt {
  stepId: 'joint_sequence';
  answersSnapshot: JointSequenceSnapshot;
}

export interface MemberForcesStepAttempt extends BaseStepAttempt {
  stepId: 'member_forces';
  answersSnapshot: MemberForcesSnapshot;
}

export interface OtherStepAttempt extends BaseStepAttempt {
  stepId: 'overview' | 'summary';
  answersSnapshot?: never;
}

export type GuidedStepAttempt =
  | DeterminacyStepAttempt
  | ReactionsStepAttempt
  | ZeroMembersStepAttempt
  | JointSequenceStepAttempt
  | MemberForcesStepAttempt
  | OtherStepAttempt;


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
