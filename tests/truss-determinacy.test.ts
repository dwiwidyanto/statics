import { describe, it, expect } from 'vitest';
import { countTrussUnknowns, classifyTrussByCount } from '../src/lib/domain/truss/determinacy';
import type { TrussModel } from '../src/lib/domain/truss/types';

describe('Truss Determinacy & Stability', () => {
  // Test case 1: Simple determinate truss (triangular truss: m=3, j=3, r=3 -> m+r=6, 2j=6)
  const determinateTruss: TrussModel = {
    id: 'truss-determinate',
    title: 'Determinate',
    description: '',
    joints: [
      { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
      { id: 'j-b', label: 'B', position: { x: 4, y: 0 } },
      { id: 'j-c', label: 'C', position: { x: 2, y: 2 } }
    ],
    members: [
      { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
      { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
      { id: 'm-ca', label: 'CA', jointA: 'j-c', jointB: 'j-a' }
    ],
    supports: [
      { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
      { id: 'supp-b', type: 'roller', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
    ],
    loads: [],
    topic: 'trusses',
    difficulty: 'easy',
    version: 1,
    learningObjectives: []
  };

  // Test case 2: Underconstrained/unstable truss (m=2, j=3, r=3 -> m+r=5 < 2j=6)
  const unstableTruss: TrussModel = {
    ...determinateTruss,
    id: 'truss-unstable',
    members: [
      { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
      { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' }
    ]
  };

  // Test case 3: Overconstrained/indeterminate truss (m=4, j=3, r=3 -> m+r=7 > 2j=6)
  const indeterminateTruss: TrussModel = {
    ...determinateTruss,
    id: 'truss-indeterminate',
    members: [
      { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
      { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
      { id: 'm-ca', label: 'CA', jointA: 'j-c', jointB: 'j-a' },
      { id: 'm-extra', label: 'EXTRA', jointA: 'j-a', jointB: 'j-c' }
    ]
  };

  it('correctly counts truss members, joints, and support reactions', () => {
    // Pin support has 2 reactions, roller has 1 reaction. Total r = 3.
    const counts = countTrussUnknowns(determinateTruss);
    expect(counts.m).toBe(3);
    expect(counts.j).toBe(3);
    expect(counts.r).toBe(3);
  });

  it('classifies a simple determinate truss correctly', () => {
    expect(classifyTrussByCount(determinateTruss)).toBe('statically_determinate');
  });

  it('classifies an underconstrained unstable truss correctly', () => {
    expect(classifyTrussByCount(unstableTruss)).toBe('unstable');
  });

  it('classifies an overconstrained indeterminate truss correctly', () => {
    expect(classifyTrussByCount(indeterminateTruss)).toBe('statically_indeterminate');
  });

  it('calculates support reaction counts correctly for Pin and Roller configurations', () => {
    const doublePinTruss: TrussModel = {
      ...determinateTruss,
      supports: [
        { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
        { id: 'supp-b', type: 'pin', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
      ]
    };
    // Pin + Pin -> 2 + 2 = 4 reactions
    const counts = countTrussUnknowns(doublePinTruss);
    expect(counts.r).toBe(4);
    expect(classifyTrussByCount(doublePinTruss)).toBe('statically_indeterminate');
  });
});
