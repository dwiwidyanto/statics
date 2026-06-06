import { describe, it, expect } from 'vitest';
import { beamProblems } from '../src/content/problems/beam-problems';
import { starterProblems } from '../src/content/problems/statics-problems';
import { computeReferenceSolution } from '../src/content/problems/problem-utils';

describe('Problem Metadata Validation', () => {
  const allProblems = [...beamProblems, ...starterProblems];

  it('verifies all problems have complete practice metadata', () => {
    allProblems.forEach((problem) => {
      expect(problem.id).toBeDefined();
      expect(problem.topic).toBeDefined();
      expect(['fbd', 'equilibrium', 'determinacy', 'beam-internal-forces']).toContain(problem.topic);
      expect(problem.difficulty).toBeDefined();
      expect(['easy', 'medium', 'hard']).toContain(problem.difficulty);
      expect(typeof problem.version).toBe('number');
      expect(Array.isArray(problem.learningObjectives)).toBe(true);
      expect(problem.learningObjectives.length).toBeGreaterThan(0);
    });
  });

  it('computes reference solutions for determinate problems', () => {
    beamProblems.forEach((problem) => {
      if (problem.expectedDeterminacy === 'statically_determinate') {
        const solution = computeReferenceSolution(problem);
        expect(solution.reactions).toBeDefined();
        expect(Object.keys(solution.reactions || {}).length).toBeGreaterThan(0);
        expect(solution.keySections).toBeDefined();
        expect(solution.keySections?.length).toBeGreaterThan(0);
      }
    });
  });
});
