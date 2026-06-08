import type { Attempt, GuidedAttemptTelemetry, GuidedStepAttempt, GuidedStepId } from './types';

export const guidedScoreWeights = {
  overview: 0,
  determinacy: 0.15,
  reactions: 0.25,
  zero_members: 0.20,
  joint_sequence: 0.10,
  member_forces: 0.30,
  summary: 0
} as const satisfies Record<GuidedStepId, number>;

/**
 * Creates a new guided telemetry session.
 */
export function createGuidedAttemptSession(problem: { id: string; version: number; topic: string }): GuidedAttemptTelemetry {
  return {
    problemId: problem.id,
    problemVersion: problem.version,
    topic: problem.topic,
    startedAt: new Date().toISOString(),
    totalScore: 0,
    completed: false,
    stepAttempts: [],
    misconceptionCounts: {},
    skillBreakdown: {
      determinacy: 0,
      reactions: 0,
      zeroForceMembers: 0,
      jointSelection: 0,
      memberForces: 0
    },
    finalAnswers: {}
  };
}

/**
 * Records a step attempt in the session, automatically computing the attempt number.
 */
export function recordStepAttempt(
  session: GuidedAttemptTelemetry,
  stepAttempt: Omit<GuidedStepAttempt, 'attemptNumber'>
): GuidedAttemptTelemetry {
  const matchingAttempts = session.stepAttempts.filter(a => a.stepId === stepAttempt.stepId);
  const attemptNumber = matchingAttempts.length + 1;

  const newAttempt: GuidedStepAttempt = {
    ...stepAttempt,
    attemptNumber
  } as GuidedStepAttempt;

  const updatedStepAttempts = [...session.stepAttempts, newAttempt];
  const misconceptionCounts = summarizeMisconceptions(updatedStepAttempts);

  return {
    ...session,
    stepAttempts: updatedStepAttempts,
    misconceptionCounts
  };
}

/**
 * Summarizes the frequency of misconceptions across all step attempts.
 */
export function summarizeMisconceptions(stepAttempts: GuidedStepAttempt[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const attempt of stepAttempts) {
    if (attempt.misconceptions) {
      for (const misc of attempt.misconceptions) {
        counts[misc] = (counts[misc] || 0) + 1;
      }
    }
  }
  return counts;
}

/**
 * Calculates step scores and overall score.
 * Rules:
 * - If first attempt is correct: step base score = 1.0.
 * - If subsequent attempt is correct: base score starts at 0.8 and drops by 0.1 for each additional failure (minimum 0.4).
 * - If never correct: base score = 0.0.
 * - Hints reduce score: subtract 0.1 per max hint level used (down to a minimum of 0.3 if eventually correct).
 */
export function calculateGuidedScore(
  stepAttempts: GuidedStepAttempt[],
  customWeights?: Partial<Record<GuidedStepId, number>>
): {
  totalScore: number;
  skillBreakdown: Record<string, number>;
} {
  const weights = { ...guidedScoreWeights, ...customWeights };

  // Calculate score for a single-part step like determinacy, reactions, zero_members
  const calculateSingleStepScore = (stepId: GuidedStepId): number => {
    const attempts = stepAttempts.filter(a => a.stepId === stepId);
    if (attempts.length === 0) return 0;

    const correctAttempt = attempts.find(a => a.isCorrect);
    if (!correctAttempt) return 0; // Never eventually correct

    const triesNeeded = correctAttempt.attemptNumber;
    const baseScore = triesNeeded === 1 ? 1.0 : Math.max(0.4, 0.8 - (triesNeeded - 2) * 0.1);

    const maxHint = Math.max(0, ...attempts.map(a => a.hintLevelUsed));
    return Math.max(0.3, baseScore - 0.1 * maxHint);
  };

  // Determinacy
  const scoreDeterminacy = calculateSingleStepScore('determinacy');

  // Reactions
  const scoreReactions = calculateSingleStepScore('reactions');

  // Zero Force Members
  const scoreZeroMembers = calculateSingleStepScore('zero_members');

  // Joint Selection (Multiple joint selection attempts)
  // For joint selection, every attempt represents a joint selection choice.
  // We can grade this as: (correct selections) / (total selections).
  // Wait, let's treat every select action as an attempt. A correct attempt has isCorrect = true.
  const jointSelectionAttempts = stepAttempts.filter(a => a.stepId === 'joint_sequence');
  let scoreJointSelection = 0;
  if (jointSelectionAttempts.length > 0) {
    const correctCount = jointSelectionAttempts.filter(a => a.isCorrect).length;
    const totalCount = jointSelectionAttempts.length;
    const baseScore = totalCount > 0 ? correctCount / totalCount : 1.0;
    const maxHint = Math.max(0, ...jointSelectionAttempts.map(a => a.hintLevelUsed));
    scoreJointSelection = Math.max(0.3, baseScore - 0.1 * maxHint);
  }

  // Member Forces (Multiple member force verification attempts)
  const memberForcesAttempts = stepAttempts.filter(a => a.stepId === 'member_forces');
  let scoreMemberForces = 0;
  if (memberForcesAttempts.length > 0) {
    const correctCount = memberForcesAttempts.filter(a => a.isCorrect).length;
    const totalCount = memberForcesAttempts.length;
    const baseScore = totalCount > 0 ? correctCount / totalCount : 1.0;
    const maxHint = Math.max(0, ...memberForcesAttempts.map(a => a.hintLevelUsed));
    scoreMemberForces = Math.max(0.3, baseScore - 0.1 * maxHint);
  }

  const skillBreakdown = {
    determinacy: parseFloat(scoreDeterminacy.toFixed(2)),
    reactions: parseFloat(scoreReactions.toFixed(2)),
    zeroForceMembers: parseFloat(scoreZeroMembers.toFixed(2)),
    jointSelection: parseFloat(scoreJointSelection.toFixed(2)),
    memberForces: parseFloat(scoreMemberForces.toFixed(2))
  };

  // Calculate overall weighted score
  const rawTotalScore = (
    weights.determinacy * scoreDeterminacy +
    weights.reactions * scoreReactions +
    weights.zero_members * scoreZeroMembers +
    weights.joint_sequence * scoreJointSelection +
    weights.member_forces * scoreMemberForces
  );

  return {
    totalScore: parseFloat(rawTotalScore.toFixed(2)),
    skillBreakdown
  };
}

