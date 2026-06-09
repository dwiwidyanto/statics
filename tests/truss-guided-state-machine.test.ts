import { describe, expect, it } from 'vitest';
import type { GuidedAttemptTelemetry } from '../src/lib/domain/progress/types';
import {
  applyMemberForcesSolved,
  buildGuidedTrussCompletionGuard,
  canSaveGuidedTrussAttempt,
  createInitialGuidedTrussState,
  getGuidedTrussPathStatus
} from '../src/lib/domain/truss/guidedStateMachine';
import { checkJointCanBeSolved, getRecommendedNextJoints } from '../src/lib/domain/truss/guidedWorkflow';
import { solveTruss } from '../src/lib/domain/truss/solver';
import type { TrussModel } from '../src/lib/domain/truss/types';

const triangleTruss: TrussModel = {
  id: 'state-triangle',
  title: 'Triangle',
  description: 'test',
  joints: [
    { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
    { id: 'j-b', label: 'B', position: { x: 4, y: 0 } },
    { id: 'j-c', label: 'C', position: { x: 2, y: 2 } }
  ],
  members: [
    { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
    { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
    { id: 'm-ca', label: 'CA', jointA: 'j-c', jointB: 'j-a' }
  ],
  supports: [
    { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
    { id: 'supp-b', type: 'roller', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
  ],
  loads: [
    { id: 'load-p1', jointId: 'j-c', magnitude: 600, angle: 270, label: 'P1' }
  ],
  topic: 'trusses',
  difficulty: 'easy',
  version: 1,
  learningObjectives: []
};

const kingPostTruss: TrussModel = {
  id: 'state-king-post',
  title: 'King Post',
  description: 'test',
  joints: [
    { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
    { id: 'j-b', label: 'B', position: { x: 4, y: 0 } },
    { id: 'j-c', label: 'C', position: { x: 2, y: 0 } },
    { id: 'j-d', label: 'D', position: { x: 2, y: 2 } }
  ],
  members: [
    { id: 'm-ac', label: 'AC', jointA: 'j-a', jointB: 'j-c' },
    { id: 'm-cb', label: 'CB', jointA: 'j-c', jointB: 'j-b' },
    { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
    { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
    { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' }
  ],
  supports: [
    { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
    { id: 'supp-b', type: 'roller', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
  ],
  loads: [
    { id: 'load-p1', jointId: 'j-d', magnitude: 800, angle: 270, label: 'P1' }
  ],
  topic: 'trusses',
  difficulty: 'easy',
  version: 1,
  learningObjectives: []
};

function fallbackOnlyTruss(): TrussModel {
  return {
    id: 'degree-three-fallback',
    title: 'Degree Three Fallback',
    description: 'No initial joint-by-joint path.',
    joints: [
      { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
      { id: 'j-b', label: 'B', position: { x: 0.8, y: 2.3 } },
      { id: 'j-c', label: 'C', position: { x: 0.1, y: 4.7 } },
      { id: 'j-d', label: 'D', position: { x: 4.2, y: 0.4 } },
      { id: 'j-e', label: 'E', position: { x: 3.5, y: 2.7 } },
      { id: 'j-f', label: 'F', position: { x: 4.8, y: 5.1 } }
    ],
    members: [
      { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
      { id: 'm-ae', label: 'AE', jointA: 'j-a', jointB: 'j-e' },
      { id: 'm-af', label: 'AF', jointA: 'j-a', jointB: 'j-f' },
      { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
      { id: 'm-be', label: 'BE', jointA: 'j-b', jointB: 'j-e' },
      { id: 'm-bf', label: 'BF', jointA: 'j-b', jointB: 'j-f' },
      { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' },
      { id: 'm-ce', label: 'CE', jointA: 'j-c', jointB: 'j-e' },
      { id: 'm-cf', label: 'CF', jointA: 'j-c', jointB: 'j-f' }
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
      { id: 'supp-d', type: 'roller', position: { x: 4.2, y: 0.4 }, angle: 0, label: 'D' }
    ],
    loads: [
      { id: 'load-p1', jointId: 'j-c', magnitude: 600, angle: 270, label: 'P1' }
    ],
    topic: 'trusses',
    difficulty: 'medium',
    version: 1,
    learningObjectives: []
  };
}

function telemetryWithMemberEvidence(problem: TrussModel, memberIds: string[]): GuidedAttemptTelemetry {
  return {
    problemId: problem.id,
    problemVersion: problem.version,
    topic: problem.topic,
    startedAt: '2026-06-10T00:00:00Z',
    totalScore: 1,
    completed: false,
    misconceptionCounts: {},
    skillBreakdown: {
      determinacy: 1,
      reactions: 1,
      zeroForceMembers: 1,
      jointSelection: 1,
      memberForces: 1
    },
    finalAnswers: {},
    stepAttempts: [
      {
        stepId: 'member_forces',
        createdAt: '2026-06-10T00:01:00Z',
        isCorrect: true,
        score: 1,
        feedbackMessages: [],
        misconceptions: [],
        hintLevelUsed: 0,
        attemptNumber: 1,
        answersSnapshot: {
          kind: 'member_forces',
          jointId: 'j-a',
          answers: Object.fromEntries(memberIds.map(id => [id, 1])),
          unknownMemberIds: memberIds
        }
      }
    ]
  };
}

describe('guided truss state machine', () => {
  it('keeps a normal triangle path available and allows save when every member has evidence', () => {
    let state = createInitialGuidedTrussState(triangleTruss);
    state = { ...state, currentStep: 'joint_sequence' };
    expect(getRecommendedNextJoints(triangleTruss, state.solvedMemberIds).length).toBeGreaterThan(0);
    expect(getGuidedTrussPathStatus(triangleTruss, state)).toBe('available');

    state = applyMemberForcesSolved(
      triangleTruss,
      { ...state, currentSolvingJointId: 'j-a' },
      { 'm-ab': 100, 'm-bc': -50, 'm-ca': 75 },
      []
    );
    const telemetry = telemetryWithMemberEvidence(triangleTruss, triangleTruss.members.map(member => member.id));
    expect(buildGuidedTrussCompletionGuard({ problem: triangleTruss, state, telemetry }).canSave).toBe(true);
    expect(canSaveGuidedTrussAttempt({ problem: triangleTruss, state, telemetry })).toBe(true);
  });

  it('rejects a collinear two-unknown joint while preserving later valid recommendations', () => {
    const feedback = checkJointCanBeSolved(kingPostTruss, 'j-c', ['m-cd']);
    const recommended = getRecommendedNextJoints(kingPostTruss, ['m-cd']);
    expect(feedback.isValid).toBe(false);
    expect(feedback.message).toContain('collinear');
    expect(recommended).not.toContain('j-c');
    expect(recommended).toContain('j-a');
  });

  it('blocks fallback-only determinate trusses from fake guided completion', () => {
    const truss = fallbackOnlyTruss();
    const solverResult = solveTruss(truss);
    const state = {
      ...createInitialGuidedTrussState(truss),
      currentStep: 'joint_sequence' as const
    };
    const guard = buildGuidedTrussCompletionGuard({ problem: truss, state });
    expect(solverResult.solverMethod).toBe('simultaneous_joint_equilibrium_fallback');
    expect(getRecommendedNextJoints(truss, [])).toEqual([]);
    expect(guard.pathStatus).toBe('blocked_requires_simultaneous_equilibrium');
    expect(guard.canSave).toBe(false);
    expect(guard.warnings.join(' ')).toContain('Simultaneous joint equilibrium');
  });

  it('blocks incomplete guided state and names missing member-force evidence', () => {
    const state = {
      ...createInitialGuidedTrussState(triangleTruss),
      currentStep: 'joint_sequence' as const,
      solvedMemberIds: ['m-ab']
    };
    const guard = buildGuidedTrussCompletionGuard({ problem: triangleTruss, state });
    expect(guard.canSave).toBe(false);
    expect(guard.missingMemberIds).toEqual(['m-bc', 'm-ca']);
    expect(guard.warnings.join(' ')).toContain('Missing member-force evidence');
    expect(guard.warnings.join(' ')).toContain('missing telemetry evidence');
  });
});
