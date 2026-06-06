/**
 * Utility to compute reference solutions from the solver.
 * Avoids manually hardcoding reaction values for beam problems.
 */

import type { ProblemModel, ReferenceSolution } from '../../lib/domain/models/types';
import { solveEquilibrium } from '../../lib/domain/solvers/equilibrium';
import { evaluateInternalForces, extractCriticalXPoints } from '../../lib/domain/diagrams/beam-diagrams';

/**
 * Run the solver on a problem and extract the reference solution.
 * Only works for statically determinate problems.
 */
export function computeReferenceSolution(problem: ProblemModel): ReferenceSolution {
  const result = solveEquilibrium(problem.body, problem.supports, problem.loads);
  const solution: ReferenceSolution = {
    determinacy: problem.expectedDeterminacy,
    stability: problem.expectedStability,
  };

  if (result.isSolved) {
    solution.reactions = { ...result.reactions };

    // Compute key SFD/BMD values at critical points
    const critX = extractCriticalXPoints(problem.body, problem.supports, problem.loads);
    const keySections: Array<{ x: number; shear?: number; moment?: number }> = [];

    for (const x of critX) {
      const right = evaluateInternalForces(
        problem.body, problem.supports, problem.loads, result.reactions, x, 'right'
      );
      keySections.push({
        x,
        shear: Math.round(right.shear * 100) / 100,
        moment: Math.round(right.moment * 100) / 100,
      });
    }

    solution.keySections = keySections;
  }

  return solution;
}
