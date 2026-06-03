import type { 
  Support, 
  Load, 
  Reaction, 
  EquilibriumEquation, 
  EquationTerm, 
  SolverResult, 
  Point, 
  RigidBody
} from '../models/types';
import { getReactionsForSupport } from '../supports/support';
import { getLoadForceComponents, getDistributedLoadResultant } from '../loads/load';
import { calculateMoment } from '../geometry/vector2d';

/**
 * Solve for reaction forces/moments on a 2D rigid body in equilibrium.
 */
export function solveEquilibrium(
  body: RigidBody,
  supports: Support[],
  loads: Load[]
): SolverResult {
  const messages: string[] = [];
  
  // 1. Gather all reactions
  const allReactions: Reaction[] = [];
  for (const support of supports) {
    allReactions.push(...getReactionsForSupport(support));
  }
  
  const numUnknowns = allReactions.length;

  // 2. Select moment pivot point
  // By convention, we use the first support's position, or body center if no supports
  let pivot: Point = { x: body.width / 2, y: body.height / 2 };
  if (supports.length > 0) {
    pivot = supports[0].position;
  }

  // 3. Build Equations
  // We have 3 equations of equilibrium in 2D:
  // Eq 0: Sum Fx = 0
  // Eq 1: Sum Fy = 0
  // Eq 2: Sum M_pivot = 0

  // We want to formulate these equations as:
  // Sum (coeff * Unknown) + Sum (known loads) = 0
  // => Sum (coeff * Unknown) = -Sum (known loads)

  // Initialize terms
  const fxTerms: EquationTerm[] = [];
  const fyTerms: EquationTerm[] = [];
  const momentTerms: EquationTerm[] = [];

  let fxRhs = 0;
  let fyRhs = 0;
  let momentRhs = 0;

  // Process loads (known forces and moments)
  for (const load of loads) {
    if (load.type === 'applied_moment') {
      // Moments only contribute to the moment equation
      // Note: Moment on the LHS is +load.magnitude. We move it to the RHS: -load.magnitude.
      momentRhs -= load.magnitude;
      momentTerms.push({
        coefficient: load.magnitude,
        variable: '',
        isUnknown: false,
        label: `${load.magnitude >= 0 ? '+' : ''}${load.magnitude.toFixed(1)} (moment ${load.label})`,
      });
    } else {
      const forceVec = getLoadForceComponents(load);
      
      // Horizontal force contribution
      if (Math.abs(forceVec.x) > 1e-5) {
        fxRhs -= forceVec.x;
        fxTerms.push({
          coefficient: forceVec.x,
          variable: '',
          isUnknown: false,
          label: `${forceVec.x >= 0 ? '+' : ''}${forceVec.x.toFixed(1)} (${load.label}_x)`,
        });
      }

      // Vertical force contribution
      if (Math.abs(forceVec.y) > 1e-5) {
        fyRhs -= forceVec.y;
        fyTerms.push({
          coefficient: forceVec.y,
          variable: '',
          isUnknown: false,
          label: `${forceVec.y >= 0 ? '+' : ''}${forceVec.y.toFixed(1)} (${load.label}_y)`,
        });
      }

      // Moment contribution
      let appPos: Point;
      if (load.type === 'distributed_load') {
        const resultant = getDistributedLoadResultant(load);
        appPos = resultant.position;
      } else {
        appPos = load.position;
      }

      const momentVal = calculateMoment(forceVec, appPos, pivot);
      if (Math.abs(momentVal) > 1e-5) {
        momentRhs -= momentVal;
        momentTerms.push({
          coefficient: momentVal,
          variable: '',
          isUnknown: false,
          label: `${momentVal >= 0 ? '+' : ''}${momentVal.toFixed(1)} (moment of ${load.label})`,
        });
      }
    }
  }

  // Fill in reactions (unknowns)
  // For each reaction, add it to the corresponding equation's terms
  for (const reaction of allReactions) {
    // Fx contribution: coeff is reaction.direction.x
    if (Math.abs(reaction.direction.x) > 1e-5 || reaction.type === 'force_x') {
      fxTerms.push({
        coefficient: reaction.direction.x,
        variable: reaction.symbol,
        isUnknown: true,
        label: formatCoeff(reaction.direction.x, reaction.symbol),
      });
    }

    // Fy contribution: coeff is reaction.direction.y
    if (Math.abs(reaction.direction.y) > 1e-5 || reaction.type === 'force_y') {
      fyTerms.push({
        coefficient: reaction.direction.y,
        variable: reaction.symbol,
        isUnknown: true,
        label: formatCoeff(reaction.direction.y, reaction.symbol),
      });
    }

    // Moment contribution
    if (reaction.type === 'moment') {
      momentTerms.push({
        coefficient: 1,
        variable: reaction.symbol,
        isUnknown: true,
        label: `+ ${reaction.symbol}`,
      });
    } else {
      // Force reaction moment: M = rx * Fy - ry * Fx
      // Since reaction force vector is magnitude * direction,
      // its moment is magnitude * calculateMoment(direction, position, pivot)
      const mCoeff = calculateMoment(reaction.direction, reaction.position, pivot);
      if (Math.abs(mCoeff) > 1e-5) {
        momentTerms.push({
          coefficient: mCoeff,
          variable: reaction.symbol,
          isUnknown: true,
          label: formatCoeff(mCoeff, reaction.symbol),
        });
      }
    }
  }

  // Format equations as string for UI rendering
  const eqStrings = {
    fx: renderEquationString(fxTerms, fxRhs),
    fy: renderEquationString(fyTerms, fyRhs),
    moment: renderEquationString(momentTerms, momentRhs),
  };

  // 4. Solve the Linear System (if determinate)
  let determinacy: DeterminacyClassification = 'statically_determinate';
  let stability: StabilityClassification = 'stable';
  const solvedReactions: Record<string, number> = {};

  if (numUnknowns < 3) {
    determinacy = 'unstable';
    stability = 'unstable';
    messages.push('Unstable: Fewer than 3 reaction constraints. The body is free to move.');
  } else if (numUnknowns > 3) {
    determinacy = 'statically_indeterminate';
    stability = 'stable'; // Assumed stable unless there is geometric instability
    messages.push('Statically Indeterminate: More than 3 reactions. Cannot solve using statics alone.');
  }

  // Even if it has 3 or more unknowns, we check for geometric stability
  // Let's build the coefficient matrix for the 3 equilibrium equations:
  // Row 0: coeff in Sum Fx
  // Row 1: coeff in Sum Fy
  // Row 2: coeff in Sum M
  const A: number[][] = [];
  const B: number[] = [fxRhs, fyRhs, momentRhs];

  for (let eqIdx = 0; eqIdx < 3; eqIdx++) {
    A.push(new Array(numUnknowns).fill(0));
  }

  allReactions.forEach((reaction, rIdx) => {
    // Row 0: Fx
    if (reaction.type === 'force_x') {
      A[0][rIdx] = reaction.direction.x;
    } else if (reaction.type === 'force_y') {
      A[0][rIdx] = reaction.direction.x;
    }
    
    // Row 1: Fy
    if (reaction.type === 'force_y') {
      A[1][rIdx] = reaction.direction.y;
    } else if (reaction.type === 'force_x') {
      A[1][rIdx] = reaction.direction.y;
    }

    // Row 2: Moment
    if (reaction.type === 'moment') {
      A[2][rIdx] = 1;
    } else {
      A[2][rIdx] = calculateMoment(reaction.direction, reaction.position, pivot);
    }
  });

  // Check rank / solvability if exactly 3 unknowns
  let isSolved = false;
  if (numUnknowns === 3) {
    const A_copy = A.map(row => [...row]);
    const B_copy = [...B];
    const solution = solveLinearSystem(A_copy, B_copy);

    if (solution === null) {
      stability = 'unstable';
      determinacy = 'unstable';
      messages.push('Unstable (Geometric Instability): The support lines of action are parallel or intersect at a single point, allowing rotation or translation.');
    } else {
      isSolved = true;
      allReactions.forEach((reaction, rIdx) => {
        solvedReactions[reaction.symbol] = solution[rIdx];
      });
    }
  } else if (numUnknowns > 3) {
    // For indeterminate, check if the columns span the space (rank = 3)
    // We can test if we can find any 3 columns that form an invertible matrix.
    // If not, the system is geometrically unstable.
    let isGeomStable = false;
    for (let i = 0; i < numUnknowns; i++) {
      for (let j = i + 1; j < numUnknowns; j++) {
        for (let k = j + 1; k < numUnknowns; k++) {
          const subMatrix = [
            [A[0][i], A[0][j], A[0][k]],
            [A[1][i], A[1][j], A[1][k]],
            [A[2][i], A[2][j], A[2][k]]
          ];
          const det = determinant3x3(subMatrix);
          if (Math.abs(det) > 1e-4) {
            isGeomStable = true;
            break;
          }
        }
        if (isGeomStable) break;
      }
      if (isGeomStable) break;
    }

    if (!isGeomStable) {
      stability = 'unstable';
      determinacy = 'unstable';
      messages.push('Unstable (Geometric Instability): Despite having enough supports, their lines of action are parallel or concurrent, creating a mechanism.');
    }
  }

  return {
    isSolved,
    reactions: solvedReactions,
    equations: eqStrings,
    momentPivot: pivot,
    determinacy,
    stability,
    messages,
  };
}

