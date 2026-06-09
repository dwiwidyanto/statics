import { describe, expect, it } from 'vitest';
import { solveGlobalJointEquilibrium, solveLinearSystem } from '../src/lib/domain/truss/globalEquilibriumSolver';
import { solveTruss } from '../src/lib/domain/truss/solver';
import type { TrussModel } from '../src/lib/domain/truss/types';

function greedyCollinearStuckTruss(): TrussModel {
  return {
    id: 'reordered-king-post',
    title: 'Reordered King Post',
    description: 'A valid determinate truss where greedy sees a collinear joint first.',
    joints: [
      { id: 'j-c', label: 'C', position: { x: 2, y: 0 } },
      { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
      { id: 'j-b', label: 'B', position: { x: 4, y: 0 } },
      { id: 'j-d', label: 'D', position: { x: 2, y: 2 } },
    ],
    members: [
      { id: 'm-ac', label: 'AC', jointA: 'j-a', jointB: 'j-c' },
      { id: 'm-cb', label: 'CB', jointA: 'j-c', jointB: 'j-b' },
      { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
      { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
      { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' },
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 4, y: 0 }, angle: 0, label: 'B' },
    ],
    loads: [
      { id: 'load-p1', jointId: 'j-d', magnitude: 800, angle: 270, label: 'P1' },
    ],
    topic: 'trusses',
    difficulty: 'easy',
    version: 1,
    learningObjectives: [],
  };
}

function fallbackOnlyDegreeThreeTruss(): TrussModel {
  return {
    id: 'degree-three-fallback',
    title: 'Degree Three Fallback',
    description: 'A determinate truss with no initial joint-by-joint path because every joint has three unknown members.',
    joints: [
      { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
      { id: 'j-b', label: 'B', position: { x: 0.8, y: 2.3 } },
      { id: 'j-c', label: 'C', position: { x: 0.1, y: 4.7 } },
      { id: 'j-d', label: 'D', position: { x: 4.2, y: 0.4 } },
      { id: 'j-e', label: 'E', position: { x: 3.5, y: 2.7 } },
      { id: 'j-f', label: 'F', position: { x: 4.8, y: 5.1 } },
    ],
    members: [
      { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
      { id: 'm-ae', label: 'AE', jointA: 'j-a', jointB: 'j-e' },
      { id: 'm-af', label: 'AF', jointA: 'j-a', jointB: 'j-f' },
      { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
      { id: 'm-be', label: 'BE', jointA: 'j-b', jointB: 'j-e' },
      { id: 'm-bf', label: 'BF', jointA: 'j-b', jointB: 'j-f' },
      { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' },
      { id: 'm-ce', label: 'CE', jointA: 'j-c', jointB: 'j-e' },
      { id: 'm-cf', label: 'CF', jointA: 'j-c', jointB: 'j-f' },
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
      { id: 'supp-d', type: 'roller', position: { x: 4.2, y: 0.4 }, angle: 0, label: 'D' },
    ],
    loads: [
      { id: 'load-p1', jointId: 'j-c', magnitude: 600, angle: 270, label: 'P1' },
    ],
    topic: 'trusses',
    difficulty: 'medium',
    version: 1,
    learningObjectives: [],
  };
}

describe('global truss equilibrium solver', () => {
  it('solves a small known linear system', () => {
    const result = solveLinearSystem(
      [
        [2, 1],
        [1, -1],
      ],
      [5, 1]
    );
    expect(result.status).toBe('solved');
    expect(result.values[0]).toBeCloseTo(2);
    expect(result.values[1]).toBeCloseTo(1);
  });

  it('reports singular systems clearly', () => {
    const result = solveLinearSystem(
      [
        [1, 2],
        [2, 4],
      ],
      [3, 6]
    );
    expect(result.status).toBe('singular');
    expect(result.message).toContain('singular');
  });

  it('skips an early collinear 2-unknown joint and still solves by method of joints', () => {
    const result = solveTruss(greedyCollinearStuckTruss());
    expect(result.isSolved).toBe(true);
    expect(result.determinacy).toBe('statically_determinate');
    expect(result.solverMethod).toBe('method_of_joints');
    expect(Object.keys(result.memberForces)).toHaveLength(5);
    expect(result.memberForces['m-cd']).toBeCloseTo(0, 1);
    expect(result.messages.join(' ')).toContain('Joint C has two unknown members');
    expect(result.messages.join(' ')).not.toContain('Solved using simultaneous joint equilibrium');
    expect(result.equationSystem).toBeUndefined();
  });

  it('falls back only when no method-of-joints path is available after scanning all joints', () => {
    const result = solveTruss(fallbackOnlyDegreeThreeTruss());
    expect(result.isSolved).toBe(true);
    expect(result.determinacy).toBe('statically_determinate');
    expect(result.solverMethod).toBe('simultaneous_joint_equilibrium_fallback');
    expect(Object.keys(result.memberForces)).toHaveLength(9);
    expect(result.messages.join(' ')).toContain('No non-collinear 1- or 2-unknown joint remains');
    expect(result.messages.join(' ')).toContain('Solved using simultaneous joint equilibrium');
    expect(result.messages.join(' ')).toContain('Positive member force denotes tension');

    expect(result.equationSystem?.unknownCount).toBe(12);
    expect(result.equationSystem?.equationCount).toBe(12);
    expect(result.equationSystem?.equations).toHaveLength(12);
    expect(result.equationSystem?.unknowns.filter(unknown => unknown.kind === 'member')).toHaveLength(9);
    expect(result.equationSystem?.unknowns.filter(unknown => unknown.kind === 'reaction')).toHaveLength(3);
    expect(result.equationSystem?.unknowns.find(unknown => unknown.kind === 'member')).toMatchObject({
      convention: 'positive_tension',
    });
    expect(result.equationSystem?.residuals.maxAbs).toBeLessThanOrEqual(0.01);
  });

  it('reports singular truss systems from the pure global solver', () => {
    const truss = greedyCollinearStuckTruss();
    const collapsed: TrussModel = {
      ...truss,
      joints: truss.joints.map(joint => joint.id === 'j-d' ? { ...joint, position: { x: 2, y: 0 } } : joint),
    };
    const jointsMap = new Map(collapsed.joints.map(joint => [joint.id, joint]));
    const result = solveGlobalJointEquilibrium(collapsed, jointsMap);
    expect(result.status).not.toBe('solved');
    expect(result.messages.join(' ')).toMatch(/singular|unstable|dependent/i);
  });
});
