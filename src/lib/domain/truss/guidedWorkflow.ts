import type { TrussModel, TrussJoint } from './types';
import type { ZeroForceSelectionFeedback, JointSelectionFeedback, JointEquationPrompt } from './guidedTypes';
import { getReactionsForSupport } from '../supports/support';
import { getDistance } from '../geometry/vector2d';
import { getUnitVector } from './geometry';

export { countTrussUnknowns, classifyTrussByCount } from './determinacy';

/**
 * Gets the member IDs connected to a joint that are not yet solved.
 */
export function getUnknownMembersAtJoint(
  truss: TrussModel,
  jointId: string,
  solvedMemberIds: string[]
): string[] {
  const solvedSet = new Set(solvedMemberIds);
  return truss.members
    .filter(m => (m.jointA === jointId || m.jointB === jointId) && !solvedSet.has(m.id))
    .map(m => m.id);
}

/**
 * Gets joint IDs that are not fully solved and have 1 or 2 unsolved connected members.
 */
export function getRecommendedNextJoints(truss: TrussModel, solvedMemberIds: string[]): string[] {
  const solvedSet = new Set(solvedMemberIds);
  const recommended: string[] = [];

  // If all members are solved, there are no joints left to solve
  if (solvedSet.size === truss.members.length) {
    return [];
  }

  for (const joint of truss.joints) {
    const conn = truss.members.filter(m => m.jointA === joint.id || m.jointB === joint.id);
    const unsolved = conn.filter(m => !solvedSet.has(m.id));
    if (unsolved.length > 0 && unsolved.length <= 2) {
      recommended.push(joint.id);
    }
  }

  return recommended;
}

/**
 * Compares selected zero-force members with reference zero-force members.
 */
export function checkZeroForceSelection(
  selectedIds: string[],
  referenceZeroForceIds: string[],
  allMemberIds?: string[]
): ZeroForceSelectionFeedback {
  const selectedSet = new Set(selectedIds);
  const refSet = new Set(referenceZeroForceIds);

  const correctIds: string[] = [];
  const missedIds: string[] = [];
  const falsePositiveIds: string[] = [];

  // Identify correct, missed, and false positive selections
  for (const id of referenceZeroForceIds) {
    if (selectedSet.has(id)) {
      correctIds.push(id);
    } else {
      missedIds.push(id);
    }
  }

  for (const id of selectedIds) {
    if (!refSet.has(id)) {
      falsePositiveIds.push(id);
    }
  }

  // Calculate score: fraction of members correctly classified (as either ZFM or non-ZFM)
  const membersList = allMemberIds || Array.from(new Set([...selectedIds, ...referenceZeroForceIds]));
  let correctCount = 0;
  for (const id of membersList) {
    const isRefZero = refSet.has(id);
    const isSelZero = selectedSet.has(id);
    if (isRefZero === isSelZero) {
      correctCount++;
    }
  }

  const score = membersList.length > 0 ? correctCount / membersList.length : 1.0;

  // Generate educational feedback message
  let message = '';
  if (missedIds.length === 0 && falsePositiveIds.length === 0) {
    message = 'All zero-force members correctly identified!';
  } else {
    const parts: string[] = [];
    if (missedIds.length > 0) {
      parts.push(`You missed zero-force member(s): ${missedIds.join(', ')}`);
    }
    if (falsePositiveIds.length > 0) {
      parts.push(`You incorrectly marked as zero-force member(s): ${falsePositiveIds.join(', ')}`);
    }
    message = parts.join('. ') + '.';
  }

  return {
    score,
    correctIds,
    missedIds,
    falsePositiveIds,
    message
  };
}

/**
 * Checks if a joint has 1 or 2 unknowns and can be solved.
 */
export function checkJointCanBeSolved(
  truss: TrussModel,
  jointId: string,
  solvedMemberIds: string[]
): JointSelectionFeedback {
  const unknowns = getUnknownMembersAtJoint(truss, jointId, solvedMemberIds);
  const joint = truss.joints.find(j => j.id === jointId);
  const label = joint ? joint.label : jointId;

  if (unknowns.length === 0) {
    return {
      isValid: false,
      unknownsCount: 0,
      message: `All members connected to joint ${label} are already solved.`
    };
  } else if (unknowns.length <= 2) {
    return {
      isValid: true,
      unknownsCount: unknowns.length,
      message: `Joint ${label} has ${unknowns.length} unknown force(s) and can be solved.`
    };
  } else {
    return {
      isValid: false,
      unknownsCount: unknowns.length,
      message: `Joint ${label} has ${unknowns.length} unknown forces. The Method of Joints can solve at most 2 unknowns per joint using ΣFx = 0 and ΣFy = 0. Choose a different joint with 1 or 2 unknowns.`
    };
  }
}