/**
 * Calculates first-attempt accuracy across all steps.
 * Accuracy is calculated by looking at unique question items/steps,
 * and checking if their first attempt was correct.
 */
export function getFirstAttemptAccuracy(stepAttempts: GuidedStepAttempt[]): number {
  // Group attempts by step ID.
  // For joint selection and member forces, we group by stepId and the jointId inside answersSnapshot
  const groups: Record<string, GuidedStepAttempt[]> = {};

  for (const attempt of stepAttempts) {
    let key = attempt.stepId as string;
    if (attempt.stepId === 'joint_sequence' && attempt.answersSnapshot?.jointId) {
      key = `joint_sequence_${attempt.answersSnapshot.jointId}`;
    } else if (attempt.stepId === 'member_forces' && attempt.answersSnapshot?.jointId) {
      key = `member_forces_${attempt.answersSnapshot.jointId}`;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(attempt);
  }

  const groupKeys = Object.keys(groups).filter(k => !k.startsWith('overview') && !k.startsWith('summary'));
  if (groupKeys.length === 0) return 0;

  let firstAttemptCorrectCount = 0;
  for (const key of groupKeys) {
    const attempts = groups[key];
    // Find the attempt with attemptNumber = 1 (or the earliest one)
    const firstAttempt = attempts.reduce((prev, curr) => (prev.attemptNumber < curr.attemptNumber ? prev : curr));
    if (firstAttempt.isCorrect) {
      firstAttemptCorrectCount++;
    }
  }

  return parseFloat((firstAttemptCorrectCount / groupKeys.length).toFixed(2));
}

/**
 * Summarizes hint usage.
 */
export function getHintUsageSummary(stepAttempts: GuidedStepAttempt[]): {
  totalHintsUsed: number;
  maxHintLevel: number;
  hintsByStep: Record<GuidedStepId, number>;
} {
  const hintsByStep: Record<GuidedStepId, number> = {
    overview: 0,
    determinacy: 0,
    reactions: 0,
    zero_members: 0,
    joint_sequence: 0,
    member_forces: 0,
    summary: 0
  };

  let totalHintsUsed = 0;
  let maxHintLevel = 0;

  // We only increment hint level once for a step when a new level is accessed.
  // To get the max hint level used per step, we find the maximum hint level among all attempts of that step.
  for (const attempt of stepAttempts) {
    if (attempt.hintLevelUsed > hintsByStep[attempt.stepId]) {
      hintsByStep[attempt.stepId] = Math.max(hintsByStep[attempt.stepId], attempt.hintLevelUsed);
    }
    maxHintLevel = Math.max(maxHintLevel, attempt.hintLevelUsed);
  }

  // Total hints used = sum of max hint level for each step category
  totalHintsUsed = Object.values(hintsByStep).reduce((sum, val) => sum + val, 0);

  return {
    totalHintsUsed,
    maxHintLevel,
    hintsByStep
  };
}

/**
 * Creates a standard Attempt record for repository storage from the telemetry session.
 */
export function buildFinalAttemptFromTelemetry(session: GuidedAttemptTelemetry): Attempt {
  const uniqueMisconceptions = Array.from(
    new Set(session.stepAttempts.flatMap(a => a.misconceptions || []))
  );

  return {
    id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 9),
    problemId: session.problemId,
    problemVersion: session.problemVersion,
    createdAt: session.completedAt || new Date().toISOString(),
    answers: session.finalAnswers,
    score: session.totalScore,
    feedback: uniqueMisconceptions.length > 0
      ? uniqueMisconceptions.map(m => `Misconception flagged: ${m}`)
      : ['Guided learning completed perfectly!'],
    completed: session.completed,
    topic: session.topic,
    skillBreakdown: session.skillBreakdown,
    misconceptions: uniqueMisconceptions,
    guidedTelemetry: session
  };
}
