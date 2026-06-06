import type { TrussModel, TrussJoint } from './types';
import { getDistance } from '../geometry/vector2d';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  jointsMap: Map<string, TrussJoint>;
}

/**
 * Validates a Truss model's connectivity and labelling.
 */
export function validateTruss(truss: TrussModel): ValidationResult {
  const errors: string[] = [];
  const jointsMap = new Map<string, TrussJoint>();

  const joints = truss.joints || [];
  const members = truss.members || [];

  if (joints.length === 0) {
    errors.push('Truss has no joints.');
    return { isValid: false, errors, jointsMap };
  }

  // Check joint label duplicates
  const jointLabels = new Set<string>();
  for (const j of joints) {
    if (jointLabels.has(j.label)) {
      errors.push(`Duplicate joint label detected: "${j.label}".`);
    }
    jointLabels.add(j.label);
    jointsMap.set(j.id, j);
  }

  // Check member label duplicates
  const memberLabels = new Set<string>();
  for (const m of members) {
    if (memberLabels.has(m.label)) {
      errors.push(`Duplicate member label detected: "${m.label}".`);
    }
    memberLabels.add(m.label);
  }

  if (errors.length > 0) {
    return { isValid: false, errors, jointsMap };
  }

  // Check members referencing unknown joints and zero-length members
  for (const m of members) {
    const ja = jointsMap.get(m.jointA);
    const jb = jointsMap.get(m.jointB);

    if (!ja || !jb) {
      errors.push(`Member "${m.label}" references unknown joint ID(s).`);
      continue;
    }

    const L = getDistance(ja.position, jb.position);
    if (L < 1e-5) {
      errors.push(`Member "${m.label}" has zero length.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    jointsMap
  };
}