/**
 * Builds the structure of ΣFx and ΣFy equilibrium equations at the joint.
 */
export function buildJointEquationPrompt(
  truss: TrussModel,
  jointId: string,
  solvedMemberIds: string[],
  knownReactions: Record<string, number>,
  knownMemberForces: Record<string, number>
): JointEquationPrompt {
  const joint = truss.joints.find(j => j.id === jointId)!;
  const conn = truss.members.filter(m => m.jointA === jointId || m.jointB === jointId);

  const solvedSet = new Set(solvedMemberIds);
  const unknownMembers = conn.filter(m => !solvedSet.has(m.id));

  let F_known_x = 0;
  let F_known_y = 0;

  const knownTermsX: string[] = [];
  const knownTermsY: string[] = [];

  // 1. External loads
  const jointLoads = truss.loads.filter(l => l.jointId === jointId);
  for (const load of jointLoads) {
    const rad = (load.angle * Math.PI) / 180;
    const fx = load.magnitude * Math.cos(rad);
    const fy = load.magnitude * Math.sin(rad);
    F_known_x += fx;
    F_known_y += fy;

    if (Math.abs(fx) > 1e-3) knownTermsX.push(`${fx >= 0 ? '+' : ''}${fx.toFixed(0)} (${load.label})`);
    if (Math.abs(fy) > 1e-3) knownTermsY.push(`${fy >= 0 ? '+' : ''}${fy.toFixed(0)} (${load.label})`);
  }

  // 2. Support reactions
  const jointSupports = truss.supports.filter(s => getDistance(s.position, joint.position) < 1e-3);
  for (const s of jointSupports) {
    const rawReactions = getReactionsForSupport(s);
    const filtered = rawReactions.filter(r => r.type !== 'moment');
    for (const rx of filtered) {
      const val = knownReactions[rx.symbol] ?? 0;
      const fx = val * rx.direction.x;
      const fy = val * rx.direction.y;
      F_known_x += fx;
      F_known_y += fy;

      if (Math.abs(fx) > 1e-3) knownTermsX.push(`${fx >= 0 ? '+' : ''}${fx.toFixed(0)} (${rx.symbol})`);
      if (Math.abs(fy) > 1e-3) knownTermsY.push(`${fy >= 0 ? '+' : ''}${fy.toFixed(0)} (${rx.symbol})`);
    }
  }

  // 3. Solved member forces acting on this joint (pointing away)
  const solvedConn = conn.filter(m => solvedSet.has(m.id));
  for (const m of solvedConn) {
    const otherId = m.jointA === jointId ? m.jointB : m.jointA;
    const otherJoint = truss.joints.find(j => j.id === otherId)!;
    const uv = getUnitVector(joint.position, otherJoint.position);
    const forceVal = knownMemberForces[m.id] ?? 0;
    const fx = forceVal * uv.x;
    const fy = forceVal * uv.y;
    F_known_x += fx;
    F_known_y += fy;

    if (Math.abs(uv.x) > 1e-3) {
      knownTermsX.push(`${fx >= 0 ? '+' : ''}${fx.toFixed(0)} (${m.label})`);
    }
    if (Math.abs(uv.y) > 1e-3) {
      knownTermsY.push(`${fy >= 0 ? '+' : ''}${fy.toFixed(0)} (${m.label})`);
    }
  }

  // 4. Unknown member terms (pointing away)
  const unknownTermsX: string[] = [];
  const unknownTermsY: string[] = [];
  for (const m of unknownMembers) {
    const otherId = m.jointA === jointId ? m.jointB : m.jointA;
    const otherJoint = truss.joints.find(j => j.id === otherId)!;
    const uv = getUnitVector(joint.position, otherJoint.position);

    if (Math.abs(uv.x) > 1e-3) {
      unknownTermsX.push(`${m.label} * (${uv.x.toFixed(2)})`);
    }
    if (Math.abs(uv.y) > 1e-3) {
      unknownTermsY.push(`${m.label} * (${uv.y.toFixed(2)})`);
    }
  }

  // Equation strings
  const eqX = [...unknownTermsX, ...knownTermsX].join(' ') + ` = 0`;
  const eqY = [...unknownTermsY, ...knownTermsY].join(' ') + ` = 0`;

  return {
    jointId,
    jointLabel: joint.label,
    unknownMemberIds: unknownMembers.map(m => m.id),
    unknownMemberLabels: unknownMembers.map(m => m.label),
    eqX: eqX.trim().replace(/^=/, '0 ='),
    eqY: eqY.trim().replace(/^=/, '0 =')
  };
}
