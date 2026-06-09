import { describe, it, expect } from 'vitest';
import { parseRoute, buildHash, legacyToRoute, getRouteForAttempt } from '../src/app/routing/router';

describe('Hash-based Routing System', () => {
  it('parses correct pages and params from hash paths', () => {
    // Dashboard / Root
    expect(parseRoute('')).toEqual({ page: 'dashboard' });
    expect(parseRoute('#/')).toEqual({ page: 'dashboard' });

    // Practice Sandbox
    expect(parseRoute('#/practice')).toEqual({ page: 'practice' });
    expect(parseRoute('#/practice/simply-supported')).toEqual({
      page: 'practice',
      problemId: 'simply-supported',
    });

    // Guided Beam Workspace
    expect(parseRoute('#/guided/beam-1')).toEqual({
      page: 'guided',
      problemId: 'beam-1',
    });

    // Concept Page
    expect(parseRoute('#/concept/fbd')).toEqual({
      page: 'concept',
      topicId: 'fbd',
    });

    // Progress Dashboard
    expect(parseRoute('#/progress')).toEqual({ page: 'progress' });

    // Attempt Review Page
    expect(parseRoute('#/progress/attempt/att-123')).toEqual({
      page: 'attempt-review',
      attemptId: 'att-123',
    });

    // Truss Workspace
    expect(parseRoute('#/trusses')).toEqual({ page: 'trusses' });
    expect(parseRoute('#/trusses/truss-1')).toEqual({
      page: 'trusses',
      problemId: 'truss-1',
    });
    expect(parseRoute('#/trusses/truss-1/guided')).toEqual({
      page: 'trusses-guided',
      problemId: 'truss-1',
    });
    expect(parseRoute('#/trusses/missing-id')).toEqual({
      page: 'trusses',
      problemId: 'missing-id',
    });
    expect(parseRoute('#/trusses/missing-id/guided')).toEqual({
      page: 'trusses-guided',
      problemId: 'missing-id',
    });
  });

  it('falls back to dashboard for invalid paths', () => {
    expect(parseRoute('#/unknown-page')).toEqual({ page: 'dashboard' });
    expect(parseRoute('#/guided/')).toEqual({ page: 'dashboard' }); // missing parameter
    expect(parseRoute('#/concept/')).toEqual({ page: 'dashboard' }); // missing parameter
    expect(parseRoute('#/progress/attempt')).toEqual({ page: 'dashboard' });
  });

  it('builds hash strings from route objects', () => {
    expect(buildHash({ page: 'dashboard' })).toBe('#/');
    expect(buildHash({ page: 'practice' })).toBe('#/practice');
    expect(buildHash({ page: 'practice', problemId: 'midpoint-load' })).toBe('#/practice/midpoint-load');
    expect(buildHash({ page: 'guided', problemId: 'beam-3' })).toBe('#/guided/beam-3');
    expect(buildHash({ page: 'concept', topicId: 'equilibrium' })).toBe('#/concept/equilibrium');
    expect(buildHash({ page: 'progress' })).toBe('#/progress');
    expect(buildHash({ page: 'attempt-review', attemptId: 'att-456' })).toBe('#/progress/attempt/att-456');
    expect(buildHash({ page: 'trusses' })).toBe('#/trusses');
    expect(buildHash({ page: 'trusses', problemId: 'truss-simple-triangle' })).toBe('#/trusses/truss-simple-triangle');
    expect(buildHash({ page: 'trusses-guided', problemId: 'truss-simple-triangle' })).toBe('#/trusses/truss-simple-triangle/guided');
  });

  it('round-trips supported direct hash routes', () => {
    const hashes = [
      '#/',
      '#/practice',
      '#/practice/prob-simply-supported-beam',
      '#/guided/beam-simply-supported-midpoint',
      '#/trusses',
      '#/trusses/truss-simple-triangle',
      '#/trusses/truss-simple-triangle/guided',
      '#/progress',
      '#/progress/attempt/attempt-1'
    ];

    for (const hash of hashes) {
      expect(buildHash(parseRoute(hash))).toBe(hash);
    }
  });

  it('bridges legacy pages to route objects correctly', () => {
    expect(legacyToRoute('dashboard')).toEqual({ page: 'dashboard' });
    expect(legacyToRoute('progress')).toEqual({ page: 'progress' });
    expect(legacyToRoute('progress/attempt/att-789')).toEqual({
      page: 'attempt-review',
      attemptId: 'att-789',
    });
    expect(legacyToRoute('practice')).toEqual({ page: 'practice' });
    expect(legacyToRoute('practice', { problemId: 'beam-5' })).toEqual({
      page: 'practice',
      problemId: 'beam-5',
    });
    expect(legacyToRoute('guided/beam-7')).toEqual({
      page: 'guided',
      problemId: 'beam-7',
    });
    expect(legacyToRoute('concept/equilibrium')).toEqual({
      page: 'concept',
      topicId: 'equilibrium',
    });
    expect(legacyToRoute('trusses')).toEqual({ page: 'trusses' });
    expect(legacyToRoute('trusses', { problemId: 'truss-2' })).toEqual({
      page: 'trusses',
      problemId: 'truss-2',
    });
    expect(legacyToRoute('trusses/truss-3')).toEqual({
      page: 'trusses',
      problemId: 'truss-3',
    });
    expect(legacyToRoute('trusses/truss-3/guided')).toEqual({
      page: 'trusses-guided',
      problemId: 'truss-3',
    });
  });

  describe('getRouteForAttempt helper', () => {
    const mockProblems = [
      { id: 'prob-1', topic: 'equilibrium' },
      { id: 'prob-2', topic: 'beam-internal-forces' },
      { id: 'truss-triangle', topic: 'trusses' },
    ];

    it('returns trusses page for truss problems', () => {
      expect(getRouteForAttempt('truss-triangle', mockProblems)).toEqual({
        page: 'trusses',
        problemId: 'truss-triangle',
      });
      // Fallback
      expect(getRouteForAttempt('truss-unknown', [])).toEqual({
        page: 'trusses',
        problemId: 'truss-unknown',
      });
    });

    it('returns guided page for beam problems', () => {
      expect(getRouteForAttempt('prob-2', mockProblems)).toEqual({
        page: 'guided',
        problemId: 'prob-2',
      });
      // Fallback
      expect(getRouteForAttempt('beam-cantilever', [])).toEqual({
        page: 'guided',
        problemId: 'beam-cantilever',
      });
    });

    it('returns practice page for practice problems', () => {
      expect(getRouteForAttempt('prob-1', mockProblems)).toEqual({
        page: 'practice',
        problemId: 'prob-1',
      });
      // Fallback
      expect(getRouteForAttempt('unknown-starter', [])).toEqual({
        page: 'practice',
        problemId: 'unknown-starter',
      });
    });
  });
});
