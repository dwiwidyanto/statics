import { describe, it, expect } from 'vitest';
import { computeLearningAnalytics } from '../src/lib/domain/progress/analytics';
import type { Attempt } from '../src/lib/domain/progress/types';

describe('Learning Analytics Module', () => {
  const allProblems = [
    { id: 'beam-1', topic: 'equilibrium' },
    { id: 'truss-king-post', topic: 'trusses', learningObjectives: ['Zero force members'] },
    { id: 'truss-simple', topic: 'trusses' }
  ];

  const mockProgress: Record<string, { completed: boolean }> = {
    'beam-1': { completed: false },
    'truss-king-post': { completed: false },
    'truss-simple': { completed: false }
  };

  const getProblemProgress = (id: string) => mockProgress[id] || { completed: false };

  it('handles empty attempts gracefully with defaults', () => {
    const analytics = computeLearningAnalytics([], allProblems, getProblemProgress);
    expect(analytics.totalGuidedAttempts).toBe(0);
    expect(analytics.averageScore).toBe(0);
    expect(analytics.totalHintsUsed).toBe(0);
    expect(analytics.strongestSkill).toBeNull();
    expect(analytics.weakestSkill).toBeNull();
    expect(analytics.mostFrequentMisconception).toBeNull();
    // Default fallback to first unsolved
    expect(analytics.recommendedProblemId).toBe('beam-1');
  });

  it('correctly calculates statistics with mixed attempts', () => {
    const attempts: Attempt[] = [
      // Guided attempt on beam-1
      {
        id: 'att-1',
        problemId: 'beam-1',
        problemVersion: 1,
        createdAt: '2026-06-06T10:00:00Z',
        answers: {},
        score: 0.8,
        completed: true,
        topic: 'equilibrium',
        skillBreakdown: { determinacy: 1.0, reactions: 0.6, zeroForceMembers: 1.0, jointSelection: 1.0, memberForces: 1.0 },
        misconceptions: ['sign_reversed'],
        guidedTelemetry: {
          problemId: 'beam-1',
          problemVersion: 1,
          topic: 'equilibrium',
          startedAt: '2026-06-06T09:50:00Z',
          completedAt: '2026-06-06T10:00:00Z',
          totalScore: 0.8,
          completed: true,
          stepAttempts: [
            {
              stepId: 'reactions',
              attemptNumber: 1,
              createdAt: '2026-06-06T09:55:00Z',
              isCorrect: false,
              score: 0,
              answersSnapshot: {},
              feedbackMessages: [],
              misconceptions: ['sign_reversed'],
              hintLevelUsed: 2
            },
            {
              stepId: 'reactions',
              attemptNumber: 2,
              createdAt: '2026-06-06T09:58:00Z',
              isCorrect: true,
              score: 1.0,
              answersSnapshot: {},
              feedbackMessages: [],
              misconceptions: [],
              hintLevelUsed: 2
            }
          ],
          misconceptionCounts: { sign_reversed: 1 },
          skillBreakdown: { determinacy: 1.0, reactions: 0.6, zeroForceMembers: 1.0, jointSelection: 1.0, memberForces: 1.0 },
          finalAnswers: {}
        }
      },
      // Guided attempt on truss-simple
      {
        id: 'att-2',
        problemId: 'truss-simple',
        problemVersion: 1,
        createdAt: '2026-06-06T10:20:00Z',
        answers: {},
        score: 0.9,
        completed: true,
        topic: 'trusses',
        skillBreakdown: { determinacy: 0.9, reactions: 0.9, zeroForceMembers: 0.5, jointSelection: 0.9, memberForces: 0.9 },
        misconceptions: ['zero_force_missed', 'sign_reversed'],
        guidedTelemetry: {
          problemId: 'truss-simple',
          problemVersion: 1,
          topic: 'trusses',
          startedAt: '2026-06-06T10:10:00Z',
          completedAt: '2026-06-06T10:20:00Z',
          totalScore: 0.9,
          completed: true,
          stepAttempts: [
            {
              stepId: 'zero_members',
              attemptNumber: 1,
              createdAt: '2026-06-06T10:15:00Z',
              isCorrect: false,
              score: 0.5,
              answersSnapshot: [],
              feedbackMessages: [],
              misconceptions: ['zero_force_missed'],
              hintLevelUsed: 0
            }
          ],
          misconceptionCounts: { zero_force_missed: 1 },
          skillBreakdown: { determinacy: 0.9, reactions: 0.9, zeroForceMembers: 0.5, jointSelection: 0.9, memberForces: 0.9 },
          finalAnswers: {}
        }
      }
    ];

    const analytics = computeLearningAnalytics(attempts, allProblems, getProblemProgress);

    expect(analytics.totalGuidedAttempts).toBe(2);
    expect(analytics.averageScore).toBe(0.85); // (0.8 + 0.9)/2
    expect(analytics.totalHintsUsed).toBe(2);  // 2 hints in reactions step
    expect(analytics.averageHintsPerGuidedAttempt).toBe(1.0);

    // Skill averages:
    // determinacy: (1.0 + 0.9)/2 = 0.95
    // reactions: (0.6 + 0.9)/2 = 0.75
    // zeroForceMembers: (1.0 + 0.5)/2 = 0.75
    // jointSelection: (1.0 + 0.9)/2 = 0.95
    // memberForces: (1.0 + 0.9)/2 = 0.95
    expect(analytics.skillAverages.reactions).toBe(0.75);
    expect(analytics.skillAverages.zeroForceMembers).toBe(0.75);

    // Weakest skill should be either reactions or zeroForceMembers (both are 0.75, which is < 0.85)
    expect(['reactions', 'zeroForceMembers']).toContain(analytics.weakestSkill);
    // Strongest skill should be determinacy or jointSelection or memberForces (all are 0.95)
    expect(['determinacy', 'jointSelection', 'memberForces']).toContain(analytics.strongestSkill);

    // Most frequent misconception: 'sign_reversed' has count 2, 'zero_force_missed' has 1.
    expect(analytics.mostFrequentMisconception).toBe('sign_reversed');
  });

  it('recalculates trend based on last 3 vs previous 3 attempts', () => {
    // Generate 6 attempts with scores:
    // prev3 scores: 0.5, 0.6, 0.7 -> average = 0.6
    // last3 scores: 0.8, 0.9, 1.0 -> average = 0.9
    // Trend should be: 0.9 - 0.6 = +0.3
    const attempts: Attempt[] = [];
    const baseDate = new Date('2026-06-06T10:00:00Z');
    const scores = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

    for (let i = 0; i < 6; i++) {
      attempts.push({
        id: `att-${i}`,
        problemId: 'beam-1',
        problemVersion: 1,
        createdAt: new Date(baseDate.getTime() + i * 60000).toISOString(),
        answers: {},
        score: scores[i],
        completed: true,
        guidedTelemetry: {
          problemId: 'beam-1',
          problemVersion: 1,
          topic: 'equilibrium',
          startedAt: '',
          totalScore: scores[i],
          completed: true,
          stepAttempts: [],
          misconceptionCounts: {},
          skillBreakdown: {},
          finalAnswers: {}
        }
      });
    }

    const analytics = computeLearningAnalytics(attempts, allProblems, getProblemProgress);
    expect(analytics.recentTrend).toBe(0.3);
  });

  it('determines problem recommendation based on weakest skill', () => {
    // Mark beam-1 as completed
    mockProgress['beam-1'].completed = true;

    // ZeroForceMembers is weak -> should recommend truss-king-post
    const attemptsZfmWeak: Attempt[] = [
      {
        id: 'att-1',
        problemId: 'beam-1',
        problemVersion: 1,
        createdAt: '2026-06-06T10:00:00Z',
        answers: {},
        score: 0.9,
        completed: true,
        skillBreakdown: { determinacy: 1.0, reactions: 0.9, zeroForceMembers: 0.4, jointSelection: 1.0, memberForces: 1.0 },
        guidedTelemetry: {
          problemId: 'beam-1',
          problemVersion: 1,
          topic: 'equilibrium',
          startedAt: '',
          totalScore: 0.9,
          completed: true,
          stepAttempts: [],
          misconceptionCounts: {},
          skillBreakdown: { determinacy: 1.0, reactions: 0.9, zeroForceMembers: 0.4, jointSelection: 1.0, memberForces: 1.0 },
          finalAnswers: {}
        }
      }
    ];

    const analytics = computeLearningAnalytics(attemptsZfmWeak, allProblems, getProblemProgress);
    expect(analytics.weakestSkill).toBe('zeroForceMembers');
    expect(analytics.recommendedProblemId).toBe('truss-king-post');
  });
});
