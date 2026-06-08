import { describe, expect, it } from 'vitest';
import { normalizeProgressData } from '../src/lib/domain/progress/telemetryMigration';
import { reconstructTrussReplayState } from '../src/lib/domain/progress/attemptReplay';
import { buildLearningRecommendations } from '../src/lib/domain/progress/recommendations';
import { trussProblems } from '../src/content/problems/truss-problems';
import { solveTruss } from '../src/lib/domain/truss/solver';
import type { Attempt, GuidedAttemptTelemetry } from '../src/lib/domain/progress/types';
import type { AnyProblem } from '../src/lib/services/progressRepository';

describe('Stage 3E robustness helpers', () => {
  it('normalizes legacy guided snapshots without crashing', () => {
    const result = normalizeProgressData({
      schemaVersion: 1,
      attempts: [
        {
          id: 'legacy-1',
          problemId: 'truss-simple-triangle',
          problemVersion: 1,
          createdAt: '2026-06-01T00:00:00Z',
          answers: {},
          score: 0.8,
          feedback: [],
          completed: true,
          guidedTelemetry: {
            problemId: 'truss-simple-triangle',
            problemVersion: 1,
            topic: 'trusses',
            startedAt: '2026-06-01T00:00:00Z',
            totalScore: 0.8,
            completed: true,
            stepAttempts: [
              { stepId: 'zero_members', createdAt: '', isCorrect: true, score: 1, answersSnapshot: ['m1'], feedbackMessages: [], misconceptions: [], hintLevelUsed: 0, attemptNumber: 1 },
              { stepId: 'reactions', createdAt: '', isCorrect: true, score: 1, answersSnapshot: { Ay: 10 }, feedbackMessages: [], misconceptions: [], hintLevelUsed: 0, attemptNumber: 1 }
            ],
            misconceptionCounts: {},
            skillBreakdown: {},
            finalAnswers: {}
          }
        },
        { id: 'broken' }
      ]
    });

    expect(result.data.attempts).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    const steps = result.data.attempts[0].guidedTelemetry?.stepAttempts;
    expect(steps?.[0].answersSnapshot).toEqual({ kind: 'zero_members', selectedMemberIds: ['m1'] });
    expect(steps?.[1].answersSnapshot).toEqual({ kind: 'reactions', answers: { Ay: 10 } });
  });

  it('reconstructs replay state through reactions, zero-force selections, and member forces', () => {
    const problem = trussProblems[0];
    const solverResult = solveTruss(problem);
    const memberId = problem.members[0].id;
    const telemetry: GuidedAttemptTelemetry = {
      problemId: problem.id,
      problemVersion: problem.version,
      topic: problem.topic,
      startedAt: '2026-06-01T00:00:00Z',
      totalScore: 1,
      completed: true,
      stepAttempts: [
        { stepId: 'reactions', createdAt: '', isCorrect: true, score: 1, answersSnapshot: { kind: 'reactions', answers: {} }, feedbackMessages: [], misconceptions: [], hintLevelUsed: 0, attemptNumber: 1 },
        { stepId: 'zero_members', createdAt: '', isCorrect: true, score: 1, answersSnapshot: { kind: 'zero_members', selectedMemberIds: [...solverResult.zeroForceMembers] }, feedbackMessages: [], misconceptions: [], hintLevelUsed: 0, attemptNumber: 1 },
        { stepId: 'member_forces', createdAt: '', isCorrect: true, score: 1, answersSnapshot: { kind: 'member_forces', jointId: problem.joints[0].id, answers: { [memberId]: solverResult.memberForces[memberId] ?? 0 }, unknownMemberIds: [memberId] }, feedbackMessages: [], misconceptions: [], hintLevelUsed: 0, attemptNumber: 1 }
      ],
      misconceptionCounts: {},
      skillBreakdown: {},
      finalAnswers: {}
    };

    const afterReactions = reconstructTrussReplayState({ telemetry, selectedAttemptIdx: 0, problem, solverResult });
    expect(afterReactions.solvedReactions).toEqual(solverResult.reactions);

    const afterZeros = reconstructTrussReplayState({ telemetry, selectedAttemptIdx: 1, problem, solverResult });
    for (const zeroId of solverResult.zeroForceMembers) {
      expect(afterZeros.solvedMemberForces[zeroId]).toBe(0);
    }

    const afterMember = reconstructTrussReplayState({ telemetry, selectedAttemptIdx: 99, problem, solverResult });
    expect(afterMember.solvedMemberIds).toContain(memberId);
  });

  it('builds misconception, retry, readiness, and beginner recommendations', () => {
    const problems = trussProblems.slice(0, 2) as AnyProblem[];
    expect(buildLearningRecommendations({ attempts: [], allProblems: problems })[0].type).toBe('continue_topic');

    const lowAttempt: Attempt = {
      id: 'a1',
      problemId: problems[0].id,
      problemVersion: problems[0].version,
      createdAt: '2026-06-01T00:00:00Z',
      answers: {},
      score: 0.5,
      feedback: [],
      completed: false,
      misconceptions: ['sign_reversed', 'sign_reversed'],
      guidedTelemetry: {} as GuidedAttemptTelemetry
    };
    const lowRecommendations = buildLearningRecommendations({ attempts: [lowAttempt], allProblems: problems });
    expect(lowRecommendations.some(r => r.type === 'review_misconception' && r.relatedMisconception === 'sign_reversed')).toBe(true);
    expect(lowRecommendations.some(r => r.type === 'retry_problem' && r.relatedProblemId === problems[0].id)).toBe(true);

    const strongAttempts = problems.map((problem, index): Attempt => ({
      id: `strong-${index}`,
      problemId: problem.id,
      problemVersion: problem.version,
      createdAt: `2026-06-0${index + 2}T00:00:00Z`,
      answers: {},
      score: 0.95,
      feedback: [],
      completed: true
    }));
    expect(buildLearningRecommendations({ attempts: strongAttempts, allProblems: problems }).some(r => r.type === 'advance_topic')).toBe(true);
  });

  it('prefers unmet prerequisites before advanced recommendation targets', () => {
    const problems: AnyProblem[] = [
      { ...trussProblems[0], id: 'easy-truss', difficulty: 'easy', moduleOrder: 1, prerequisiteProblemIds: [], skillTags: ['method-of-joints'] },
      { ...trussProblems[1], id: 'medium-truss', difficulty: 'medium', moduleOrder: 2, prerequisiteProblemIds: ['easy-truss'], skillTags: ['zeroForceMembers'] },
      { ...trussProblems[4], id: 'hard-truss', difficulty: 'hard', moduleOrder: 3, prerequisiteProblemIds: ['medium-truss'], skillTags: ['zeroForceMembers'] }
    ];

    const attempts: Attempt[] = [{
      id: 'a1',
      problemId: 'easy-truss',
      problemVersion: 1,
      createdAt: '2026-06-01T00:00:00Z',
      answers: {},
      score: 0.95,
      feedback: [],
      completed: true,
      misconceptions: ['zero_force_missed', 'zero_force_missed']
    }];

    const recommendations = buildLearningRecommendations({ attempts, allProblems: problems });
    const continueRecommendation = recommendations.find(r => r.type === 'continue_topic');
    expect(continueRecommendation?.relatedProblemId).toBe('medium-truss');
  });
});
