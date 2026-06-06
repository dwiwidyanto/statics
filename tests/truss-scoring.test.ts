import { describe, it, expect } from 'vitest';
import { scoreTrussAttempt } from '../src/lib/domain/truss/scoring';

describe('Truss Scoring and Tolerance Engine', () => {
  const reference = {
    reactions: {
      R_Ax: 0,
      R_Ay: 300,
      R_By: 300,
    },
    memberForces: {
      'm-ab': 350,
      'm-bc': -420,
      'm-ca': 0,
    }
  };

  const memberLabels = {
    'm-ab': 'AB',
    'm-bc': 'BC',
    'm-ca': 'CA',
  };

  it('scores exact correct reactions and member forces as 1.0', () => {
    const userAnswers = {
      reactions: {
        R_Ax: 0,
        R_Ay: 300,
        R_By: 300,
      },
      memberForces: {
        'm-ab': 350,
        'm-bc': -420,
        'm-ca': 0,
      }
    };

    const result = scoreTrussAttempt(userAnswers, reference, {}, memberLabels);
    expect(result.score).toBe(1.0);
    expect(result.completed).toBe(true);
    expect(result.summaryMessages).toEqual([]);
    expect(result.perReactionFeedback.R_Ax.status).toBe('correct');
    expect(result.perMemberFeedback['m-ab'].status).toBe('correct');
  });

  it('accepts answers within absolute and relative tolerances', () => {
    const userAnswers = {
      reactions: {
        R_Ax: 1.5, // within absolute tolerance of 2
        R_Ay: 298.5, // within absolute tolerance of 2
        R_By: 301.8, // within absolute tolerance of 2
      },
      memberForces: {
        'm-ab': 353.2, // diff of 3.2 is > absolute 2, but 3.2 / 350 = 0.91% (within 1% relative)
        'm-bc': -423.5, // diff of 3.5 is > absolute 2, but 3.5 / 420 = 0.83% (within 1% relative)
        'm-ca': 1.0, // within absolute tolerance of 2
      }
    };

    const result = scoreTrussAttempt(userAnswers, reference, {}, memberLabels);
    expect(result.score).toBe(1.0);
    expect(result.completed).toBe(true);
    expect(result.summaryMessages).toEqual([]);
  });

  it('detects sign-reversed answers and provides sign feedback', () => {
    const userAnswers = {
      reactions: {
        R_Ax: 0,
        R_Ay: -300, // sign reversed
        R_By: 300,
      },
      memberForces: {
        'm-ab': 350,
        'm-bc': 420, // sign reversed (T instead of C)
        'm-ca': 0,
      }
    };

    const result = scoreTrussAttempt(userAnswers, reference, {}, memberLabels);
    // score = 0.3 * (2/3) + 0.7 * (2/3) = 2/3 = 0.67
    expect(result.score).toBeCloseTo(0.67, 2);
    expect(result.completed).toBe(false);
    expect(result.perReactionFeedback.R_Ay.status).toBe('sign_reversed');
    expect(result.perReactionFeedback.R_Ay.message).toContain('Sign appears reversed for R_Ay');
    expect(result.perMemberFeedback['m-bc'].status).toBe('sign_reversed');
    expect(result.perMemberFeedback['m-bc'].message).toContain('Sign appears reversed for BC');
  });

  it('provides specific feedback for zero-force expectations', () => {
    const userAnswers = {
      reactions: {
        R_Ax: 0,
        R_Ay: 300,
        R_By: 300,
      },
      memberForces: {
        'm-ab': 350,
        'm-bc': -420,
        'm-ca': 50, // expected zero, but entered non-zero 50
      }
    };

    const result = scoreTrussAttempt(userAnswers, reference, {}, memberLabels);
    expect(result.perMemberFeedback['m-ca'].status).toBe('zero_expected');
    expect(result.perMemberFeedback['m-ca'].message).toContain('CA is expected to be a zero-force member');
  });

  it('provides specific feedback when non-zero member is answered as zero', () => {
    const userAnswers = {
      reactions: {
        R_Ax: 0,
        R_Ay: 300,
        R_By: 300,
      },
      memberForces: {
        'm-ab': 0, // expected 350, entered 0
        'm-bc': -420,
        'm-ca': 0,
      }
    };

    const result = scoreTrussAttempt(userAnswers, reference, {}, memberLabels);
    expect(result.perMemberFeedback['m-ab'].status).toBe('nonzero_expected');
    expect(result.perMemberFeedback['m-ab'].message).toContain('AB is expected to have a force, but zero was entered');
  });

  it('handles missing answers and subtracts partial credit', () => {
    const userAnswers = {
      reactions: {
        R_Ax: 0,
        // R_Ay and R_By missing
      },
      memberForces: {
        'm-ab': 350,
        'm-bc': -420,
        'm-ca': 0,
      }
    };

    const result = scoreTrussAttempt(userAnswers as any, reference, {}, memberLabels);
    // reactions score = 1/3. members score = 3/3 = 1.0.
    // total score = 0.3 * (1/3) + 0.7 * 1.0 = 0.1 + 0.7 = 0.8.
    expect(result.score).toBeCloseTo(0.8, 2);
    expect(result.completed).toBe(true); // completed because >= 0.8
    expect(result.perReactionFeedback.R_Ay.status).toBe('missing');
    expect(result.perReactionFeedback.R_Ay.message).toContain('R_Ay was not answered');
  });
});
