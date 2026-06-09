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

  it('falls back to simultaneous joint equilibrium when greedy joints cannot start', () => {
    const result = solveTruss(greedyCollinearStuckTruss());
    expect(result.isSolved).toBe(true);
    expect(result.determinacy).toBe('statically_determinate');
    expect(result.solverMethod).toBe('simultaneous_joint_equilibrium_fallback');
    expect(Object.keys(result.memberForces)).toHaveLength(5);
    expect(result.messages.join(' ')).toContain('Solved using simultaneous joint equilibrium');
    expect(result.messages.join(' ')).toContain('Positive member force denotes tension');
    expect(result.memberForces['m-cd']).toBeCloseTo(0, 1);

    expect(result.equationSystem?.unknownCount).toBe(8);
    expect(result.equationSystem?.equationCount).toBe(8);
    expect(result.equationSystem?.equations).toHaveLength(8);
    expect(result.equationSystem?.unknowns.filter(unknown => unknown.kind === 'member')).toHaveLength(5);
    expect(result.equationSystem?.unknowns.filter(unknown => unknown.kind === 'reaction')).toHaveLength(3);
    expect(result.equationSystem?.unknowns.find(unknown => unknown.kind === 'member')).toMatchObject({
      convention: 'positive_tension',
    });
    expect(result.equationSystem?.equations.find(row => row.jointId === 'j-d' && row.axis === 'y')?.rhs).toBeCloseTo(800);
    expect(result.equationSystem?.solvedVector['member:m-cd']).toBeCloseTo(0, 1);
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
