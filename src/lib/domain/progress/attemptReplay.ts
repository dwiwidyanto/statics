import type { GuidedAttemptTelemetry } from './types';
import type { TrussModel, TrussSolverResult } from '../truss/types';

export interface TrussReplayState {
  solvedReactions: Record<string, number>;
  solvedMemberForces: Record<string, number>;
  solvedMemberIds: string[];
  currentSolvingJointId: string | null;
  zeroForceSelections: string[];
  hideMemberForces: boolean;
  isSolved: boolean;
}

export function emptyTrussReplayState(): TrussReplayState {
  return {
    solvedReactions: {},
    solvedMemberForces: {},
    solvedMemberIds: [],
    currentSolvingJointId: null,
    zeroForceSelections: [],
    hideMemberForces: true,
    isSolved: false
  };
}

export function reconstructTrussReplayState(args: {
  telemetry: GuidedAttemptTelemetry;
  selectedAttemptIdx: number;
  problem: TrussModel;
  solverResult: TrussSolverResult;
}): TrussReplayState {
  const { telemetry, problem, solverResult } = args;
  if (telemetry.stepAttempts.length === 0) return emptyTrussReplayState();

  const selectedAttemptIdx = Math.max(0, Math.min(args.selectedAttemptIdx, telemetry.stepAttempts.length - 1));
  const state = emptyTrussReplayState();

  for (let idx = 0; idx <= selectedAttemptIdx; idx++) {
    const stepAttempt = telemetry.stepAttempts[idx];

    if (stepAttempt.stepId === 'reactions' && stepAttempt.isCorrect) {
      Object.assign(state.solvedReactions, solverResult.reactions);
    }

    if (stepAttempt.stepId === 'zero_members') {
      state.zeroForceSelections = stepAttempt.answersSnapshot.selectedMemberIds;
      if (stepAttempt.isCorrect || idx < selectedAttemptIdx) {
        for (const memberId of solverResult.zeroForceMembers) {
          if (state.zeroForceSelections.includes(memberId)) {
            state.solvedMemberForces[memberId] = 0;
            state.solvedMemberIds.push(memberId);
          }
        }
      }
    }

    if (stepAttempt.stepId === 'joint_sequence') {
      state.currentSolvingJointId = stepAttempt.answersSnapshot.jointId;
    }

    if (stepAttempt.stepId === 'member_forces') {
      state.currentSolvingJointId = stepAttempt.answersSnapshot.jointId;
      if (stepAttempt.isCorrect || idx < selectedAttemptIdx) {
        for (const memberId of stepAttempt.answersSnapshot.unknownMemberIds) {
          state.solvedMemberForces[memberId] = solverResult.memberForces[memberId] ?? 0;
          state.solvedMemberIds.push(memberId);
        }
      }
    }
  }

  state.solvedMemberIds = [...new Set(state.solvedMemberIds)];
  const currentSelectedStep = telemetry.stepAttempts[selectedAttemptIdx].stepId;
  state.hideMemberForces =
    currentSelectedStep === 'overview' ||
    currentSelectedStep === 'determinacy' ||
    currentSelectedStep === 'reactions';
  state.isSolved = state.solvedMemberIds.length === problem.members.length;
  return state;
}
