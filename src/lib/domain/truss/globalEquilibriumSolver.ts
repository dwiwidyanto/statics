import type { Reaction } from '../models/types';
import { getDistance } from '../geometry/vector2d';
import { getReactionsForSupport } from '../supports/support';
import { getUnitVector } from './geometry';
import type { TrussEquationRow, TrussEquationSystem, TrussEquationUnknown, TrussJoint, TrussModel } from './types';

export type LinearSolveStatus = 'solved' | 'singular' | 'underdetermined' | 'overdetermined';

export interface LinearSolveResult {
  status: LinearSolveStatus;
  values: number[];
  message: string;
}

export interface GlobalTrussSolveResult {
  status: 'solved' | 'singular' | 'unstable' | 'underdetermined' | 'overdetermined';
  memberForces: Record<string, number>;
  reactions: Record<string, number>;
  messages: string[];
  equationSystem?: TrussEquationSystem;
}

const EPS = 1e-9;

export function solveLinearSystem(matrix: number[][], rhs: number[]): LinearSolveResult {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;

  if (rows < cols) {
    return { status: 'underdetermined', values: [], message: `Linear system is underdetermined (${rows} equations, ${cols} unknowns).` };
  }
  if (rows > cols) {
    return { status: 'overdetermined', values: [], message: `Linear system is overdetermined (${rows} equations, ${cols} unknowns).` };
  }

  const augmented = matrix.map((row, index) => [...row, rhs[index]]);

  for (let pivot = 0; pivot < cols; pivot++) {
    let maxRow = pivot;
    for (let row = pivot + 1; row < rows; row++) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[maxRow][pivot])) {
        maxRow = row;
      }
    }

    if (Math.abs(augmented[maxRow][pivot]) < EPS) {
      return { status: 'singular', values: [], message: 'Linear system is singular; the truss may be unstable or geometrically dependent.' };
    }

    [augmented[pivot], augmented[maxRow]] = [augmented[maxRow], augmented[pivot]];
    const pivotValue = augmented[pivot][pivot];
    for (let col = pivot; col <= cols; col++) {
      augmented[pivot][col] /= pivotValue;
    }

    for (let row = 0; row < rows; row++) {
      if (row === pivot) continue;
      const factor = augmented[row][pivot];
      for (let col = pivot; col <= cols; col++) {
        augmented[row][col] -= factor * augmented[pivot][col];
      }
    }
  }

  return {
    status: 'solved',
    values: augmented.map(row => row[cols]),
    message: 'Linear system solved.'
  };
}

function roundForce(value: number): number {
  return Math.round(value * 100) / 100;
}

function collectTrussReactions(truss: TrussModel): Reaction[] {
  const reactions: Reaction[] = [];
  for (const support of truss.supports) {
    reactions.push(...getReactionsForSupport(support).filter(reaction => reaction.type !== 'moment'));
  }
  return reactions;
}

function unknownKeyForReaction(reaction: Reaction): string {
  return `reaction:${reaction.symbol}`;
}

function formatEquation(axis: 'x' | 'y', jointLabel: string, coefficients: Record<string, number>, rhs: number): string {
  const terms = Object.entries(coefficients)
    .filter(([, value]) => Math.abs(value) > 1e-9)
    .map(([key, value]) => `${value >= 0 ? '+' : '-'} ${Math.abs(value).toFixed(3)}(${key})`);
  return `ΣF${axis} @ ${jointLabel}: ${terms.join(' ') || '0'} = ${rhs.toFixed(3)}`;
}

function computeResiduals(equations: TrussEquationRow[], solvedVector: Record<string, number>) {
  const byJoint = new Map<string, { jointId: string; jointLabel: string; fx: number; fy: number }>();
  for (const row of equations) {
    const lhs = Object.entries(row.coefficients).reduce((sum, [key, coefficient]) => sum + coefficient * (solvedVector[key] ?? 0), 0);
    const residual = lhs - row.rhs;
    const existing = byJoint.get(row.jointId) ?? { jointId: row.jointId, jointLabel: row.jointLabel, fx: 0, fy: 0 };
    if (row.axis === 'x') existing.fx = roundForce(residual);
    else existing.fy = roundForce(residual);
    byJoint.set(row.jointId, existing);
  }
  const perJoint = Array.from(byJoint.values());
  const maxAbs = perJoint.reduce((max, item) => Math.max(max, Math.abs(item.fx), Math.abs(item.fy)), 0);
  return { perJoint, maxAbs: roundForce(maxAbs) };
}

/**
 * Solves a statically determinate planar truss by assembling all joint equilibrium
 * equations at once. Positive member force follows the app convention: tension.
 */
