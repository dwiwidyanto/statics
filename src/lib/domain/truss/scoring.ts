export interface TrussScoringOptions {
  absoluteTolerance: number; // default 2
  relativeTolerance: number; // default 0.01 (1%)
}

export interface AnswerFeedback {
  status: 'correct' | 'missing' | 'sign_reversed' | 'zero_expected' | 'nonzero_expected' | 'incorrect';
  message: string;
  messageId?: string; // for potential translation support in future
}

export interface TrussScoreResult {
  score: number; // 0 to 1
  completed: boolean;
  perReactionFeedback: Record<string, AnswerFeedback>;
  perMemberFeedback: Record<string, AnswerFeedback>;
  summaryMessages: string[];
}

const DEFAULT_OPTIONS: TrussScoringOptions = {
  absoluteTolerance: 2,
  relativeTolerance: 0.01,
};

export function isBlankInput(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

/**
 * Check if a single answer value is within tolerance of the reference.
 */
function isWithinTolerance(
  userValue: number,
  referenceValue: number,
  options: TrussScoringOptions
): boolean {
  const absDiff = Math.abs(userValue - referenceValue);

  // Absolute tolerance check
  if (absDiff <= options.absoluteTolerance) return true;

  // Relative tolerance check (avoid division by zero)
  if (Math.abs(referenceValue) > 1e-9) {
    const relDiff = absDiff / Math.abs(referenceValue);
    if (relDiff <= options.relativeTolerance) return true;
  }

  return false;
}

/**
 * Check if the user's answer has the right magnitude but wrong sign.
 */
function isSignReversed(
  userValue: number,
  referenceValue: number,
  options: TrussScoringOptions
): boolean {
  // Only meaningful when reference is nonzero and user is nonzero
  if (Math.abs(referenceValue) < 1e-9 || Math.abs(userValue) < 1e-9) return false;
  // Signs differ and magnitudes are close
  if (Math.sign(userValue) === Math.sign(referenceValue)) return false;
  return isWithinTolerance(Math.abs(userValue), Math.abs(referenceValue), options);
}

/**
 * Check a single student input against the reference value and return status/message.
 */
export function checkIndividualAnswer(
  user: number | null | undefined,
  ref: number,
  label: string,
  opts: TrussScoringOptions
): AnswerFeedback {
  if (user === undefined || user === null || isNaN(user)) {
    return {
      status: 'missing',
      message: `${label} was not answered.`
    };
  }

  // 1. Correct check
  if (isWithinTolerance(user, ref, opts)) {
    return {
      status: 'correct',
      message: `${label} is correct.`
    };
  }

  // 2. Sign reversed check
  if (isSignReversed(user, ref, opts)) {
    return {
      status: 'sign_reversed',
      message: `Sign appears reversed for ${label}. Check your sign convention.`
    };
  }

  // 3. Zero-force expected but non-zero entered
  if (Math.abs(ref) <= opts.absoluteTolerance) {
    return {
      status: 'zero_expected',
      message: `${label} is expected to be a zero-force member, but a non-zero value was entered.`
    };
  }

  // 4. Non-zero expected but zero entered
  if (Math.abs(ref) > opts.absoluteTolerance && Math.abs(user) <= opts.absoluteTolerance) {
    return {
      status: 'nonzero_expected',
      message: `${label} is expected to have a force, but zero was entered.`
    };
  }

  // 5. Default incorrect
  return {
    status: 'incorrect',
    message: `${label} differs from the expected value.`
  };
}

/**
 * Score student's reaction and member force inputs against solver reference results.
 * Weight: Reactions = 30%, Member forces = 70%.
 * Completed if overall score is >= 0.8.
 */
export function scoreTrussAttempt(
  userAnswers: {
    reactions: Record<string, number | null | undefined>;
    memberForces: Record<string, number | null | undefined>;
  },
  reference: {
    reactions: Record<string, number>;
    memberForces: Record<string, number>;
  },
  options?: Partial<TrussScoringOptions>,
  memberLabels?: Record<string, string> // maps member ID -> label
): TrussScoreResult {
  const opts: TrussScoringOptions = { ...DEFAULT_OPTIONS, ...options };
  const perReactionFeedback: Record<string, AnswerFeedback> = {};
  const perMemberFeedback: Record<string, AnswerFeedback> = {};
  const summaryMessages: string[] = [];

  const rxKeys = Object.keys(reference.reactions);
  let correctRxCount = 0;
  for (const rxKey of rxKeys) {
    const refVal = reference.reactions[rxKey];
    const userVal = userAnswers.reactions[rxKey];
    const feedback = checkIndividualAnswer(userVal, refVal, rxKey, opts);
    perReactionFeedback[rxKey] = feedback;
    if (feedback.status === 'correct') {
      correctRxCount++;
    } else {
      summaryMessages.push(feedback.message);
    }
  }

  const memKeys = Object.keys(reference.memberForces);
  let correctMemCount = 0;
  for (const memKey of memKeys) {
    const refVal = reference.memberForces[memKey];
    const userVal = userAnswers.memberForces[memKey];
    const label = memberLabels?.[memKey] || memKey;
    const feedback = checkIndividualAnswer(userVal, refVal, label, opts);
    perMemberFeedback[memKey] = feedback;
    if (feedback.status === 'correct') {
      correctMemCount++;
    } else {
      summaryMessages.push(feedback.message);
    }
  }

  const rxScore = rxKeys.length > 0 ? (correctRxCount / rxKeys.length) : 1.0;
  const memScore = memKeys.length > 0 ? (correctMemCount / memKeys.length) : 1.0;

  // Weighted score calculation: 30% reactions, 70% member forces
  let score = 0;
  if (rxKeys.length > 0 && memKeys.length > 0) {
    score = 0.3 * rxScore + 0.7 * memScore;
  } else if (rxKeys.length > 0) {
    score = rxScore;
  } else if (memKeys.length > 0) {
    score = memScore;
  } else {
    score = 1.0;
  }

  const completed = score >= 0.8 - 1e-9;

  return {
    score,
    completed,
    perReactionFeedback,
    perMemberFeedback,
    summaryMessages
  };
}
