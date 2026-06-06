import { describe, it, expect } from 'vitest';
import { trussProblems } from '../src/content/problems/truss-problems';
import { solveTruss } from '../src/lib/domain/truss/solver';
import { getDistance } from '../src/lib/domain/geometry/vector2d';

describe('Truss Problem Metadata Validation', () => {
  it('validates unique truss problem ids', () => {
    const ids = trussProblems.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('verifies all trusses have complete and correct practice metadata', () => {
    trussProblems.forEach((truss) => {
      expect(truss.id).toBeDefined();
      expect(truss.topic).toBe('trusses');
      expect(['easy', 'medium', 'hard']).toContain(truss.difficulty);
      expect(typeof truss.version).toBe('number');
      expect(Array.isArray(truss.learningObjectives)).toBe(true);
      expect(truss.learningObjectives.length).toBeGreaterThan(0);

      // Validate unique joint IDs and labels
      const jointIds = truss.joints.map(j => j.id);
      expect(jointIds.length).toBe(new Set(jointIds).size);
      const jointLabels = truss.joints.map(j => j.label);
      expect(jointLabels.length).toBe(new Set(jointLabels).size);

      // Validate unique member IDs and labels
      const memberIds = truss.members.map(m => m.id);
      expect(memberIds.length).toBe(new Set(memberIds).size);
      const memberLabels = truss.members.map(m => m.label);
      expect(memberLabels.length).toBe(new Set(memberLabels).size);

      // Validate every member references known joints
      const jointIdSet = new Set(jointIds);
      truss.members.forEach(m => {
        expect(jointIdSet.has(m.jointA)).toBe(true, `Member ${m.label} references unknown jointA: ${m.jointA}`);
        expect(jointIdSet.has(m.jointB)).toBe(true, `Member ${m.label} references unknown jointB: ${m.jointB}`);
      });

      // Validate every load references a known joint
      truss.loads.forEach(l => {
        expect(jointIdSet.has(l.jointId)).toBe(true, `Load references unknown joint: ${l.jointId}`);
      });

      // Validate every support position matches a known joint within tolerance (e.g. 1e-3)
      truss.supports.forEach(s => {
        const matchesJoint = truss.joints.some(j => getDistance(s.position, j.position) < 1e-3);
        expect(matchesJoint).toBe(true, `Support at position (${s.position.x}, ${s.position.y}) doesn't align with any joint position.`);
      });
    });
  });

  it('solves every determinate sample truss successfully without joint-equilibrium warnings', () => {
    trussProblems.forEach((truss) => {
      const solverResult = solveTruss(truss);
      if (solverResult.determinacy === 'statically_determinate') {
        expect(solverResult.isSolved).toBe(true, `Expected determinate truss ${truss.id} to be solved by the solver.`);
        expect(solverResult.stability).toBe('stable', `Expected determinate truss ${truss.id} to be stable.`);
        // Check for equilibrium warning messages
        const equilibriumWarnings = solverResult.messages.filter(m => m.includes('equilibrium check failed'));
        expect(equilibriumWarnings).toEqual([]);
      }
    });
  });
});
