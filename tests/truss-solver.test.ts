import { describe, it, expect } from 'vitest';
import { solveTruss } from '../src/lib/domain/truss/solver';
import type { TrussModel } from '../src/lib/domain/truss/types';

describe('Truss Solver Domain Logic', () => {
  it('identifies statically determinate stable truss', () => {
    const truss: TrussModel = {
      id: 'test-det',
      title: 'Determinate Truss',
      description: 'Triangle',
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
      loads: [
        { id: 'load-p1', jointId: 'j-c', magnitude: 600, angle: 270, label: 'P1' }
      ],
      topic: 'trusses',
      difficulty: 'easy',
      version: 1,
      learningObjectives: []
    };

    const res = solveTruss(truss);
    expect(res.determinacy).toBe('statically_determinate');
    expect(res.stability).toBe('stable');
    expect(res.isSolved).toBe(true);
    
    // Support Reactions: R_Ay = 300, R_By = 300, R_Ax = 0
    expect(res.reactions?.R_Ax).toBeCloseTo(0);
    expect(res.reactions?.R_Ay).toBeCloseTo(300);
    expect(res.reactions?.R_By).toBeCloseTo(300);

    // Member axial forces: CA and BC are in compression, AB is in tension
    // Force magnitude is 300 / sin(45) = 424.26
    expect(res.memberForces?.['m-ca']).toBeCloseTo(-424.26, 1);
    expect(res.memberForces?.['m-bc']).toBeCloseTo(-424.26, 1);
    expect(res.memberForces?.['m-ab']).toBeCloseTo(300, 1);
  });

  it('identifies statically indeterminate truss', () => {
    const truss: TrussModel = {
      id: 'test-indet',
      title: 'Indeterminate Truss',
      description: 'Extra member',
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
        // Two pin supports gives 4 reactions. m + r = 3 + 4 = 7 > 2j = 6
        { id: 'supp-b', type: 'pin', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
      ],
      loads: [],
      topic: 'trusses',
      difficulty: 'easy',
      version: 1,
      learningObjectives: []
    };

    const res = solveTruss(truss);
    expect(res.determinacy).toBe('statically_indeterminate');
    expect(res.isSolved).toBe(false);
  });

  it('identifies unstable truss (insufficient supports)', () => {
    const truss: TrussModel = {
      id: 'test-unstable',
      title: 'Unstable Truss',
      description: 'Only rollers',
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
        // Two rollers give r = 2 reactions. m + r = 3 + 2 = 5 < 2j = 6
        { id: 'supp-a', type: 'roller', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
        { id: 'supp-b', type: 'roller', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
      ],
      loads: [],
      topic: 'trusses',
      difficulty: 'easy',
      version: 1,
      learningObjectives: []
    };

    const res = solveTruss(truss);
    expect(res.determinacy).toBe('unstable');
    expect(res.stability).toBe('unstable');
    expect(res.isSolved).toBe(false);
  });

  it('detects zero-force member Rule 1: Two non-collinear members meeting at an unloaded, unsupported joint', () => {
    // Truss with an overhang joint E that is unloaded and unsupported
    const truss: TrussModel = {
      id: 'test-zfm1',
      title: 'Truss with ZFM Rule 1',
      description: 'Triangle with overhang',
      joints: [
        { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
        { id: 'j-b', label: 'B', position: { x: 3, y: 0 } },
        { id: 'j-c', label: 'C', position: { x: 6, y: 0 } },
        { id: 'j-d', label: 'D', position: { x: 3, y: 3 } },
        { id: 'j-e', label: 'E', position: { x: 6, y: 3 } } // Overhang joint: unsupported and unloaded
      ],
      members: [
        { id: 'm-ab', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
        { id: 'm-bc', label: 'BC', jointA: 'j-b', jointB: 'j-c' },
        { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
        { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' },
        { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
        { id: 'm-de', label: 'DE', jointA: 'j-d', jointB: 'j-e' }, // horizontal
        { id: 'm-ce', label: 'CE', jointA: 'j-c', jointB: 'j-e' }  // vertical
      ],
      supports: [
        { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
        { id: 'supp-c', type: 'roller', position: { x: 6, y: 0 }, angle: 0, label: 'C' }
      ],
      loads: [
        { id: 'load-p1', jointId: 'j-d', magnitude: 600, angle: 270, label: 'P1' }
      ],
      topic: 'trusses',
      difficulty: 'medium',
      version: 1,
      learningObjectives: []
    };

    const res = solveTruss(truss);
    expect(res.isSolved).toBe(true);
    expect(res.zeroForceMembers).toContain('m-de');
    expect(res.zeroForceMembers).toContain('m-ce');
    expect(res.memberForces?.['m-de']).toBe(0);
    expect(res.memberForces?.['m-ce']).toBe(0);
  });

  it('detects zero-force member Rule 2: Three members meeting at unloaded, unsupported joint where two are collinear', () => {
    // Triangular truss with a vertical post CD. Joint C is unloaded and unsupported.
    // Bottom chord members AC and CB are collinear. Vertical member CD should be a zero-force member.
    const truss: TrussModel = {
      id: 'test-zfm2',
      title: 'King Post',
      description: 'ZFM Rule 2',
      joints: [
        { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
        { id: 'j-b', label: 'B', position: { x: 4, y: 0 } },
        { id: 'j-c', label: 'C', position: { x: 2, y: 0 } }, // Unloaded, unsupported joint connecting AC, CB, CD
        { id: 'j-d', label: 'D', position: { x: 2, y: 2 } }
      ],
      members: [
        { id: 'm-ac', label: 'AC', jointA: 'j-a', jointB: 'j-c' },
        { id: 'm-cb', label: 'CB', jointA: 'j-c', jointB: 'j-b' },
        { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
        { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
        { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' } // vertical post
      ],
      supports: [
        { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
        { id: 'supp-b', type: 'roller', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
      ],
      loads: [
        { id: 'load-p1', jointId: 'j-d', magnitude: 800, angle: 270, label: 'P1' }
      ],
      topic: 'trusses',
      difficulty: 'easy',
      version: 1,
      learningObjectives: []
    };

    const res = solveTruss(truss);
    expect(res.isSolved).toBe(true);
    expect(res.zeroForceMembers).toContain('m-cd');
    expect(res.memberForces?.['m-cd']).toBe(0);
  });

  it('validates duplicate joint labels and duplicate member labels', () => {
    const dupJointTruss: TrussModel = {
      id: 'test-dup-joint',
      title: 'Dup Joint',
      description: 'desc',
      joints: [
        { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
        { id: 'j-b', label: 'A', position: { x: 4, y: 0 } } // Duplicate label 'A'
      ],
      members: [],
      supports: [],
      loads: [],
      topic: 'trusses',
      difficulty: 'easy',
      version: 1,
      learningObjectives: []
    };

    const res = solveTruss(dupJointTruss);
    expect(res.isSolved).toBe(false);
    expect(res.messages[0]).toContain('Duplicate joint label');

    const dupMemberTruss: TrussModel = {
      id: 'test-dup-member',
      title: 'Dup Member',
      description: 'desc',
      joints: [
        { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
        { id: 'j-b', label: 'B', position: { x: 4, y: 0 } },
        { id: 'j-c', label: 'C', position: { x: 2, y: 2 } }
      ],
      members: [
        { id: 'm1', label: 'AB', jointA: 'j-a', jointB: 'j-b' },
        { id: 'm2', label: 'AB', jointA: 'j-b', jointB: 'j-c' } // Duplicate label 'AB'
      ],
      supports: [],
      loads: [],
      topic: 'trusses',
      difficulty: 'easy',
      version: 1,
      learningObjectives: []
    };

    const res2 = solveTruss(dupMemberTruss);
    expect(res2.isSolved).toBe(false);
    expect(res2.messages[0]).toContain('Duplicate member label');
  });

  it('validates member referencing unknown joints', () => {
    const invalidRefTruss: TrussModel = {
      id: 'test-invalid-ref',
      title: 'Invalid Ref',
      description: 'desc',
      joints: [
        { id: 'j-a', label: 'A', position: { x: 0, y: 0 } }
      ],
      members: [
        { id: 'm1', label: 'AB', jointA: 'j-a', jointB: 'j-x' } // j-x unknown
      ],
      supports: [],
      loads: [],
      topic: 'trusses',
      difficulty: 'easy',
      version: 1,
      learningObjectives: []
    };

    const res = solveTruss(invalidRefTruss);
    expect(res.isSolved).toBe(false);
    expect(res.messages[0]).toContain('references unknown joint ID');
  });

  it('validates zero-length member', () => {
    const zeroLenTruss: TrussModel = {
      id: 'test-zero-len',
      title: 'Zero Length',
      description: 'desc',
      joints: [
        { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
        { id: 'j-b', label: 'B', position: { x: 0, y: 0 } } // same coordinate
      ],
      members: [
        { id: 'm1', label: 'AB', jointA: 'j-a', jointB: 'j-b' }
      ],
      supports: [],
      loads: [],
      topic: 'trusses',
      difficulty: 'easy',
      version: 1,
      learningObjectives: []
    };

    const res = solveTruss(zeroLenTruss);
    expect(res.isSolved).toBe(false);
    expect(res.messages[0]).toContain('has zero length');
  });
});
