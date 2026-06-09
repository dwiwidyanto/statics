import type { GuidedAttemptTelemetry } from '../progress/types';
import type { TrussModel } from './types';
import type { DeterminacyAnswers, GuidedTrussState, GuidedTrussStep } from './guidedTypes';
import { getRecommendedNextJoints } from './guidedWorkflow';

export type GuidedTrussPathStatus =
  | 'available'
  | 'all_members_solved'
  | 'blocked_requires_simultaneous_equilibrium';

export interface GuidedTrussStateModel extends GuidedTrussState {
  completionWarning: string | null;
  pathStatus: GuidedTrussPathStatus;
}

export interface GuidedTrussCompletionGuard {
  canSave: boolean;
  pathStatus: GuidedTrussPathStatus;
  warnings: string[];
  missingMemberIds: string[];
  missingEvidenceMemberIds: string[];
}

const emptyDeterminacyAnswers: DeterminacyAnswers = {
  m: null,
  r: null,
  j: null,
  classification: null
};

const emptyScoreBreakdown = {
  determinacy: 0,
  reactions: 0,
  zeroForceMembers: 0,
  jointSelection: 0,
  memberForces: 0
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function withPathStatus(problem: TrussModel, state: GuidedTrussStateModel): GuidedTrussStateModel {
  return {
    ...state,
    pathStatus: getGuidedTrussPathStatus(problem, state)
  };
}

export function createInitialGuidedTrussState(problem: TrussModel): GuidedTrussStateModel {
  return withPathStatus(problem, {
    currentStep: 'overview',
    determinacyAnswers: { ...emptyDeterminacyAnswers },
    reactionAnswers: {},
    zeroForceSelections: [],
    solvedMemberForces: {},
    solvedReactions: {},
    solvedMemberIds: [],
    solvedJointIds: [],
    jointSequence: [],
    currentSolvingJointId: null,
    currentJointAnswers: {},
    scoreBreakdown: { ...emptyScoreBreakdown },
    misconceptions: [],
    completionWarning: null,
    pathStatus: 'available'
  });
}

export function applyOverviewCompleted(problem: TrussModel, state: GuidedTrussStateModel): GuidedTrussStateModel {
  return withPathStatus(problem, { ...state, currentStep: 'determinacy', completionWarning: null });
}

export function applyDeterminacyCompleted(
  problem: TrussModel,
  state: GuidedTrussStateModel,
  misconceptions: string[]
): GuidedTrussStateModel {
  return withPathStatus(problem, {
    ...state,
    currentStep: 'reactions',
    misconceptions: [...state.misconceptions, ...misconceptions],
    completionWarning: null
  });
}

export function applyReactionsCompleted(
  problem: TrussModel,
  state: GuidedTrussStateModel,
  solvedReactions: Record<string, number>,
  misconceptions: string[]
): GuidedTrussStateModel {
  return withPathStatus(problem, {
    ...state,
    currentStep: 'zero_members',
    solvedReactions: { ...solvedReactions },
    misconceptions: [...state.misconceptions, ...misconceptions],
    completionWarning: null
  });
}

export function applyZeroForceCompleted(
  problem: TrussModel,
  state: GuidedTrussStateModel,
  referenceZeroForceIds: string[],
  misconceptions: string[]
): GuidedTrussStateModel {
  const correctZeros = state.zeroForceSelections.filter(id => referenceZeroForceIds.includes(id));
  const solvedMemberForces = { ...state.solvedMemberForces };
  for (const memberId of correctZeros) {
    solvedMemberForces[memberId] = 0;
  }

  return withPathStatus(problem, {
    ...state,
    currentStep: 'joint_sequence',
    solvedMemberForces,
    solvedMemberIds: unique([...state.solvedMemberIds, ...correctZeros]),
    misconceptions: [...state.misconceptions, ...misconceptions],
    completionWarning: null
  });
}

export function applyJointSelected(
  problem: TrussModel,
  state: GuidedTrussStateModel,
  jointId: string,
  misconceptions: string[]
): GuidedTrussStateModel {
  return withPathStatus(problem, {
    ...state,
    currentSolvingJointId: jointId,
    misconceptions: [...state.misconceptions, ...misconceptions],
    completionWarning: null
  });
}

export function applyMemberForcesSolved(
  problem: TrussModel,
  state: GuidedTrussStateModel,
  solvedForces: Record<string, number>,
  misconceptions: string[]
): GuidedTrussStateModel {
  const solvedMemberForces = { ...state.solvedMemberForces, ...solvedForces };
  const solvedMemberIds = unique([...state.solvedMemberIds, ...Object.keys(solvedForces)]);
  const solvedJointIds = state.currentSolvingJointId
    ? [...state.solvedJointIds, state.currentSolvingJointId]
    : state.solvedJointIds;
  const jointSequence = state.currentSolvingJointId
    ? [...state.jointSequence, state.currentSolvingJointId]
    : state.jointSequence;

  return withPathStatus(problem, {
    ...state,
    currentStep: 'joint_sequence',
    solvedMemberForces,
    solvedMemberIds,
    solvedJointIds,
    jointSequence,
    currentSolvingJointId: null,
    currentJointAnswers: {},
    misconceptions: [...state.misconceptions, ...misconceptions],
    completionWarning: null
  });
}

export function applyScoreAndMisconceptions(
  problem: TrussModel,
  state: GuidedTrussStateModel,
  scoreBreakdown: GuidedTrussState['scoreBreakdown'],
  misconceptions: string[]
): GuidedTrussStateModel {
  return withPathStatus(problem, {
    ...state,
    scoreBreakdown: { ...scoreBreakdown },
    misconceptions: unique(misconceptions)
  });
}

export function applyCompletionWarning(
  problem: TrussModel,
  state: GuidedTrussStateModel,
  completionWarning: string | null
): GuidedTrussStateModel {
  return withPathStatus(problem, { ...state, completionWarning });
}

export function getGuidedTrussPathStatus(problem: TrussModel, state: Pick<GuidedTrussStateModel, 'currentStep' | 'currentSolvingJointId' | 'solvedMemberIds'>): GuidedTrussPathStatus {
  const solvedMemberIds = new Set(state.solvedMemberIds);
  if (problem.members.every(member => solvedMemberIds.has(member.id))) {
    return 'all_members_solved';
  }

  const recommended = getRecommendedNextJoints(problem, state.solvedMemberIds);
  if (state.currentStep === 'joint_sequence' && !state.currentSolvingJointId && recommended.length === 0) {
    return 'blocked_requires_simultaneous_equilibrium';
  }

  return 'available';
}

function getMemberForceEvidence(telemetry?: GuidedAttemptTelemetry): Set<string> {
  const evidence = new Set<string>();
  for (const attempt of telemetry?.stepAttempts ?? []) {
    if (attempt.stepId === 'zero_members' && attempt.isCorrect) {
      for (const memberId of attempt.answersSnapshot.selectedMemberIds) {
        evidence.add(memberId);
      }
    }
    if (attempt.stepId === 'member_forces' && attempt.isCorrect) {
      for (const memberId of attempt.answersSnapshot.unknownMemberIds) {
        evidence.add(memberId);
      }
    }
  }
  return evidence;
}

export function buildGuidedTrussCompletionGuard(args: {
  problem: TrussModel;
  state: GuidedTrussStateModel;
  telemetry?: GuidedAttemptTelemetry;
}): GuidedTrussCompletionGuard {
  const pathStatus = getGuidedTrussPathStatus(args.problem, args.state);
  const solvedMemberIds = new Set(args.state.solvedMemberIds);
  const evidence = getMemberForceEvidence(args.telemetry);
  const missingMemberIds = args.problem.members
    .filter(member => !solvedMemberIds.has(member.id))
    .map(member => member.id);
  const missingEvidenceMemberIds = args.problem.members
    .filter(member => solvedMemberIds.has(member.id) && (!args.telemetry || !evidence.has(member.id)))
    .map(member => member.id);

  const warnings: string[] = [];
  if (pathStatus === 'blocked_requires_simultaneous_equilibrium') {
    warnings.push(
      'The guided method-of-joints path is blocked. Simultaneous joint equilibrium may be valid for this determinate truss, but it is not a completed step-by-step guided method-of-joints attempt.'
    );
  }
  if (missingMemberIds.length > 0) {
    warnings.push(`Missing member-force evidence for required member(s): ${missingMemberIds.join(', ')}.`);
  }
  if (missingEvidenceMemberIds.length > 0) {
    warnings.push(`Solved member(s) are missing telemetry evidence: ${missingEvidenceMemberIds.join(', ')}.`);
  }

  return {
    canSave: warnings.length === 0 && pathStatus === 'all_members_solved',
    pathStatus,
    warnings,
    missingMemberIds,
    missingEvidenceMemberIds
  };
}

export function canSaveGuidedTrussAttempt(args: {
  problem: TrussModel;
  state: GuidedTrussStateModel;
  telemetry?: GuidedAttemptTelemetry;
}): boolean {
  return buildGuidedTrussCompletionGuard(args).canSave;
}
