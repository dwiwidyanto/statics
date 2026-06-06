/**
 * Unit tests for guided truss workflow helper functions.
 */
import { describe, it, expect } from 'vitest';
import {
  countTrussUnknowns,
  classifyTrussByCount,
  getUnknownMembersAtJoint,
  getRecommendedNextJoints,
  checkZeroForceSelection,
  checkJointCanBeSolved,
  buildJointEquationPrompt
} from '../src/lib/domain/truss/guidedWorkflow';
import type { TrussModel } from '../src/lib/domain/truss/types';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Simple triangle: A(0,0), B(4,0), C(2,2). Pin at A, roller at B. */
const triangleTruss: TrussModel = {
  id: 'test-triangle',
  title: 'Triangle',
  description: 'test',
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

/** King-post: A(0,0), B(4,0), C(2,0), D(2,2). Pin A, roller B. */
const kingPostTruss: TrussModel = {
  id: 'test-king-post',
  title: 'King Post',
  description: 'test',
  joints: [
    { id: 'j-a', label: 'A', position: { x: 0, y: 0 } },
    { id: 'j-b', label: 'B', position: { x: 4, y: 0 } },
    { id: 'j-c', label: 'C', position: { x: 2, y: 0 } },
    { id: 'j-d', label: 'D', position: { x: 2, y: 2 } }
  ],
  members: [
    { id: 'm-ac', label: 'AC', jointA: 'j-a', jointB: 'j-c' },
    { id: 'm-cb', label: 'CB', jointA: 'j-c', jointB: 'j-b' },
    { id: 'm-ad', label: 'AD', jointA: 'j-a', jointB: 'j-d' },
    { id: 'm-bd', label: 'BD', jointA: 'j-b', jointB: 'j-d' },
    { id: 'm-cd', label: 'CD', jointA: 'j-c', jointB: 'j-d' }
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

/** Indeterminate truss (two pins, 3 members, 4 reactions). */
const indeterminateTruss: TrussModel = {
  ...triangleTruss,
  id: 'test-indet',
  supports: [
    { id: 'supp-a', type: 'pin', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
    { id: 'supp-b', type: 'pin', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
  ]
};

/** Unstable truss (two rollers, 3 members, 2 reactions). */
const unstableTruss: TrussModel = {
  ...triangleTruss,
  id: 'test-unstable',
  supports: [
    { id: 'supp-a', type: 'roller', position: { x: 0, y: 0 }, angle: 0, label: 'A' },
    { id: 'supp-b', type: 'roller', position: { x: 4, y: 0 }, angle: 0, label: 'B' }
  ]
};

// ---------------------------------------------------------------------------
// countTrussUnknowns
// ---------------------------------------------------------------------------

describe('countTrussUnknowns', () => {
  it('counts m, r, j for simple triangle (pin + roller)', () => {
    const result = countTrussUnknowns(triangleTruss);
    expect(result.m).toBe(3);
    expect(result.r).toBe(3); // pin = 2, roller = 1
    expect(result.j).toBe(3);
  });

  it('counts m, r, j for king-post (pin + roller, 5 members, 4 joints)', () => {
    const result = countTrussUnknowns(kingPostTruss);
    expect(result.m).toBe(5);
    expect(result.r).toBe(3);
    expect(result.j).toBe(4);
  });

  it('counts r = 4 for two pin supports', () => {
    const result = countTrussUnknowns(indeterminateTruss);
    expect(result.r).toBe(4);
  });

  it('counts r = 2 for two roller supports', () => {
    const result = countTrussUnknowns(unstableTruss);
    expect(result.r).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// classifyTrussByCount
// ---------------------------------------------------------------------------

describe('classifyTrussByCount', () => {
  it('classifies simple triangle as statically determinate (m+r = 2j: 6 = 6)', () => {
    expect(classifyTrussByCount(triangleTruss)).toBe('statically_determinate');
  });

  it('classifies king-post as statically determinate (m+r = 2j: 8 = 8)', () => {
    expect(classifyTrussByCount(kingPostTruss)).toBe('statically_determinate');
  });

  it('classifies two-pin triangle as statically indeterminate (m+r = 7 > 2j = 6)', () => {
    expect(classifyTrussByCount(indeterminateTruss)).toBe('statically_indeterminate');
  });

  it('classifies two-roller triangle as unstable (m+r = 5 < 2j = 6)', () => {
    expect(classifyTrussByCount(unstableTruss)).toBe('unstable');
  });
});

// ---------------------------------------------------------------------------
// getUnknownMembersAtJoint
// ---------------------------------------------------------------------------

describe('getUnknownMembersAtJoint', () => {
  it('returns all connected members when none are solved', () => {
    const unknowns = getUnknownMembersAtJoint(triangleTruss, 'j-a', []);
    expect(unknowns).toContain('m-ab');
    expect(unknowns).toContain('m-ca');
    expect(unknowns).toHaveLength(2);
  });

  it('returns only unsolved members', () => {
    const unknowns = getUnknownMembersAtJoint(triangleTruss, 'j-a', ['m-ab']);
    expect(unknowns).toEqual(['m-ca']);
  });

  it('returns empty when all connected members are solved', () => {
    const unknowns = getUnknownMembersAtJoint(triangleTruss, 'j-a', ['m-ab', 'm-ca']);
    expect(unknowns).toHaveLength(0);
  });

  it('handles king-post joint C with 3 members', () => {
    const unknowns = getUnknownMembersAtJoint(kingPostTruss, 'j-c', []);
    expect(unknowns).toHaveLength(3); // AC, CB, CD
  });
});

// ---------------------------------------------------------------------------
// getRecommendedNextJoints
// ---------------------------------------------------------------------------

describe('getRecommendedNextJoints', () => {
  it('recommends joints with 1-2 unknowns for simple triangle (no solved)', () => {
    const recommended = getRecommendedNextJoints(triangleTruss, []);
    // Joint A: 2 unknowns (AB, CA) — recommended
    // Joint B: 2 unknowns (AB, BC) — recommended
    // Joint C: 2 unknowns (BC, CA) — recommended
    expect(recommended).toHaveLength(3);
  });

  it('recommends fewer joints after solving some members', () => {
    // Solve AB: joint A now has 1 unknown (CA), joint B has 1 unknown (BC), joint C still 2
    const recommended = getRecommendedNextJoints(triangleTruss, ['m-ab']);
    expect(recommended.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty when all members are solved', () => {
    const recommended = getRecommendedNextJoints(triangleTruss, ['m-ab', 'm-bc', 'm-ca']);
    expect(recommended).toHaveLength(0);
  });

  it('excludes joints with 3+ unknowns (king-post joint C initially)', () => {
    // Joint C has 3 connected members (AC, CB, CD) — too many unknowns
    const recommended = getRecommendedNextJoints(kingPostTruss, []);
    expect(recommended).not.toContain('j-c');
  });
});

// ---------------------------------------------------------------------------
// checkZeroForceSelection
// ---------------------------------------------------------------------------

describe('checkZeroForceSelection', () => {
  const allIds = ['m-ac', 'm-cb', 'm-ad', 'm-bd', 'm-cd'];
  const refZeros = ['m-cd']; // king-post ZFM

  it('returns perfect score for exact match', () => {
    const fb = checkZeroForceSelection(['m-cd'], refZeros, allIds);
    expect(fb.score).toBe(1.0);
    expect(fb.correctIds).toEqual(['m-cd']);
    expect(fb.missedIds).toHaveLength(0);
    expect(fb.falsePositiveIds).toHaveLength(0);
    expect(fb.message).toContain('correctly identified');
  });

  it('reports missed zero-force member', () => {
    const fb = checkZeroForceSelection([], refZeros, allIds);
    expect(fb.missedIds).toEqual(['m-cd']);
    expect(fb.score).toBeLessThan(1.0);
    expect(fb.message).toContain('missed');
  });

  it('reports false positive zero-force selection', () => {
    const fb = checkZeroForceSelection(['m-cd', 'm-ac'], refZeros, allIds);
    expect(fb.falsePositiveIds).toEqual(['m-ac']);
    expect(fb.score).toBeLessThan(1.0);
    expect(fb.message).toContain('incorrectly marked');
  });

  it('handles mixed: 1 correct, 1 missed, 1 false positive', () => {
    // Reference: ['m-cd']. Selected: ['m-ac'] — missed CD, false positive AC
    const fb = checkZeroForceSelection(['m-ac'], refZeros, allIds);
    expect(fb.missedIds).toEqual(['m-cd']);
    expect(fb.falsePositiveIds).toEqual(['m-ac']);
    expect(fb.correctIds).toHaveLength(0);
  });

  it('handles no zero-force members (empty reference)', () => {
    const fb = checkZeroForceSelection([], [], allIds);
    expect(fb.score).toBe(1.0);
    expect(fb.message).toContain('correctly identified');
  });
});

// ---------------------------------------------------------------------------
// checkJointCanBeSolved
// ---------------------------------------------------------------------------

describe('checkJointCanBeSolved', () => {
  it('returns valid=true for joint with 2 unknowns', () => {
    const fb = checkJointCanBeSolved(triangleTruss, 'j-a', []);
    expect(fb.isValid).toBe(true);
    expect(fb.unknownsCount).toBe(2);
    expect(fb.message).toContain('can be solved');
  });

  it('returns valid=true for joint with 1 unknown', () => {
    const fb = checkJointCanBeSolved(triangleTruss, 'j-a', ['m-ab']);
    expect(fb.isValid).toBe(true);
    expect(fb.unknownsCount).toBe(1);
  });

  it('returns valid=false for joint with 0 unknowns', () => {
    const fb = checkJointCanBeSolved(triangleTruss, 'j-a', ['m-ab', 'm-ca']);
    expect(fb.isValid).toBe(false);
    expect(fb.unknownsCount).toBe(0);
    expect(fb.message).toContain('already solved');
  });

  it('returns valid=false with educational message for joint with 3+ unknowns', () => {
    // King-post joint C has 3 members (AC, CB, CD)
    const fb = checkJointCanBeSolved(kingPostTruss, 'j-c', []);
    expect(fb.isValid).toBe(false);
    expect(fb.unknownsCount).toBe(3);
    expect(fb.message).toContain('3 unknown forces');
    expect(fb.message).toContain('at most 2');
    expect(fb.message).toContain('ΣFx');
  });
});

// ---------------------------------------------------------------------------
// buildJointEquationPrompt
// ---------------------------------------------------------------------------

describe('buildJointEquationPrompt', () => {
  it('identifies unknown member IDs and labels at a joint', () => {
    const prompt = buildJointEquationPrompt(
      triangleTruss,
      'j-a',
      [],
      { R_Ax: 0, R_Ay: 300 },
      {}
    );
    expect(prompt.jointId).toBe('j-a');
    expect(prompt.jointLabel).toBe('A');
    expect(prompt.unknownMemberIds).toContain('m-ab');
    expect(prompt.unknownMemberIds).toContain('m-ca');
    expect(prompt.unknownMemberLabels).toContain('AB');
    expect(prompt.unknownMemberLabels).toContain('CA');
  });

  it('generates equation strings containing = 0', () => {
    const prompt = buildJointEquationPrompt(
      triangleTruss,
      'j-a',
      [],
      { R_Ax: 0, R_Ay: 300 },
      {}
    );
    expect(prompt.eqX).toContain('= 0');
    expect(prompt.eqY).toContain('= 0');
  });

  it('reduces unknowns when some members are solved', () => {
    const prompt = buildJointEquationPrompt(
      triangleTruss,
      'j-a',
      ['m-ab'],
      { R_Ax: 0, R_Ay: 300 },
      { 'm-ab': 300 }
    );
    expect(prompt.unknownMemberIds).toHaveLength(1);
    expect(prompt.unknownMemberIds[0]).toBe('m-ca');
  });

  it('includes external load contributions in equation strings for loaded joint', () => {
    const prompt = buildJointEquationPrompt(
      triangleTruss,
      'j-c',
      [],
      {},
      {}
    );
    // Joint C has load P1 = 600 N at 270° (straight down)
    // fy component = 600 * sin(270°) = -600
    expect(prompt.eqY).toContain('P1');
  });
});
