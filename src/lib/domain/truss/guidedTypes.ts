export type GuidedTrussStep =
  | 'overview'       // Step 1
  | 'determinacy'    // Step 2
  | 'reactions'      // Step 3
  | 'zero_members'   // Step 4
  | 'joint_sequence' // Step 5
  | 'summary';       // Step 6

export interface DeterminacyAnswers {
  m: number | null;
  r: number | null;
  j: number | null;
  classification: 'statically_determinate' | 'statically_indeterminate' | 'unstable' | null;
}

export interface GuidedTrussState {
  currentStep: GuidedTrussStep;
  determinacyAnswers: DeterminacyAnswers;
  reactionAnswers: Record<string, number | null>;
  zeroForceSelections: string[]; // selected member IDs
  solvedMemberForces: Record<string, number>; // memberId -> force value
  solvedReactions: Record<string, number>; // reaction symbol -> value
  solvedMemberIds: string[]; // member IDs that have been solved
  solvedJointIds: string[]; // joint IDs that have been solved
  jointSequence: string[]; // sequence of joints chosen by user
  currentSolvingJointId: string | null; // joint selected for current MoJ step
  currentJointAnswers: Record<string, number | null>; // memberId -> value (for members currently being solved at joint)
  scoreBreakdown: {
    determinacy: number;
    reactions: number;
    zeroForceMembers: number;
    jointSelection: number;
    memberForces: number;
  };
  misconceptions: string[];
}

export interface JointSelectionFeedback {
  isValid: boolean;
  unknownsCount: number;
  message: string;
  messageId?: string;
}

export interface ZeroForceSelectionFeedback {
  score: number;
  correctIds: string[];
  missedIds: string[];
  falsePositiveIds: string[];
  message: string;
}

export interface JointEquationPrompt {
  jointId: string;
  jointLabel: string;
  unknownMemberIds: string[];
  unknownMemberLabels: string[];
  eqX: string;
  eqY: string;
}
