import type { TrussModel } from './types';
import { getUnitVector } from './geometry';

export type JointSolvabilityKind =
  | 'invalid_joint'
  | 'no_unknowns'
  | 'one_unknown'
  | 'two_independent_unknowns'
  | 'two_collinear_unknowns'
  | 'too_many_unknowns';

export interface JointSolvability {
  kind: JointSolvabilityKind;
  jointId: string;
  jointLabel: string;
  unknownMemberIds: string[];
  determinant?: number;
  isSolvable: boolean;
}

export const JOINT_SOLVABILITY_EPSILON = 1e-6;

export function getUnsolvedMembersAtJoint(
  truss: TrussModel,
  jointId: string,
  solvedMemberIds: Iterable<string>
): string[] {
  const solvedSet = new Set(solvedMemberIds);
  return truss.members
    .filter(member => (member.jointA === jointId || member.jointB === jointId) && !solvedSet.has(member.id))
    .map(member => member.id);
}

function memberUnitVectorFromJoint(truss: TrussModel, jointId: string, memberId: string): { x: number; y: number } | null {
  const member = truss.members.find(candidate => candidate.id === memberId);
  const joint = truss.joints.find(candidate => candidate.id === jointId);
  if (!member || !joint || (member.jointA !== jointId && member.jointB !== jointId)) return null;

  const oppositeJointId = member.jointA === jointId ? member.jointB : member.jointA;
  const oppositeJoint = truss.joints.find(candidate => candidate.id === oppositeJointId);
  if (!oppositeJoint) return null;

  return getUnitVector(joint.position, oppositeJoint.position);
}

export function areTwoUnknownMembersIndependent(
  truss: TrussModel,
  jointId: string,
  memberIds: string[],
  epsilon = JOINT_SOLVABILITY_EPSILON
): boolean {
  if (memberIds.length !== 2) return false;
  const uv1 = memberUnitVectorFromJoint(truss, jointId, memberIds[0]);
  const uv2 = memberUnitVectorFromJoint(truss, jointId, memberIds[1]);
  if (!uv1 || !uv2) return false;

  const determinant = uv1.x * uv2.y - uv2.x * uv1.y;
  return Math.abs(determinant) >= epsilon;
}

export function getJointSolvability(
  truss: TrussModel,
  jointId: string,
  solvedMemberIds: Iterable<string>,
  epsilon = JOINT_SOLVABILITY_EPSILON
): JointSolvability {
  const joint = truss.joints.find(candidate => candidate.id === jointId);
  if (!joint) {
    return {
      kind: 'invalid_joint',
      jointId,
      jointLabel: jointId,
      unknownMemberIds: [],
      isSolvable: false
    };
  }

  const unknownMemberIds = getUnsolvedMembersAtJoint(truss, jointId, solvedMemberIds);
  if (unknownMemberIds.length === 0) {
    return {
      kind: 'no_unknowns',
      jointId,
      jointLabel: joint.label,
      unknownMemberIds,
      isSolvable: false
    };
  }
  if (unknownMemberIds.length === 1) {
    return {
      kind: 'one_unknown',
      jointId,
      jointLabel: joint.label,
      unknownMemberIds,
      isSolvable: true
    };
  }
  if (unknownMemberIds.length === 2) {
    const uv1 = memberUnitVectorFromJoint(truss, jointId, unknownMemberIds[0]);
    const uv2 = memberUnitVectorFromJoint(truss, jointId, unknownMemberIds[1]);
    const determinant = uv1 && uv2 ? uv1.x * uv2.y - uv2.x * uv1.y : 0;
    const isSolvable = Math.abs(determinant) >= epsilon;
    return {
      kind: isSolvable ? 'two_independent_unknowns' : 'two_collinear_unknowns',
      jointId,
      jointLabel: joint.label,
      unknownMemberIds,
      determinant,
      isSolvable
    };
  }

  return {
    kind: 'too_many_unknowns',
    jointId,
    jointLabel: joint.label,
    unknownMemberIds,
    isSolvable: false
  };
}
