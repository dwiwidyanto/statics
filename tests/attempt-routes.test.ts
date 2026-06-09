import { describe, expect, it } from 'vitest';
import { getAttemptNavigationTarget, routeFromRecommendationTarget } from '../src/app/routing/attemptRoutes';
import type { Attempt } from '../src/lib/domain/progress/types';
import type { AnyProblem } from '../src/lib/services/progressRepository';

describe('attempt route decisions', () => {
  const allProblems: AnyProblem[] = [
    { id: 'truss-1', topic: 'trusses', title: 'T', description: '', joints: [], members: [], supports: [], loads: [], difficulty: 'easy', version: 1, learningObjectives: [] },
    { id: 'beam-1', topic: 'beam-internal-forces', title: 'B', description: '', body: { id: 'b', type: 'beam', width: 1, height: 1, weight: 0 }, supports: [], loads: [], expectedDeterminacy: 'statically_determinate', expectedStability: 'stable', hints: [], difficulty: 'easy', version: 1, learningObjectives: [] },
    { id: 'starter-1', topic: 'equilibrium', title: 'S', description: '', body: { id: 's', type: 'beam', width: 1, height: 1, weight: 0 }, supports: [], loads: [], expectedDeterminacy: 'statically_determinate', expectedStability: 'stable', hints: [], difficulty: 'easy', version: 1, learningObjectives: [] },
  ];

  const baseAttempt: Attempt = {
    id: 'att-1',
    problemId: 'truss-1',
    problemVersion: 1,
    createdAt: '2026-06-01T00:00:00Z',
    answers: {},
    score: 1,
    feedback: [],
    completed: true,
  };

  it('routes guided truss attempts with telemetry to attempt review', () => {
    const target = getAttemptNavigationTarget({ ...baseAttempt, guidedTelemetry: {} as Attempt['guidedTelemetry'] }, allProblems);
    expect(target).toEqual({ page: 'progress/attempt/att-1' });
  });

  it('routes guided truss attempts without telemetry to guided truss workflow', () => {
    const target = getAttemptNavigationTarget({ ...baseAttempt, skillBreakdown: { reactions: 1 } }, allProblems);
    expect(target).toEqual({ page: 'trusses/truss-1/guided' });
  });

  it('routes non-guided truss, beam, and starter attempts correctly', () => {
    expect(getAttemptNavigationTarget(baseAttempt, allProblems)).toEqual({ page: 'trusses', params: { problemId: 'truss-1' } });
    expect(getAttemptNavigationTarget({ ...baseAttempt, problemId: 'beam-1' }, allProblems)).toEqual({ page: 'guided/beam-1' });
    expect(getAttemptNavigationTarget({ ...baseAttempt, problemId: 'starter-1' }, allProblems)).toEqual({ page: 'practice', params: { problemId: 'starter-1' } });
  });

  it('converts recommendation truss targets to normal or guided routes intentionally', () => {
    expect(routeFromRecommendationTarget('trusses:truss-1')).toEqual({ page: 'trusses', problemId: 'truss-1' });
    expect(routeFromRecommendationTarget('trusses:truss-1', true)).toEqual({ page: 'trusses-guided', problemId: 'truss-1' });
    expect(routeFromRecommendationTarget({ kind: 'guided_truss', problemId: 'truss-1' })).toEqual({ page: 'trusses-guided', problemId: 'truss-1' });
    expect(routeFromRecommendationTarget({ kind: 'truss_practice', problemId: 'truss-1' })).toEqual({ page: 'trusses', problemId: 'truss-1' });
    expect(routeFromRecommendationTarget({ kind: 'guided_beam', problemId: 'beam-1' })).toEqual({ page: 'guided', problemId: 'beam-1' });
    expect(routeFromRecommendationTarget({ kind: 'practice', problemId: 'starter-1' })).toEqual({ page: 'practice', problemId: 'starter-1' });
    expect(routeFromRecommendationTarget({ kind: 'attempt_review', attemptId: 'att-1' })).toEqual({ page: 'attempt-review', attemptId: 'att-1' });
  });

  it('falls back safely for malformed recommendation routes', () => {
    expect(routeFromRecommendationTarget('trusses:')).toEqual({ page: 'dashboard' });
    expect(routeFromRecommendationTarget('guided/')).toEqual({ page: 'dashboard' });
    expect(routeFromRecommendationTarget('unknown-route')).toEqual({ page: 'dashboard' });
    expect(routeFromRecommendationTarget({ kind: 'guided_truss', problemId: '' })).toEqual({ page: 'dashboard' });
    expect(routeFromRecommendationTarget({ kind: 'attempt_review', attemptId: '' })).toEqual({ page: 'dashboard' });
  });
});
