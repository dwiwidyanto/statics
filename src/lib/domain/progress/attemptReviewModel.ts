import type { Attempt, GuidedAttemptTelemetry } from './types';
import type { TrussModel } from '../truss/types';

export type AttemptReviewModel =
  | { mode: 'not_found' }
  | { mode: 'summary_only'; attempt: Attempt; telemetry?: GuidedAttemptTelemetry; reason: 'no_guided_telemetry' | 'unsupported_topic' | 'legacy_or_malformed' }
  | { mode: 'missing_problem'; attempt: Attempt; telemetry: GuidedAttemptTelemetry; problemId: string }
  | { mode: 'truss_replay'; attempt: Attempt; telemetry: GuidedAttemptTelemetry; problem: TrussModel };

function hasUsableTelemetry(attempt: Attempt): attempt is Attempt & { guidedTelemetry: GuidedAttemptTelemetry } {
  return !!attempt.guidedTelemetry && Array.isArray(attempt.guidedTelemetry.stepAttempts);
}

export function buildAttemptReviewModel(args: {
  attemptId: string;
  attempts: Attempt[];
  trussProblems: TrussModel[];
}): AttemptReviewModel {
  const attempt = args.attempts.find(item => item.id === args.attemptId);
  if (!attempt) return { mode: 'not_found' };
  if (!hasUsableTelemetry(attempt)) {
    return { mode: 'summary_only', attempt, reason: attempt.guidedTelemetry ? 'legacy_or_malformed' : 'no_guided_telemetry' };
  }

  const topic = attempt.topic ?? attempt.guidedTelemetry.topic;
  if (topic !== 'trusses') {
    return { mode: 'summary_only', attempt, telemetry: attempt.guidedTelemetry, reason: 'unsupported_topic' };
  }

  const problem = args.trussProblems.find(item => item.id === attempt.problemId);
  if (!problem) {
    return { mode: 'missing_problem', attempt, telemetry: attempt.guidedTelemetry, problemId: attempt.problemId };
  }

  return { mode: 'truss_replay', attempt, telemetry: attempt.guidedTelemetry, problem };
}
