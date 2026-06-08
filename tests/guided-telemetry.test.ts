import { describe, it, expect } from 'vitest';
import {
  createGuidedAttemptSession,
  recordStepAttempt,
  summarizeMisconceptions,
  calculateGuidedScore,
  getFirstAttemptAccuracy,
  getHintUsageSummary,
  buildFinalAttemptFromTelemetry
} from '../src/lib/domain/progress/guidedTelemetry';
import type { GuidedStepAttempt, GuidedAttemptTelemetry } from '../src/lib/domain/progress/types';

describe('Guided Learning Telemetry Domain Logic', () => {
  const dummyProblem = {
    id: 'truss-simple-triangle',
    version: 1,
    topic: 'trusses'
  };

  it('initializes a guided attempt session correctly', () => {
    const session = createGuidedAttemptSession(dummyProblem);
    expect(session.problemId).toBe('truss-simple-triangle');
    expect(session.problemVersion).toBe(1);
    expect(session.topic).toBe('trusses');
    expect(session.completed).toBe(false);
    expect(session.stepAttempts).toEqual([]);
    expect(session.totalScore).toBe(0);
    expect(session.skillBreakdown).toEqual({
      determinacy: 0,
      reactions: 0,
      zeroForceMembers: 0,
      jointSelection: 0,
      memberForces: 0
    });
  });

  it('records step attempts and auto-increments attempt number', () => {
    let session = createGuidedAttemptSession(dummyProblem);

    // Record 1st attempt for determinacy (incorrect)
    session = recordStepAttempt(session, {
      stepId: 'determinacy',
      createdAt: new Date().toISOString(),
      isCorrect: false,
      score: 0,
      answersSnapshot: { m: 3, r: 2, j: 3 },
      feedbackMessages: ['Classification incorrect'],
      misconceptions: ['reaction_count_error'],
      hintLevelUsed: 0
    });

    expect(session.stepAttempts.length).toBe(1);
    expect(session.stepAttempts[0].attemptNumber).toBe(1);
    expect(session.misconceptionCounts).toEqual({ reaction_count_error: 1 });

    // Record 2nd attempt for determinacy (correct)
    session = recordStepAttempt(session, {
      stepId: 'determinacy',
      createdAt: new Date().toISOString(),
      isCorrect: true,
      score: 1.0,
      answersSnapshot: { m: 3, r: 3, j: 3 },
      feedbackMessages: ['Correct'],
      misconceptions: [],
      hintLevelUsed: 0
    });

    expect(session.stepAttempts.length).toBe(2);
    expect(session.stepAttempts[1].attemptNumber).toBe(2);
    expect(session.misconceptionCounts).toEqual({ reaction_count_error: 1 });
  });

  it('summarizes misconceptions correctly', () => {
    const attempts: GuidedStepAttempt[] = [
      {
        stepId: 'reactions',
        attemptNumber: 1,
        createdAt: '',
        isCorrect: false,
        score: 0,
        answersSnapshot: null,
        feedbackMessages: [],
        misconceptions: ['sign_reversed'],
        hintLevelUsed: 0
      },
      {
        stepId: 'reactions',
        attemptNumber: 2,
        createdAt: '',
        isCorrect: false,
        score: 0,
        answersSnapshot: null,
        feedbackMessages: [],
        misconceptions: ['sign_reversed', 'tension_compression_confusion'],
        hintLevelUsed: 0
      }
    ];

    const counts = summarizeMisconceptions(attempts);
    expect(counts).toEqual({
      sign_reversed: 2,
      tension_compression_confusion: 1
    });
  });

  it('calculates guided score with retries and hint deductions', () => {
    // 1st step: determinacy - correct on 1st try, no hint
    const attempt1: GuidedStepAttempt = {
      stepId: 'determinacy',
      attemptNumber: 1,
      createdAt: '',
      isCorrect: true,
      score: 1.0,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 0
    };

    // 2nd step: reactions - correct on 2nd try, hint level 1 used
    const attempt2a: GuidedStepAttempt = {
      stepId: 'reactions',
      attemptNumber: 1,
      createdAt: '',
      isCorrect: false,
      score: 0.0,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 1
    };
    const attempt2b: GuidedStepAttempt = {
      stepId: 'reactions',
      attemptNumber: 2,
      createdAt: '',
      isCorrect: true,
      score: 1.0,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 1
    };

    // 3rd step: zero_members - correct on 3rd try, hint level 2 used
    const attempt3a: GuidedStepAttempt = {
      stepId: 'zero_members',
      attemptNumber: 1,
      createdAt: '',
      isCorrect: false,
      score: 0.0,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 0
    };
    const attempt3b: GuidedStepAttempt = {
      stepId: 'zero_members',
      attemptNumber: 2,
      createdAt: '',
      isCorrect: false,
      score: 0.0,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 2
    };
    const attempt3c: GuidedStepAttempt = {
      stepId: 'zero_members',
      attemptNumber: 3,
      createdAt: '',
      isCorrect: true,
      score: 1.0,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 2
    };

    const stepAttempts = [attempt1, attempt2a, attempt2b, attempt3a, attempt3b, attempt3c];
    
    const { totalScore, skillBreakdown } = calculateGuidedScore(stepAttempts);

    // Expected determinacy score: correct on 1st try = 1.0. Max hint 0. Final = 1.0.
    expect(skillBreakdown.determinacy).toBe(1.0);

    // Expected reactions score: correct on 2nd try = base score 0.8. Max hint level 1 = -0.1. Final = 0.7.
    expect(skillBreakdown.reactions).toBe(0.7);

    // Expected zeroForceMembers score: correct on 3rd try = base score 0.7 (0.8 - (3-2)*0.1). Max hint level 2 = -0.2. Final = 0.5.
    expect(skillBreakdown.zeroForceMembers).toBe(0.5);

    // Missing partial-session steps do not receive inferred full credit.
    expect(skillBreakdown.jointSelection).toBe(0);

    expect(skillBreakdown.memberForces).toBe(0);

    // Total score: weighted sum of default weights:
    // determinacy: 0.15 * 1.0 = 0.15
    // reactions: 0.25 * 0.7 = 0.175
    // zero_members: 0.20 * 0.5 = 0.10
    // joint_sequence: 0.10 * 0 = 0
    // member_forces: 0.30 * 0 = 0
    // Total = 0.15 + 0.175 + 0.10 = 0.425 -> rounded to 0.43
    expect(totalScore).toBe(0.43);
  });

  it('calculates first-attempt accuracy correctly', () => {
    // 1st step: determinacy - correct on 1st try
    const a1: GuidedStepAttempt = {
      stepId: 'determinacy',
      attemptNumber: 1,
      createdAt: '',
      isCorrect: true,
      score: 1,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 0
    };

    // 2nd step: reactions - incorrect on 1st try, correct on 2nd try
    const a2a: GuidedStepAttempt = {
      stepId: 'reactions',
      attemptNumber: 1,
      createdAt: '',
      isCorrect: false,
      score: 0,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 0
    };
    const a2b: GuidedStepAttempt = {
      stepId: 'reactions',
      attemptNumber: 2,
      createdAt: '',
      isCorrect: true,
      score: 1,
      answersSnapshot: {},
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 0
    };

    // 3rd step: joint selection at joint C - correct on 1st try
    const a3: GuidedStepAttempt = {
      stepId: 'joint_sequence',
      attemptNumber: 1,
      createdAt: '',
      isCorrect: true,
      score: 1,
      answersSnapshot: { jointId: 'j-c' },
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 0
    };

    // 4th step: member forces at joint C - incorrect on 1st try
    const a4: GuidedStepAttempt = {
      stepId: 'member_forces',
      attemptNumber: 1,
      createdAt: '',
      isCorrect: false,
      score: 0,
      answersSnapshot: { jointId: 'j-c' },
      feedbackMessages: [],
      misconceptions: [],
      hintLevelUsed: 0
    };

    // We have 4 unique question categories/keys:
    // determinacy (first attempt correct = true)
    // reactions (first attempt correct = false)
    // joint_sequence_j-c (first attempt correct = true)
    // member_forces_j-c (first attempt correct = false)
    // Accuracy should be 2/4 = 0.50

    const stepAttempts = [a1, a2a, a2b, a3, a4];
    expect(getFirstAttemptAccuracy(stepAttempts)).toBe(0.5);
  });

  it('summarizes hint usage count and max level', () => {
    const stepAttempts: GuidedStepAttempt[] = [
      {
        stepId: 'determinacy',
        attemptNumber: 1,
        createdAt: '',
        isCorrect: false,
        score: 0,
        answersSnapshot: {},
        feedbackMessages: [],
        misconceptions: [],
        hintLevelUsed: 1
      },
      {
        stepId: 'reactions',
        attemptNumber: 1,
        createdAt: '',
        isCorrect: false,
        score: 0,
        answersSnapshot: {},
        feedbackMessages: [],
        misconceptions: [],
        hintLevelUsed: 2
      },
      {
        stepId: 'reactions',
        attemptNumber: 2,
        createdAt: '',
        isCorrect: false,
        score: 0,
        answersSnapshot: {},
        feedbackMessages: [],
        misconceptions: [],
        hintLevelUsed: 3
      }
    ];

    const summary = getHintUsageSummary(stepAttempts);
    expect(summary.totalHintsUsed).toBe(4); // max level 1 for determinacy + max level 3 for reactions = 4
    expect(summary.maxHintLevel).toBe(3);
    expect(summary.hintsByStep.determinacy).toBe(1);
    expect(summary.hintsByStep.reactions).toBe(3);
  });

  it('builds standard Attempt from guided telemetry session', () => {
    const session: GuidedAttemptTelemetry = {
      problemId: 'truss-simple-triangle',
      problemVersion: 1,
      topic: 'trusses',
      startedAt: '2026-06-06T10:00:00Z',
      completedAt: '2026-06-06T10:15:00Z',
      totalScore: 0.85,
      completed: true,
      stepAttempts: [
        {
          stepId: 'reactions',
          attemptNumber: 1,
          createdAt: '',
          isCorrect: false,
          score: 0,
          answersSnapshot: {},
          feedbackMessages: [],
          misconceptions: ['sign_reversed'],
          hintLevelUsed: 0
        }
      ],
      misconceptionCounts: { sign_reversed: 1 },
      skillBreakdown: { determinacy: 1, reactions: 0.8, zeroForceMembers: 1, jointSelection: 1, memberForces: 1 },
      finalAnswers: { R_Ax: 300 }
    };

    const attempt = buildFinalAttemptFromTelemetry(session);
    expect(attempt.problemId).toBe('truss-simple-triangle');
    expect(attempt.score).toBe(0.85);
    expect(attempt.completed).toBe(true);
    expect(attempt.topic).toBe('trusses');
    expect(attempt.misconceptions).toEqual(['sign_reversed']);
    expect(attempt.feedback[0]).toContain('Misconception flagged: sign_reversed');
    expect(attempt.guidedTelemetry).toEqual(session);
    expect(attempt.answers).toEqual({ R_Ax: 300 });
  });
});
