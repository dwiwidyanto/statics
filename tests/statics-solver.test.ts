import { describe, it, expect } from 'vitest';
import { polarToCartesian, calculateMoment } from '../src/lib/domain/geometry/vector2d';
import { getReactionsForSupport } from '../src/lib/domain/supports/support';
import { getDistributedLoadResultant } from '../src/lib/domain/loads/load';
import { solveEquilibrium } from '../src/lib/domain/solvers/equilibrium';
import { checkFbdModel } from '../src/lib/domain/validation/checker';
import type { RigidBody, Support, Load } from '../src/lib/domain/models/types';

// Let's correct the import for load
import { getLoadForceComponents } from '../src/lib/domain/loads/load';

describe('Vector Geometry Utilities', () => {
  it('converts polar coordinates to Cartesian coordinates', () => {
    // 0 deg -> right (1, 0)
    const v0 = polarToCartesian(10, 0);
    expect(v0.x).toBeCloseTo(10);
    expect(v0.y).toBeCloseTo(0);

    // 90 deg -> up (0, 1)
    const v90 = polarToCartesian(5, 90);
    expect(v90.x).toBeCloseTo(0);
    expect(v90.y).toBeCloseTo(5);

    // 270 deg -> down (0, -1)
    const v270 = polarToCartesian(100, 270);
    expect(v270.x).toBeCloseTo(0);
    expect(v270.y).toBeCloseTo(-100);
  });

  it('calculates moment of a force about a pivot point', () => {
    // Pivot at (0,0), force applied at (2,0), force = 10N up (direction 90 deg -> 0, 10)
    const force = { x: 0, y: 10 };
    const appPoint = { x: 2, y: 0 };
    const pivot = { x: 0, y: 0 };
    const m = calculateMoment(force, appPoint, pivot);
    // M = r_x * F_y - r_y * F_x = 2 * 10 - 0 * 0 = 20 N-m (CCW, positive)
    expect(m).toBeCloseTo(20);

    // Pivot at (1,0), force applied at (1,3), force = 5N right (5, 0)
    // r = (0, 3). M = 0 * 0 - 3 * 5 = -15 N-m (CW, negative)
    const force2 = { x: 5, y: 0 };
    const appPoint2 = { x: 1, y: 3 };
    const pivot2 = { x: 1, y: 0 };
    const m2 = calculateMoment(force2, appPoint2, pivot2);
    expect(m2).toBeCloseTo(-15);
  });
});

describe('Distributed Load Equivalent Resultant', () => {
  it('replaces a uniform distributed load with equivalent concentrated force', () => {
    const load = {
      magnitudeStart: 200,
      magnitudeEnd: 200,
      startPosition: { x: 1.0, y: 0.0 },
      endPosition: { x: 4.0, y: 0.0 },
      angle: 270,
    };
    const resultant = getDistributedLoadResultant(load);
    // Length = 3m. Total force = 200 * 3 = 600N.
    expect(resultant.magnitude).toBeCloseTo(600);
    // Centroid = (1 + 4)/2 = 2.5m.
    expect(resultant.position.x).toBeCloseTo(2.5);
    expect(resultant.position.y).toBeCloseTo(0);
  });

  it('replaces a triangular distributed load with equivalent force at 2/3 length', () => {
    const load = {
      magnitudeStart: 0,
      magnitudeEnd: 300,
      startPosition: { x: 0.0, y: 0.0 },
      endPosition: { x: 3.0, y: 0.0 },
      angle: 270,
    };
    const resultant = getDistributedLoadResultant(load);
    // Length = 3m. Total force = 0.5 * 300 * 3 = 450N.
    expect(resultant.magnitude).toBeCloseTo(450);
    // Centroid for triangle starting at 0 and peaking at 3m:
    // x_c = x1 + L * ((w1 + 2w2) / (3 * (w1 + w2))) = 0 + 3 * (600 / (3 * 300)) = 2.0m.
    expect(resultant.position.x).toBeCloseTo(2.0);
  });
});

describe('Static Equilibrium Solver & Checker', () => {
  const body: RigidBody = {
    id: 'test-beam',
    type: 'beam',
    width: 6.0,
    height: 0.2,
    weight: 0,
  };

  it('solves a simply supported beam with midpoint point load', () => {
    // Pin at x=0 (A), Roller at x=6 (B)
    const supports: Support[] = [
      { id: 'sa', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
      { id: 'sb', type: 'roller', position: { x: 6, y: 0 }, angle: 0, label: 'B' },
    ];

    // Midpoint force of 600N downwards at x=3
    const loads: Load[] = [
      {
        id: 'l1',
        type: 'point_force',
        label: 'P1',
        magnitude: 600,
        angle: 270,
        position: { x: 3, y: 0.2 },
      },
    ];

    const validation = checkFbdModel(body, supports, loads);
    expect(validation.determinacy).toBe('statically_determinate');
    expect(validation.stability).toBe('stable');

    const result = solveEquilibrium(body, supports, loads);
    expect(result.isSolved).toBe(true);
    // Ry reactions should be 300N each
    expect(result.reactions['R_Ay']).toBeCloseTo(300);
    expect(result.reactions['R_By']).toBeCloseTo(300);
    // Rx reaction should be 0
    expect(result.reactions['R_Ax']).toBeCloseTo(0);
  });

  it('solves a cantilever beam with endpoint point load', () => {
    // Fixed support at x=0 (A)
    const supports: Support[] = [
      { id: 'sa', type: 'fixed', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
    ];

    // Force of 200N downwards at x=4
    const loads: Load[] = [
      {
        id: 'l1',
        type: 'point_force',
        label: 'P1',
        magnitude: 200,
        angle: 270,
        position: { x: 4, y: 0.2 },
      },
    ];

    const result = solveEquilibrium(body, supports, loads);
    expect(result.isSolved).toBe(true);
    // R_Ay = 200, R_Ax = 0, M_A = 200 * 4 = 800 N-m CCW
    expect(result.reactions['R_Ay']).toBeCloseTo(200);
    expect(result.reactions['R_Ax']).toBeCloseTo(0);
    expect(result.reactions['M_A']).toBeCloseTo(800);
  });

  it('classifies under-constrained beam as unstable', () => {
    // Only 1 pin support (2 reactions)
    const supports: Support[] = [
      { id: 'sa', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
    ];
    const loads: Load[] = [];

    const validation = checkFbdModel(body, supports, loads);
    expect(validation.determinacy).toBe('unstable');
    expect(validation.stability).toBe('unstable');
  });

  it('classifies parallel roller constraints as geometrically unstable', () => {
    // Three vertical rollers (all vertical reactions, total reactions = 3)
    const supports: Support[] = [
      { id: 'sa', type: 'roller', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
      { id: 'sb', type: 'roller', position: { x: 3, y: 0 }, angle: 0, label: 'B' },
      { id: 'sc', type: 'roller', position: { x: 6, y: 0 }, angle: 0, label: 'C' },
    ];
    const loads: Load[] = [];

    const validation = checkFbdModel(body, supports, loads);
    expect(validation.stability).toBe('unstable');
    expect(validation.determinacy).toBe('unstable');
  });
});
