import type { Attempt } from '../../lib/domain/progress/types';
import type { LearningRecommendationTarget } from '../../lib/domain/progress/recommendations';
import type { AnyProblem } from '../../lib/services/progressRepository';
import type { Route } from './router';
import { getRouteForAttempt } from './router';

export interface LegacyNavigationTarget {
  page: string;
  params?: {
    problemId?: string;
  };
}

export function getAttemptNavigationTarget(attempt: Attempt, allProblems: AnyProblem[]): LegacyNavigationTarget {
  const route = getRouteForAttempt(attempt.problemId, allProblems);
  const hasGuidedMarkers = attempt.guidedTelemetry !== undefined || attempt.misconceptions !== undefined || attempt.skillBreakdown !== undefined;

  if (hasGuidedMarkers && attempt.guidedTelemetry) {
    return { page: `progress/attempt/${attempt.id}` };
  }
  if (route.page === 'trusses') {
    return hasGuidedMarkers
      ? { page: `trusses/${route.problemId}/guided` }
      : { page: 'trusses', params: { problemId: route.problemId } };
  }
  if (route.page === 'guided') {
    return { page: `guided/${route.problemId}` };
  }
  const problemId = 'problemId' in route && route.problemId ? route.problemId : attempt.problemId;
  return { page: 'practice', params: { problemId } };
}

export function routeFromRecommendationTarget(targetRoute?: string | LearningRecommendationTarget, guidedTruss = false): Route | null {
  if (!targetRoute) return null;
  if (typeof targetRoute !== 'string') {
    if (targetRoute.kind === 'guided_truss') return { page: 'trusses-guided', problemId: targetRoute.problemId };
    if (targetRoute.kind === 'truss_practice') return { page: 'trusses', problemId: targetRoute.problemId };
    if (targetRoute.kind === 'guided_beam') return { page: 'guided', problemId: targetRoute.problemId };
    if (targetRoute.kind === 'practice') return { page: 'practice', problemId: targetRoute.problemId };
    if (targetRoute.kind === 'attempt_review') return { page: 'attempt-review', attemptId: targetRoute.attemptId };
    return { page: 'progress' };
  }
  if (targetRoute.startsWith('trusses:')) {
    const problemId = targetRoute.split(':')[1];
    return guidedTruss ? { page: 'trusses-guided', problemId } : { page: 'trusses', problemId };
  }
  if (targetRoute.startsWith('guided/')) return { page: 'guided', problemId: targetRoute.substring(7) };
  if (targetRoute === 'progress') return { page: 'progress' };
  return { page: 'dashboard' };
}
