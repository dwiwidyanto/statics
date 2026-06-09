import { describe, expect, it } from 'vitest';
import {
  areTwoUnknownMembersIndependent,
  getJointSolvability,
  getUnsolvedMembersAtJoint
} from '../src/lib/domain/truss/jointSolvability';
import type { TrussModel } from '../src/lib/domain/truss/types';

const solvabilityTruss: TrussModel = {
  id: 'solvability-fixture',
  title: 'Solvability Fixture',
  description: 'Fixture for joint solvability',
  joints: [
    { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
    { id: 'j-b', label: 'B', position: { x: 2, y: 0 } },
    { id: 'j-c', label: 'C', position: { x: 4, y: 0 } },
    { id: 'j-d', label: 'D', position: { x: 2, y: 2 } },
  ],
  members: [
    { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
    { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
    { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
    { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
  ],
  supports: [],
  loads: [],
  topic: 'trusses',
  difficulty: 'easy',
  version: 1,
  learningObjectives: [],
};

describe('joint solvability helpers', () => {
  it('reports a 1 unknown joint as solvable', () => {
    const result = getJointSolvability(solvabilityTruss, 'j-a', ['m-ab']);
    expect(result.kind).toBe('one_unknown');
    expect(result.isSolvable).toBe(true);
    expect(result.unknownMemberIds).toEqual(['m-ad']);
  });

  it('reports 2 non-collinear unknown members as solvable', () => {
    const result = getJointSolvability(solvabilityTruss, 'j-a', []);
    expect(result.kind).toBe('two_independent_unknowns');
    expect(result.isSolvable).toBe(true);
    expect(areTwoUnknownMembersIndependent(solvabilityTruss, 'j-a', ['m-ab', 'm-ad'])).toBe(true);
  });

  it('reports 2 collinear unknown members as not directly solvable', () => {
    const result = getJointSolvability(solvabilityTruss, 'j-b', ['m-bd']);
    expect(result.kind).toBe('two_collinear_unknowns');
    expect(result.isSolvable).toBe(false);
    expect(result.determinant).toBeCloseTo(0);
    expect(areTwoUnknownMembersIndependent(solvabilityTruss, 'j-b', ['m-ab', 'm-bc'])).toBe(false);
  });

  it('reports 3 unknowns as too many for one method-of-joints step', () => {
    const result = getJointSolvability(solvabilityTruss, 'j-b', []);
    expect(result.kind).toBe('too_many_unknowns');
    expect(result.isSolvable).toBe(false);
    expect(result.unknownMemberIds).toHaveLength(3);
  });

  it('reports invalid joints safely', () => {
    const result = getJointSolvability(solvabilityTruss, 'missing-joint', []);
    expect(result.kind).toBe('invalid_joint');
    expect(result.isSolvable).toBe(false);
    expect(getUnsolvedMembersAtJoint(solvabilityTruss, 'missing-joint', [])).toEqual([]);
  });
});
