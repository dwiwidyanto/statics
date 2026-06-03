import type { ProblemModel } from '../../lib/domain/models/types';

export const starterProblems: ProblemModel[] = [
  {
    id: 'prob-simply-supported-beam',
    title: 'Problem 1: Simply Supported Beam with Point Load',
    description: 'A 6-meter long horizontal beam is supported by a pin support at the left end (A) and a roller support at the right end (B). A vertical downward force of 600 N is applied at 4 meters from the left end.',
    body: {
      id: 'body-simply-supported',
      type: 'beam',
      width: 6.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      {
        id: 'supp-a',
        type: 'pin',
        position: { x: 0.0, y: 0.0 },
        angle: 0,
        label: 'A',
      },
      {
        id: 'supp-b',
        type: 'roller',
        position: { x: 6.0, y: 0.0 },
        angle: 0,
        label: 'B',
      },
    ],
    loads: [
      {
        id: 'load-p1',
        type: 'point_force',
        label: 'P1',
        magnitude: 600,
        angle: 270, // downwards
        position: { x: 4.0, y: 0.3 },
      },
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'Recall that a pin support provides 2 reactions (R_Ax, R_Ay) and a roller provides 1 vertical reaction (R_By).',
      'Sum the moments about support A (x=0) to solve for R_By directly.',
      'Use Sum Fy = 0 to solve for R_Ay and Sum Fx = 0 to solve for R_Ax.',
    ],
  },
  {
    id: 'prob-cantilever-beam',
    title: 'Problem 2: Cantilever Beam with Uniformly Distributed Load',
    description: 'A 4-meter long cantilever beam is fixed at the left end (A). It carries a uniformly distributed load of 200 N/m starting at 1 meter from the support and extending to the free end (4m).',
    body: {
      id: 'body-cantilever',
      type: 'beam',
      width: 4.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      {
        id: 'supp-fixed-a',
        type: 'fixed',
        position: { x: 0.0, y: 0.0 },
        angle: 0,
        label: 'A',
      },
    ],
    loads: [
      {
        id: 'load-dist1',
        type: 'distributed_load',
        label: 'w1',
        magnitudeStart: 200,
        magnitudeEnd: 200,
        startPosition: { x: 1.0, y: 0.3 },
        endPosition: { x: 4.0, y: 0.3 },
        angle: 270, // pointing down
      },
    ],
    expectedDeterminacy: 'statically_determinate',
    expectedStability: 'stable',
    hints: [
      'A fixed support provides 3 reactions: horizontal force (R_Ax), vertical force (R_Ay), and moment (M_A).',
      'Replace the distributed load with its equivalent point force: W = w * L = 200 N/m * 3 m = 600 N.',
      'The equivalent force acts at the centroid of the distributed load, which is at x = 1m + (3m / 2) = 2.5m.',
      'Calculate the reaction moment M_A by summing moments about point A.',
    ],
  },
  {
    id: 'prob-indeterminate-beam',
    title: 'Problem 3: Continuous Beam (Statically Indeterminate)',
    description: 'An 8-meter long beam is supported by a pin support at the left end (A), a roller in the middle (B) at 4 meters, and another roller at the right end (C) at 8 meters. A vertical load is applied.',
    body: {
      id: 'body-indeterminate',
      type: 'beam',
      width: 8.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      {
        id: 'supp-pin-a',
        type: 'pin',
        position: { x: 0.0, y: 0.0 },
        angle: 0,
        label: 'A',
      },
      {
        id: 'supp-roll-b',
        type: 'roller',
        position: { x: 4.0, y: 0.0 },
        angle: 0,
        label: 'B',
      },
      {
        id: 'supp-roll-c',
        type: 'roller',
        position: { x: 8.0, y: 0.0 },
        angle: 0,
        label: 'C',
      },
    ],
    loads: [
      {
        id: 'load-p-ind',
        type: 'point_force',
        label: 'P',
        magnitude: 400,
        angle: 270,
        position: { x: 6.0, y: 0.3 },
      },
    ],
    expectedDeterminacy: 'statically_indeterminate',
    expectedStability: 'stable',
    hints: [
      'Count the unknown reactions: Pin A has 2, Roller B has 1, Roller C has 1, giving 4 unknowns in total.',
      'Since we only have 3 equations of equilibrium in 2D, we have 4 - 3 = 1 redundant constraint.',
      'This system cannot be solved using statics alone. We need deformation equations to determine the reactions.',
    ],
  },
  {
    id: 'prob-unstable-parallel',
    title: 'Problem 4: Geometrically Unstable Roller Assembly',
    description: 'A 6-meter long beam is supported by three vertical roller supports at x=0 (A), x=3 (B), and x=6 (C). All three rollers roll on horizontal tracks, so they only produce vertical reaction forces.',
    body: {
      id: 'body-unstable',
      type: 'beam',
      width: 6.0,
      height: 0.3,
      weight: 0,
    },
    supports: [
      {
        id: 'supp-roll-a',
        type: 'roller',
        position: { x: 0.0, y: 0.0 },
        angle: 0,
        label: 'A',
      },
      {
        id: 'supp-roll-b',
        type: 'roller',
        position: { x: 3.0, y: 0.0 },
        angle: 0,
        label: 'B',
      },
      {
        id: 'supp-roll-c',
        type: 'roller',
        position: { x: 6.0, y: 0.0 },
        angle: 0,
        label: 'C',
      },
    ],
    loads: [
      {
        id: 'load-diag',
        type: 'point_force',
        label: 'F_wind',
        magnitude: 200,
        angle: 210, // inclined force pushing left and down
        position: { x: 3.0, y: 0.3 },
      },
    ],
    expectedDeterminacy: 'unstable',
    expectedStability: 'unstable',
    hints: [
      'Note that there are 3 reaction forces (R_Ay, R_By, R_Cy), which equals the 3 equilibrium equations.',
      'However, all reaction forces act vertically. There is NO reaction force that can balance a horizontal load.',
      'The diagonal force F_wind has a horizontal component pushing to the left. The beam will accelerate to the left.',
      'This is a classic case of geometric instability due to parallel reaction lines of action.',
    ],
  }
];