export function solveGlobalJointEquilibrium(
  truss: TrussModel,
  jointsMap: Map<string, TrussJoint>
): GlobalTrussSolveResult {
  const messages = [
    'Using simultaneous joint equilibrium. Positive member force denotes tension; negative denotes compression.'
  ];
  const reactionsList = collectTrussReactions(truss);
  const unknownCount = truss.members.length + reactionsList.length;
  const equationCount = truss.joints.length * 2;
  const unknowns: TrussEquationUnknown[] = [
    ...truss.members.map(member => ({
      kind: 'member' as const,
      key: `member:${member.id}`,
      id: member.id,
      label: member.label,
      convention: 'positive_tension' as const
    })),
    ...reactionsList.map(reaction => ({
      kind: 'reaction' as const,
      key: unknownKeyForReaction(reaction),
      symbol: reaction.symbol,
      supportId: reaction.supportId,
      supportLabel: reaction.symbol.replace(/^R_|^M_/, '').replace(/[xy]$/, ''),
      direction: reaction.direction
    }))
  ];

  if (unknownCount < equationCount) {
    return {
      status: 'underdetermined',
      memberForces: {},
      reactions: {},
      messages: [...messages, `Truss is unstable/underdetermined: m + r (${unknownCount}) < 2j (${equationCount}).`]
    };
  }
  if (unknownCount > equationCount) {
    return {
      status: 'overdetermined',
      memberForces: {},
      reactions: {},
      messages: [...messages, `Truss is statically indeterminate for this solver: m + r (${unknownCount}) > 2j (${equationCount}).`]
    };
  }

  const matrix: number[][] = [];
  const rhs: number[] = [];
  const equations: TrussEquationRow[] = [];

  for (const joint of truss.joints) {
    const rowX = new Array(unknownCount).fill(0);
    const rowY = new Array(unknownCount).fill(0);
    const coefficientsX: Record<string, number> = {};
    const coefficientsY: Record<string, number> = {};

    truss.members.forEach((member, memberIndex) => {
      if (member.jointA !== joint.id && member.jointB !== joint.id) return;
      const otherId = member.jointA === joint.id ? member.jointB : member.jointA;
      const otherJoint = jointsMap.get(otherId);
      if (!otherJoint) return;
      const unit = getUnitVector(joint.position, otherJoint.position);
      rowX[memberIndex] = unit.x;
      rowY[memberIndex] = unit.y;
      coefficientsX[`member:${member.id}`] = unit.x;
      coefficientsY[`member:${member.id}`] = unit.y;
    });

    reactionsList.forEach((reaction, reactionIndex) => {
      if (getDistance(reaction.position, joint.position) > 1e-6) return;
      const column = truss.members.length + reactionIndex;
      rowX[column] = reaction.direction.x;
      rowY[column] = reaction.direction.y;
      coefficientsX[unknownKeyForReaction(reaction)] = reaction.direction.x;
      coefficientsY[unknownKeyForReaction(reaction)] = reaction.direction.y;
    });

    let loadFx = 0;
    let loadFy = 0;
    for (const load of truss.loads.filter(item => item.jointId === joint.id)) {
      const rad = (load.angle * Math.PI) / 180;
      loadFx += load.magnitude * Math.cos(rad);
      loadFy += load.magnitude * Math.sin(rad);
    }

    matrix.push(rowX, rowY);
    rhs.push(-loadFx, -loadFy);
    equations.push(
      {
        jointId: joint.id,
        jointLabel: joint.label,
        axis: 'x',
        coefficients: coefficientsX,
        rhs: -loadFx,
        equation: formatEquation('x', joint.label, coefficientsX, -loadFx)
      },
      {
        jointId: joint.id,
        jointLabel: joint.label,
        axis: 'y',
        coefficients: coefficientsY,
        rhs: -loadFy,
        equation: formatEquation('y', joint.label, coefficientsY, -loadFy)
      }
    );
  }

  const solved = solveLinearSystem(matrix, rhs);
  if (solved.status !== 'solved') {
    return {
      status: solved.status === 'singular' ? 'singular' : solved.status,
      memberForces: {},
      reactions: {},
      messages: [...messages, solved.message]
    };
  }

  const memberForces: Record<string, number> = {};
  const solvedVector: Record<string, number> = {};
  truss.members.forEach((member, index) => {
    const value = roundForce(solved.values[index]);
    memberForces[member.id] = value;
    solvedVector[`member:${member.id}`] = value;
  });

  const reactions: Record<string, number> = {};
  reactionsList.forEach((reaction, index) => {
    const value = roundForce(solved.values[truss.members.length + index]);
    reactions[reaction.symbol] = value;
    solvedVector[unknownKeyForReaction(reaction)] = value;
  });
  const residuals = computeResiduals(equations, solvedVector);

  return {
    status: 'solved',
    memberForces,
    reactions,
    equationSystem: {
      unknowns,
      equations,
      solvedVector,
      residuals,
      unknownCount,
      equationCount
    },
    messages: [
      ...messages,
      'Solved using simultaneous joint equilibrium because no joint-by-joint path was available.'
    ]
  };
}
