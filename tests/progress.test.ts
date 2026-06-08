import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProgressRepository, LocalProgressRepository } from '../src/lib/services/localProgressRepository';
import type { ProblemModel } from '../src/lib/domain/models/types';
import type { Attempt } from '../src/lib/domain/progress/types';

// Mock localStorage
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
  }),
  length: 0,
  key: vi.fn((index: number) => ''),
};

describe('Local Progress Repository', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset repository singleton state
    (global as any).localStorage = localStorage;
  });

  const dummyProblem1: ProblemModel = {
    id: 'prob-1',
    title: 'Problem 1',
    description: 'Desc',
    body: { id: 'b', type: 'beam', width: 6, height: 0.2, weight: 0 },
    supports: [],
    loads: [],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [],
    topic: 'equilibrium',
    difficulty: 'easy',
    version: 1,
    learningObjectives: [],
  };

  const dummyProblem2: ProblemModel = {
    id: 'prob-2',
    title: 'Problem 2',
    description: 'Desc',
    body: { id: 'b', type: 'beam', width: 4, height: 0.2, weight: 0 },
    supports: [],
    loads: [],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [],
    topic: 'beam-internal-forces',
    difficulty: 'medium',
    version: 1,
    learningObjectives: [],
  };

  it('saves attempts and retrieves them', () => {
    const repo = getProgressRepository();
    repo.reset();

    const attempt: Attempt = {
      id: 'att-1',
      problemId: 'prob-1',
      problemVersion: 1,
      createdAt: new Date().toISOString(),
      answers: { R_Ay: 300 },
      score: 1.0,
      feedback: [],
      completed: true,
    };

    repo.saveAttempt(attempt);
    
    const attempts = repo.getAttempts('prob-1');
    expect(attempts.length).toBe(1);
    expect(attempts[0].id).toBe('att-1');
  });

  it('calculates bestScore and updates it only when improved', () => {
    const repo = getProgressRepository();
    repo.reset();

    const attempt1: Attempt = {
      id: 'att-1',
      problemId: 'prob-1',
      problemVersion: 1,
      createdAt: '2026-06-06T10:00:00Z',
      answers: {},
      score: 0.5,
      feedback: [],
      completed: false,
    };

    const attempt2: Attempt = {
      id: 'att-2',
      problemId: 'prob-1',
      problemVersion: 1,
      createdAt: '2026-06-06T10:05:00Z',
      answers: {},
      score: 0.3, // worse score
      feedback: [],
      completed: false,
    };

    repo.saveAttempt(attempt1);
    repo.saveAttempt(attempt2);

    const progress = repo.getProblemProgress('prob-1');
    expect(progress.bestScore).toBe(0.5); // should keep the best score
    expect(progress.attemptsCount).toBe(2);
  });

  it('generates summary reports grouped by topic', () => {
    const repo = getProgressRepository();
    repo.reset();

    // 1 completed attempt on prob-1
    repo.saveAttempt({
      id: 'a1',
      problemId: 'prob-1',
      problemVersion: 1,
      createdAt: new Date().toISOString(),
      answers: {},
      score: 1.0,
      feedback: [],
      completed: true,
    });

    // 1 failing attempt on prob-2
    repo.saveAttempt({
      id: 'a2',
      problemId: 'prob-2',
      problemVersion: 1,
      createdAt: new Date().toISOString(),
      answers: {},
      score: 0.5,
      feedback: [],
      completed: false,
    });

    const summary = repo.getSummary([dummyProblem1, dummyProblem2]);

    expect(summary.totalProblems).toBe(2);
    expect(summary.attemptedProblems).toBe(2);
    expect(summary.completedProblems).toBe(1);
    expect(summary.averageBestScore).toBe(0.75); // (1.0 + 0.5) / 2

    expect(summary.byTopic['equilibrium'].total).toBe(1);
    expect(summary.byTopic['equilibrium'].completed).toBe(1);
    expect(summary.byTopic['equilibrium'].averageBestScore).toBe(1.0);

    expect(summary.byTopic['beam-internal-forces'].total).toBe(1);
    expect(summary.byTopic['beam-internal-forces'].completed).toBe(0);
    expect(summary.byTopic['beam-internal-forces'].averageBestScore).toBe(0.5);
  });

  it('gracefully handles and resets malformed storage data', () => {
    // Put corrupt JSON in storage
    mockStorage['staticslab.progress.v1'] = 'malformed { json';

    const repo = new LocalProgressRepository();
    // Instantiating/calling should trigger recovery
    const attempts = repo.getAttempts();
    expect(attempts).toEqual([]);
  });

  it('supports backward compatibility with and without optional fields (topic, skillBreakdown, misconceptions)', () => {
    const repo = getProgressRepository();
    repo.reset();

    const attemptBasic: Attempt = {
      id: 'att-basic',
      problemId: 'prob-1',
      problemVersion: 1,
      createdAt: new Date().toISOString(),
      answers: { R_Ay: 300 },
      score: 1.0,
      feedback: [],
      completed: true,
    };

    const attemptRich: Attempt = {
      id: 'att-rich',
      problemId: 'prob-2',
      problemVersion: 1,
      createdAt: new Date().toISOString(),
      answers: { R_By: 400 },
      score: 0.8,
      feedback: ['Try again'],
      completed: false,
      topic: 'trusses',
      skillBreakdown: { determinacy: 1, reactions: 0.5 },
      misconceptions: ['sign-reversed'],
    };

    repo.saveAttempt(attemptBasic);
    repo.saveAttempt(attemptRich);

    const loadedBasic = repo.getAttempts('prob-1')[0];
    const loadedRich = repo.getAttempts('prob-2')[0];

    expect(loadedBasic).toBeDefined();
    expect(loadedBasic.id).toBe('att-basic');
    expect(loadedBasic.topic).toBeUndefined();
    expect(loadedBasic.skillBreakdown).toBeUndefined();
    expect(loadedBasic.misconceptions).toBeUndefined();

    expect(loadedRich).toBeDefined();
    expect(loadedRich.id).toBe('att-rich');
    expect(loadedRich.topic).toBe('trusses');
    expect(loadedRich.skillBreakdown).toEqual({ determinacy: 1, reactions: 0.5 });
    expect(loadedRich.misconceptions).toEqual(['sign-reversed']);
  });

  it('imports progress with duplicate counts in merge mode', () => {
    const repo = getProgressRepository();
    repo.reset();

    repo.saveAttempt({
      id: 'att-existing',
      problemId: 'prob-1',
      problemVersion: 1,
      createdAt: '2026-06-01T00:00:00Z',
      answers: {},
      score: 0.7,
      feedback: [],
      completed: false,
    });

    const result = repo.importProgress({
      schemaVersion: 1,
      attempts: [
        {
          id: 'att-existing',
          problemId: 'prob-1',
          problemVersion: 1,
          createdAt: '2026-06-02T00:00:00Z',
          answers: {},
          score: 1,
          feedback: [],
          completed: true,
        },
        {
          id: 'att-new',
          problemId: 'prob-2',
          problemVersion: 1,
          createdAt: '2026-06-03T00:00:00Z',
          answers: {},
          score: 0.9,
          feedback: [],
          completed: true,
        },
      ],
    }, 'merge');

    expect(result.importedAttempts).toBe(1);
    expect(result.duplicateAttempts).toBe(1);
    expect(result.skippedAttempts).toBe(1);
    expect(repo.getAttempts()).toHaveLength(2);
    expect(repo.getAttempts().map(a => a.id)).toEqual(['att-existing', 'att-new']);
  });

  it('does not erase existing progress on invalid replace import', () => {
    const repo = getProgressRepository();
    repo.reset();
    repo.saveAttempt({
      id: 'att-keep',
      problemId: 'prob-1',
      problemVersion: 1,
      createdAt: '2026-06-01T00:00:00Z',
      answers: {},
      score: 1,
      feedback: [],
      completed: true,
    });

    const result = repo.importProgress({ schemaVersion: 1, attempts: [{ id: 'broken' }] }, 'replace');
    expect(result.importedAttempts).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(repo.getAttempts()).toHaveLength(1);
    expect(repo.getAttempts()[0].id).toBe('att-keep');
  });
});
