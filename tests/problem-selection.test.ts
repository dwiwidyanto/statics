import { describe, expect, it } from 'vitest';
import {
  selectGuidedBeamProblemFromRoute,
  selectGuidedTrussProblemFromRoute,
  selectPracticeProblemFromRoute,
  selectTrussPracticeProblemFromRoute
} from '../src/app/routing/problemSelection';

describe('route prop problem selection', () => {
  const problems = [
    { id: 'prob-simply-supported-beam' },
    { id: 'prob-cantilever-beam' },
  ];

  it('selects the default practice problem only when the route has no id', () => {
    expect(selectPracticeProblemFromRoute(null, problems)).toEqual({
      kind: 'default',
      problemId: 'prob-simply-supported-beam',
    });
  });

  it('selects matching practice route ids and tracks changes', () => {
    expect(selectPracticeProblemFromRoute('prob-simply-supported-beam', problems)).toEqual({
      kind: 'route',
      problemId: 'prob-simply-supported-beam',
    });
    expect(selectPracticeProblemFromRoute('prob-cantilever-beam', problems)).toEqual({
      kind: 'route',
      problemId: 'prob-cantilever-beam',
    });
  });

  it('keeps custom and unknown practice routes from silently loading another problem', () => {
    expect(selectPracticeProblemFromRoute('custom', problems)).toEqual({ kind: 'custom' });
    expect(selectPracticeProblemFromRoute('missing-problem', problems)).toEqual({
      kind: 'missing',
      problemId: 'missing-problem',
    });
  });

  it('selects guided beam route ids without defaulting unknown ids', () => {
    expect(selectGuidedBeamProblemFromRoute('prob-cantilever-beam', problems)).toEqual({
      kind: 'route',
      problemId: 'prob-cantilever-beam',
    });
    expect(selectGuidedBeamProblemFromRoute('unknown-beam', problems)).toEqual({
      kind: 'missing',
      problemId: 'unknown-beam',
    });
  });

  it('selects truss practice routes and defaults only when no id is provided', () => {
    const trusses = [{ id: 'truss-a' }, { id: 'truss-b' }];
    expect(selectTrussPracticeProblemFromRoute(null, trusses)).toEqual({
      kind: 'default',
      problemId: 'truss-a',
    });
    expect(selectTrussPracticeProblemFromRoute('truss-b', trusses)).toEqual({
      kind: 'route',
      problemId: 'truss-b',
    });
    expect(selectTrussPracticeProblemFromRoute('missing-truss', trusses)).toEqual({
      kind: 'missing',
      problemId: 'missing-truss',
    });
  });

  it('does not default guided truss routes when the id is missing or unknown', () => {
    const trusses = [{ id: 'truss-a' }, { id: 'truss-b' }];
    expect(selectGuidedTrussProblemFromRoute(undefined, trusses)).toEqual({
      kind: 'missing',
      problemId: '',
    });
    expect(selectGuidedTrussProblemFromRoute('missing-truss', trusses)).toEqual({
      kind: 'missing',
      problemId: 'missing-truss',
    });
    expect(selectGuidedTrussProblemFromRoute('truss-b', trusses)).toEqual({
      kind: 'route',
      problemId: 'truss-b',
    });
  });

  it('tracks truss route prop changes while a page remains mounted', () => {
    const trusses = [{ id: 'truss-a' }, { id: 'truss-b' }];
    expect(selectTrussPracticeProblemFromRoute('truss-a', trusses)).toEqual({
      kind: 'route',
      problemId: 'truss-a',
    });
    expect(selectTrussPracticeProblemFromRoute('truss-b', trusses)).toEqual({
      kind: 'route',
      problemId: 'truss-b',
    });
  });
});
