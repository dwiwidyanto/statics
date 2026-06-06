import { describe, it, expect } from 'vitest';
import { scoreReactionAnswers } from '../src/lib/domain/progress/scoring';

describe('Scoring & Tolerance System', () => {
  const reference = {
    R_Ax: 0,
    R_Ay: 300,
    R_By: 300,
  };

  it('scores exact match as 1.0 with positive feedback', () => {
    const userAnswers = {
      R_Ax: 0,
      R_Ay: 300,
      R_By: 300,
    };
    const result = scoreReactionAnswers(userAnswers, reference);
    expect(result.score).toBe(1.0);
    expect(result.correctCount).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.feedback).toContain('R_Ax is correct.');
    expect(result.feedback).toContain('R_Ay is correct.');
    expect(result.feedback).toContain('R_By is correct.');
  });

  it('scores within absolute tolerance (+-2)', () => {
    const userAnswers = {
      R_Ax: 1.5,   // within absolute 2
      R_Ay: 298.5, // within absolute 2
      R_By: 301.8, // within absolute 2
    };
    const result = scoreReactionAnswers(userAnswers, reference);
    expect(result.score).toBe(1.0);
    expect(result.correctCount).toBe(3);
  });

  it('scores within relative tolerance (1%) for larger values', () => {
    const largeRef = {
      R_Ay: 10000,
    };
    const userAnswers = {
      R_Ay: 10090, // diff of 90 is > absolute 2, but 90 / 10000 = 0.9% (within 1%)
    };
    const result = scoreReactionAnswers(userAnswers, largeRef);
    expect(result.score).toBe(1.0);
    expect(result.correctCount).toBe(1);
  });

  it('detects sign-reversal and provides feedback', () => {
    const userAnswers = {
      R_Ax: 0,
      R_Ay: -300, // sign reversed
      R_By: 300,
    };
    const result = scoreReactionAnswers(userAnswers, reference);
    expect(result.score).toBe(2 / 3);
    expect(result.correctCount).toBe(2);
    expect(result.feedback).toContain('Sign appears reversed for R_Ay. Check your sign convention.');
  });

  it('gives partial credit and specific equation checks', () => {
    const userAnswers = {
      R_Ax: 0,
      R_Ay: 400, // incorrect
      R_By: 300,
    };
    const result = scoreReactionAnswers(userAnswers, reference);
    expect(result.score).toBe(2 / 3);
    expect(result.correctCount).toBe(2);
    expect(result.feedback).toContain('R_Ay differs from the expected value. Check your moment equation.');
  });

  it('handles unanswered reactions', () => {
    const userAnswers = {
      R_Ax: 0,
      R_Ay: 300,
      // R_By missing
    };
    const result = scoreReactionAnswers(userAnswers as any, reference);
    expect(result.score).toBe(2 / 3);
    expect(result.feedback).toContain('R_By was not answered.');
  });
});
