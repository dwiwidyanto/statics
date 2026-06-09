import { describe, expect, it } from 'vitest';
import { createProgressImportPlan } from '../src/lib/services/progressImportPlan';
import type { Attempt } from '../src/lib/domain/progress/types';

describe('progress import planning', () => {
  const existing: Attempt[] = [{
    id: 'existing-1',
    problemId: 'beam-1',
    problemVersion: 1,
    createdAt: '2026-06-01T00:00:00Z',
    answers: {},
    score: 1,
    feedback: [],
    completed: true,
  }];

  it('reports valid, invalid, and existing duplicate attempts before merge', () => {
    const plan = createProgressImportPlan({
      schemaVersion: 1,
      attempts: [
        { id: 'existing-1', problemId: 'beam-1', createdAt: '2026-06-02T00:00:00Z', score: 0.5 },
        { id: 'new-1', problemId: 'beam-2', createdAt: '2026-06-03T00:00:00Z', score: 0.8 },
        { id: 'broken' },
      ],
    }, existing);

    expect(plan.schemaVersion).toBe(1);
    expect(plan.importedCandidateCount).toBe(3);
    expect(plan.validAttempts).toHaveLength(2);
    expect(plan.duplicateCount).toBe(1);
    expect(plan.skippedInvalidCount).toBe(1);
    expect(plan.canMerge).toBe(true);
    expect(plan.canReplaceSafely).toBe(true);
  });

  it('blocks zero-valid replace by default and marks dangerous empty replace', () => {
    const plan = createProgressImportPlan({ schemaVersion: 1, attempts: [{ id: 'broken' }] }, existing);
    expect(plan.validAttempts).toHaveLength(0);
    expect(plan.canReplaceSafely).toBe(false);
    expect(plan.requiresDangerousEmptyReplaceConfirmation).toBe(true);
  });

  it('deduplicates duplicate IDs inside the imported file deterministically', () => {
    const plan = createProgressImportPlan({
      schemaVersion: 1,
      attempts: [
        { id: 'dup', problemId: 'beam-1', createdAt: '2026-06-01T00:00:00Z', score: 0.1 },
        { id: 'dup', problemId: 'beam-1', createdAt: '2026-06-02T00:00:00Z', score: 0.9 },
      ],
    }, []);

    expect(plan.internalDuplicateCount).toBe(1);
    expect(plan.validAttempts).toHaveLength(1);
    expect(plan.validAttempts[0].score).toBe(0.9);
  });
});
