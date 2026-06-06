import type { TrussModel, TrussJoint } from './types';
import type { Support, Point, Reaction } from '../models/types';
import { getReactionsForSupport } from '../supports/support';
import { calculateMoment } from '../geometry/vector2d';

export interface SupportSolveResult {
  isSolved: boolean;
  determinacy: 'statically_determinate' | 'statically_indeterminate' | 'unstable';
  stability: 'stable' | 'unstable';
  reactions: Record<string, number>;
  rxValues: number[];
  allReactionsList: Reaction[];
  messages: string[];
}

/**
 * Computes support reactions using global rigid-body equilibrium equations (3x3).
 */
export function solveSupportReactions(
  truss: TrussModel,
  jointsMap: Map<string, TrussJoint>
): SupportSolveResult {
  const messages: string[] = [];
  const reactions: Record<string, number> = {};

  const joints = truss.joints;
  const members = truss.members;
  const supports = truss.supports;
  const loads = truss.loads;

  // Count support reaction components
  const allReactionsList: Reaction[] = [];
  for (const s of supports) {
    // Treat fixed supports at truss joints as pin supports (2 force reactions, no moment)
    const rawReactions = getReactionsForSupport(s);
    const filteredReactions = rawReactions.filter(r => r.type !== 'moment');
    if (rawReactions.some(r => r.type === 'moment')) {
      messages.push(`Fixed support at joint was treated as a pin support (moment reaction ignored).`);
    }
    allReactionsList.push(...filteredReactions);
  }

  const r = allReactionsList.length;
  const m = members.length;
  const j = joints.length;

  const requiredEquations = 2 * j;
  const unknowns = m + r;

  let determinacy: 'statically_determinate' | 'statically_indeterminate' | 'unstable' = 'statically_determinate';
  let stability: 'stable' | 'unstable' = 'stable';

  if (unknowns < requiredEquations) {
    messages.push(`Truss is unstable: m + r (${unknowns}) < 2j (${requiredEquations}).`);
    return {
      isSolved: false,
      determinacy: 'unstable',
      stability: 'unstable',
      reactions,
      rxValues: [],
      allReactionsList,
      messages
    };
  } else if (unknowns > requiredEquations) {
    messages.push(`Truss is statically indeterminate: m + r (${unknowns}) > 2j (${requiredEquations}).`);
    return {
      isSolved: false,
      determinacy: 'statically_indeterminate',
      stability: 'stable',
      reactions,
      rxValues: [],
      allReactionsList,
      messages
    };
  }

  if (r !== 3) {
    messages.push(`Unsupported support arrangement: total reaction components r = ${r} (must be exactly 3).`);
    return {
      isSolved: false,
      determinacy: 'unstable',
      stability: 'unstable',
      reactions,
      rxValues: [],
      allReactionsList,
      messages
    };
  }

  // Calculate sum of loads
  let sumLoadFx = 0;
  let sumLoadFy = 0;
  let sumLoadMoment = 0;

  // Let's choose the position of the first support or first joint as pivot
  const pivot: Point = supports.length > 0 ? supports[0].position : joints[0].position;

  for (const load of loads) {
    const joint = jointsMap.get(load.jointId);
    if (!joint) continue;
    const rad = (load.angle * Math.PI) / 180;
    const fx = load.magnitude * Math.cos(rad);
    const fy = load.magnitude * Math.sin(rad);
    sumLoadFx += fx;
    sumLoadFy += fy;
    sumLoadMoment += calculateMoment({ x: fx, y: fy }, joint.position, pivot);
  }

  // Setup 3x3 matrix for reactions
  const A = [
    [allReactionsList[0].direction.x, allReactionsList[1].direction.x, allReactionsList[2].direction.x],
    [allReactionsList[0].direction.y, allReactionsList[1].direction.y, allReactionsList[2].direction.y],
    [
      calculateMoment(allReactionsList[0].direction, allReactionsList[0].position, pivot),
      calculateMoment(allReactionsList[1].direction, allReactionsList[1].position, pivot),
      calculateMoment(allReactionsList[2].direction, allReactionsList[2].position, pivot)
    ]
  ];

  const B = [-sumLoadFx, -sumLoadFy, -sumLoadMoment];

  // Cramer's rule solver for 3x3
  const detA = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1])
             - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0])
             + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

  if (Math.abs(detA) < 1e-5) {
    messages.push('Truss is geometrically unstable (reactions are parallel or concurrent).');
    return {
      isSolved: false,
      determinacy: 'unstable',
      stability: 'unstable',
      reactions,
      rxValues: [],
      allReactionsList,
      messages
    };
  }

  const solve3x3 = (colIndex: number): number => {
    const temp = A.map(row => [...row]);
    for (let i = 0; i < 3; i++) {
      temp[i][colIndex] = B[i];
    }
    const detTemp = temp[0][0] * (temp[1][1] * temp[2][2] - temp[1][2] * temp[2][1])
                  - temp[0][1] * (temp[1][0] * temp[2][2] - temp[1][2] * temp[2][0])
                  + temp[0][2] * (temp[1][0] * temp[2][1] - temp[1][1] * temp[2][0]);
    return detTemp / detA;
  };

  const rxValues = [solve3x3(0), solve3x3(1), solve3x3(2)];
  for (let i = 0; i < 3; i++) {
    reactions[allReactionsList[i].symbol] = Math.round(rxValues[i] * 100) / 100;
  }

  return {
    isSolved: true,
    determinacy,
    stability,
    reactions,
    rxValues,
    allReactionsList,
    messages
  };
}
