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

export function routeForProblemStart(problem: AnyProblem, preferGuidedTruss = true): Route {
  if (problem.topic === 'trusses') {
    return preferGuidedTruss
      ? { page: 'trusses-guided', problemId: problem.id }
      : { page: 'trusses', problemId: problem.id };
  }
  if (problem.topic === 'beam-internal-forces') {
    return { page: 'guided', problemId: problem.id };
  }
  return { page: 'practice', problemId: problem.id };
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
  const hasId = (id: string | undefined): id is string => !!id && id.trim().length > 0;
  if (typeof targetRoute !== 'string') {
    if (targetRoute.kind === 'guided_truss') return hasId(targetRoute.problemId) ? { page: 'trusses-guided', problemId: targetRoute.problemId } : { page: 'dashboard' };
    if (targetRoute.kind === 'truss_practice') return hasId(targetRoute.problemId) ? { page: 'trusses', problemId: targetRoute.problemId } : { page: 'dashboard' };
    if (targetRoute.kind === 'guided_beam') return hasId(targetRoute.problemId) ? { page: 'guided', problemId: targetRoute.problemId } : { page: 'dashboard' };
    if (targetRoute.kind === 'practice') return hasId(targetRoute.problemId) ? { page: 'practice', problemId: targetRoute.problemId } : { page: 'dashboard' };
    if (targetRoute.kind === 'attempt_review') return hasId(targetRoute.attemptId) ? { page: 'attempt-review', attemptId: targetRoute.attemptId } : { page: 'dashboard' };
    return { page: 'progress' };
  }
  if (targetRoute.startsWith('trusses:')) {
    const problemId = targetRoute.split(':')[1];
    if (!hasId(problemId)) return { page: 'dashboard' };
    return guidedTruss ? { page: 'trusses-guided', problemId } : { page: 'trusses', problemId };
  }
  if (targetRoute.startsWith('guided/')) {
    const problemId = targetRoute.substring(7);
    return hasId(problemId) ? { page: 'guided', problemId } : { page: 'dashboard' };
  }
  if (targetRoute === 'progress') return { page: 'progress' };
  return { page: 'dashboard' };
}
