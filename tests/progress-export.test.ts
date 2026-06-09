import { describe, it, expect } from 'vitest';
import {
  serializeProgressData,
  validateAndParseImportData,
  mergeAttempts
} from '../src/lib/services/progressExport';
import type { Attempt } from '../src/lib/domain/progress/types';

describe('Progress Import / Export Service', () => {
  const mockAttempts: Attempt[] = [
    {
      id: 'att-1',
      problemId: 'beam-1',
      problemVersion: 1,
      createdAt: '2026-06-06T10:00:00Z',
      answers: {},
      score: 1.0,
      feedback: [],
      completed: true
    }
  ];

  it('serializes progress data to standard JSON format', () => {
    const raw = serializeProgressData(mockAttempts);
    const parsed = JSON.parse(raw);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.appName).toBe('StaticsLab');
    expect(parsed.generatedBy).toBe('StaticsLab local progress export');
    expect(parsed.attemptCount).toBe(1);
    expect(parsed.attempts.length).toBe(1);
    expect(parsed.attempts[0].id).toBe('att-1');
  });

  it('round-trips exported progress through the import validator', () => {
    const raw = serializeProgressData(mockAttempts);
    const result = validateAndParseImportData(raw);
    expect(result.isValid).toBe(true);
    expect(result.attempts?.map(a => a.id)).toEqual(['att-1']);
  });

  it('rejects malformed json strings', () => {
    const res = validateAndParseImportData('malformed JSON {');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Failed to parse JSON');
  });

  it('rejects newer schema versions', () => {
    const futureData = {
      schemaVersion: 999, // Future version
      exportedAt: '',
      appName: 'StaticsLab',
      attempts: []
    };
    const res = validateAndParseImportData(JSON.stringify(futureData));
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('newer than supported version');
  });

  it('rejects missing attempts array', () => {
    const invalidData = {
      schemaVersion: 1,
      exportedAt: ''
    };
    const res = validateAndParseImportData(JSON.stringify(invalidData));
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('must contain an attempts array');
  });

  it('sanitizes and filters out invalid individual attempts', () => {
    const mixedData = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      attempts: [
        // Valid
        {
          id: 'att-valid',
          problemId: 'beam-1',
          score: 0.9,
          createdAt: new Date().toISOString()
        },
        // Invalid (missing problemId)
        {
          id: 'att-invalid',
          score: 1.0,
          createdAt: new Date().toISOString()
        }
      ]
    };
    const res = validateAndParseImportData(JSON.stringify(mixedData));
    expect(res.isValid).toBe(true);
    expect(res.attempts?.length).toBe(1);
    expect(res.attempts?.[0].id).toBe('att-valid');
  });

  it('merges current and imported attempts avoiding duplicates by ID', () => {
    const current: Attempt[] = [
      { id: 'att-1', problemId: 'beam-1', problemVersion: 1, createdAt: '2026-06-06T10:00:00Z', answers: {}, score: 0.5, feedback: [], completed: false }
    ];
    const imported: Attempt[] = [
      // Duplicate ID (should override/preserve only one, mergeAttempts keeps imported or current)
      { id: 'att-1', problemId: 'beam-1', problemVersion: 1, createdAt: '2026-06-06T10:05:00Z', answers: {}, score: 0.9, feedback: [], completed: true },
      // New ID
      { id: 'att-2', problemId: 'truss-1', problemVersion: 1, createdAt: '2026-06-06T11:00:00Z', answers: {}, score: 1.0, feedback: [], completed: true }
    ];

    const merged = mergeAttempts(current, imported);
    expect(merged.length).toBe(2);
    // att-1 score should be 0.9 (overwritten by imported)
    const att1 = merged.find(a => a.id === 'att-1');
    expect(att1?.score).toBe(0.9);
  });
});
