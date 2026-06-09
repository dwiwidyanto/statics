import { describe, expect, it } from 'vitest';
import { buildAttemptReviewModel } from '../src/lib/domain/progress/attemptReviewModel';
import { trussProblems } from '../src/content/problems/truss-problems';
import type { Attempt, GuidedAttemptTelemetry } from '../src/lib/domain/progress/types';

function telemetry(topic = 'trusses'): GuidedAttemptTelemetry {
  return {
    problemId: 'truss-simple-triangle',
    problemVersion: 1,
    topic,
    startedAt: '2026-06-01T00:00:00Z',
    totalScore: 1,
    completed: true,
    stepAttempts: [],
    misconceptionCounts: {},
    skillBreakdown: { determinacy: 1, reactions: 1, zeroForceMembers: 1, jointSelection: 1, memberForces: 1 },
    finalAnswers: {}
  };
}

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'att-1',
    problemId: 'truss-simple-triangle',
    problemVersion: 1,
    createdAt: '2026-06-01T00:00:00Z',
    answers: {},
    score: 1,
    feedback: [],
    completed: true,
    topic: 'trusses',
    guidedTelemetry: telemetry(),
    ...overrides
  };
}

describe('attempt review model', () => {
  it('returns truss replay for valid guided truss attempts', () => {
    const model = buildAttemptReviewModel({ attemptId: 'att-1', attempts: [attempt()], trussProblems });
    expect(model.mode).toBe('truss_replay');
  });

  it('returns unsupported summary for guided non-truss attempts', () => {
    const model = buildAttemptReviewModel({
      attemptId: 'att-1',
      attempts: [attempt({ problemId: 'beam-1', topic: 'beam-internal-forces', guidedTelemetry: telemetry('beam-internal-forces') })],
      trussProblems
    });
    expect(model.mode).toBe('summary_only');
    if (model.mode === 'summary_only') expect(model.reason).toBe('unsupported_topic');
  });

  it('returns not found for missing attempts', () => {
    expect(buildAttemptReviewModel({ attemptId: 'missing', attempts: [], trussProblems }).mode).toBe('not_found');
  });

  it('returns missing problem for truss attempts with unknown problem IDs', () => {
    const model = buildAttemptReviewModel({
      attemptId: 'att-1',
      attempts: [attempt({ problemId: 'truss-missing' })],
      trussProblems
    });
    expect(model.mode).toBe('missing_problem');
  });

  it('returns summary fallback for malformed legacy telemetry', () => {
    const model = buildAttemptReviewModel({
      attemptId: 'att-1',
      attempts: [attempt({ guidedTelemetry: { ...telemetry(), stepAttempts: undefined as never } })],
      trussProblems
    });
    expect(model.mode).toBe('summary_only');
  });
});
