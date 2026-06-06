import { describe, it, expect } from 'vitest';
import { parseRoute, buildHash, legacyToRoute } from '../src/app/routing/router';

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
  });

  it('falls back to dashboard for invalid paths', () => {
    expect(parseRoute('#/unknown-page')).toEqual({ page: 'dashboard' });
    expect(parseRoute('#/guided/')).toEqual({ page: 'dashboard' }); // missing parameter
    expect(parseRoute('#/concept/')).toEqual({ page: 'dashboard' }); // missing parameter
  });

  it('builds hash strings from route objects', () => {
    expect(buildHash({ page: 'dashboard' })).toBe('#/');
    expect(buildHash({ page: 'practice' })).toBe('#/practice');
    expect(buildHash({ page: 'practice', problemId: 'midpoint-load' })).toBe('#/practice/midpoint-load');
    expect(buildHash({ page: 'guided', problemId: 'beam-3' })).toBe('#/guided/beam-3');
    expect(buildHash({ page: 'concept', topicId: 'equilibrium' })).toBe('#/concept/equilibrium');
    expect(buildHash({ page: 'progress' })).toBe('#/progress');
  });

  it('bridges legacy pages to route objects correctly', () => {
    expect(legacyToRoute('dashboard')).toEqual({ page: 'dashboard' });
    expect(legacyToRoute('progress')).toEqual({ page: 'progress' });
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
  });
});
