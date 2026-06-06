/**
 * Pure scoring function for comparing student answers against reference reactions.
 *
 * Tolerance policy (from spec):
 *   - Absolute tolerance: 2 N or 2 N·m
 *   - Relative tolerance: 1%
 *   - A value passes if EITHER condition is met.
 *
 * Score = fraction of correct reaction components (partial credit).
 */

export interface ScoringOptions {
  absoluteTolerance: number; // default 2
  relativeTolerance: number; // default 0.01 (1%)
}

export interface ScoringResult {
  score: number; // 0 to 1
  feedback: string[];
  correctCount: number;
  totalCount: number;
}

const DEFAULT_OPTIONS: ScoringOptions = {
  absoluteTolerance: 2,
  relativeTolerance: 0.01,
};

/**
 * Check if a single answer value is within tolerance of the reference.
 */
function isWithinTolerance(
  userValue: number,
  referenceValue: number,
  options: ScoringOptions
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
  options: ScoringOptions
): boolean {
  // Only meaningful when reference is nonzero and user is nonzero
  if (Math.abs(referenceValue) < 1e-9 || Math.abs(userValue) < 1e-9) return false;
  // Signs differ and magnitudes are close
  if (Math.sign(userValue) === Math.sign(referenceValue)) return false;
  return isWithinTolerance(Math.abs(userValue), Math.abs(referenceValue), options);
}

/**
 * Score student reaction answers against reference values.
 *
 * @param userAnswers   Record mapping reaction symbol to student's numeric answer
 * @param referenceReactions Record mapping reaction symbol to solved reference value
 * @param options       Optional tolerance configuration
 */
export function scoreReactionAnswers(
  userAnswers: Record<string, number>,
  referenceReactions: Record<string, number>,
  options?: Partial<ScoringOptions>
): ScoringResult {
  const opts: ScoringOptions = { ...DEFAULT_OPTIONS, ...options };
  const feedback: string[] = [];
  let correctCount = 0;
  const keys = Object.keys(referenceReactions);
  const totalCount = keys.length;

  if (totalCount === 0) {
    return { score: 1, feedback: [], correctCount: 0, totalCount: 0 };
  }

  for (const key of keys) {
    const ref = referenceReactions[key];
    const user = userAnswers[key];

    if (user === undefined || user === null || isNaN(user)) {
      feedback.push(`${key} was not answered.`);
      continue;
    }

    if (isWithinTolerance(user, ref, opts)) {
      correctCount++;
      feedback.push(`${key} is correct.`);
    } else if (isSignReversed(user, ref, opts)) {
      feedback.push(`Sign appears reversed for ${key}. Check your sign convention.`);
    } else {
      // Determine which type of reaction for context-appropriate feedback
      if (key.startsWith('M_')) {
        feedback.push(
          `${key} differs from the expected value. Check your moment equation.`
        );
      } else if (key.endsWith('y')) {
        feedback.push(
          `${key} differs from the expected value. Check your moment equation.`
        );
      } else {
        feedback.push(
          `${key} differs from the expected value. Check your equilibrium equations.`
        );
      }
    }
  }

  return {
    score: correctCount / totalCount,
    feedback,
    correctCount,
    totalCount,
  };
}

/**
 * Check if a reaction input value is blank, null, or undefined.
 * Accepts numeric 0 and negative values as valid (not blank).
 */
export function isBlankReactionInput(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}
