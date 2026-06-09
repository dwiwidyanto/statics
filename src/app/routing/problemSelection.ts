import type { ProblemModel } from '../../lib/domain/models/types';

export type ProblemSelection =
  | { kind: 'default'; problemId: string }
  | { kind: 'route'; problemId: string }
  | { kind: 'custom' }
  | { kind: 'missing'; problemId: string };

export function selectPracticeProblemFromRoute(
  routeProblemId: string | null | undefined,
  problems: Pick<ProblemModel, 'id'>[],
  defaultProblemId = 'prob-simply-supported-beam'
): ProblemSelection {
  if (!routeProblemId) return { kind: 'default', problemId: defaultProblemId };
  if (routeProblemId === 'custom') return { kind: 'custom' };
  return problems.some(problem => problem.id === routeProblemId)
    ? { kind: 'route', problemId: routeProblemId }
    : { kind: 'missing', problemId: routeProblemId };
}

export function selectGuidedBeamProblemFromRoute(
  routeProblemId: string,
  problems: Pick<ProblemModel, 'id'>[]
): ProblemSelection {
  return problems.some(problem => problem.id === routeProblemId)
    ? { kind: 'route', problemId: routeProblemId }
    : { kind: 'missing', problemId: routeProblemId };
}

export function selectTrussPracticeProblemFromRoute(
  routeProblemId: string | null | undefined,
  problems: Pick<ProblemModel, 'id'>[]
): ProblemSelection {
  const defaultProblemId = problems[0]?.id ?? '';
  if (!routeProblemId) return { kind: 'default', problemId: defaultProblemId };
  return problems.some(problem => problem.id === routeProblemId)
    ? { kind: 'route', problemId: routeProblemId }
    : { kind: 'missing', problemId: routeProblemId };
}

export function selectGuidedTrussProblemFromRoute(
  routeProblemId: string | null | undefined,
  problems: Pick<ProblemModel, 'id'>[]
): ProblemSelection {
  if (!routeProblemId) return { kind: 'missing', problemId: '' };
  return problems.some(problem => problem.id === routeProblemId)
    ? { kind: 'route', problemId: routeProblemId }
    : { kind: 'missing', problemId: routeProblemId };
}