/**
 * Solve a system Ax = B using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], B: number[]): number[] | null {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    // Find pivot row
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    // Swap rows
    const tempRow = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tempRow;

    const tempB = B[i];
    B[i] = B[maxRow];
    B[maxRow] = tempB;

    // Check if pivot is close to zero (singular)
    if (Math.abs(A[i][i]) < 1e-5) {
      return null;
    }

    // Eliminate column elements below pivot
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
      B[k] -= factor * B[i];
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (B[i] - sum) / A[i][i];
  }
  return x;
}

function determinant3x3(m: number[][]): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

function formatCoeff(coeff: number, symbol: string): string {
  if (Math.abs(coeff - 1) < 1e-5) return `+ ${symbol}`;
  if (Math.abs(coeff + 1) < 1e-5) return `- ${symbol}`;
  return `${coeff >= 0 ? '+' : '-'} ${Math.abs(coeff).toFixed(2)} * ${symbol}`;
}

function renderEquationString(terms: EquationTerm[], rhs: number): string {
  if (terms.length === 0) {
    return '0 = 0';
  }

  // Sort terms: unknowns first, then constants
  const unknowns = terms.filter(t => t.isUnknown);
  const constants = terms.filter(t => !t.isUnknown);

  let output = '';

  unknowns.forEach((term, idx) => {
    let lbl = term.label;
    if (idx === 0) {
      // Strip leading '+' sign
      if (lbl.startsWith('+ ')) {
        lbl = lbl.substring(2);
      }
    }
    output += (idx === 0 ? '' : ' ') + lbl;
  });

  constants.forEach((term) => {
    output += ' ' + term.label;
  });

  output += ' = 0';
  
  // Also show simplified version if we have constants
  if (constants.length > 0) {
    // LHS unknowns = RHS sum
    let lhs = '';
    unknowns.forEach((term, idx) => {
      let lbl = term.label;
      if (idx === 0 && lbl.startsWith('+ ')) {
        lbl = lbl.substring(2);
      }
      lhs += (idx === 0 ? '' : ' ') + lbl;
    });
    if (!lhs) lhs = '0';
    output += `   =>   ${lhs} = ${rhs.toFixed(1)}`;
  }

  return output;
}
