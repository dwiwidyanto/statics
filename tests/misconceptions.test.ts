import { describe, it, expect } from 'vitest';
import { misconceptionsDictionary } from '../src/content/learning/misconceptions';

describe('Misconceptions Dictionary Verification', () => {
  const expectedMisconceptions = [
    'reaction_count_error',
    'sign_reversed',
    'tension_compression_confusion',
    'zero_force_missed',
    'zero_force_false_positive',
    'wrong_joint_order'
  ];

  it('contains definitions for all misconceptions emitted by the guided workflow', () => {
    for (const key of expectedMisconceptions) {
      expect(misconceptionsDictionary[key]).toBeDefined();
      expect(misconceptionsDictionary[key].id).toBe(key);
    }
  });

  it('ensures every definition has English and Indonesian texts for title and explanation', () => {
    for (const def of Object.values(misconceptionsDictionary)) {
      expect(def.title.en).toBeTruthy();
      expect(def.title.id).toBeTruthy();
      expect(def.explanation.en).toBeTruthy();
      expect(def.explanation.id).toBeTruthy();
    }
  });

  it('ensures every definition has at least one related step ID', () => {
    for (const def of Object.values(misconceptionsDictionary)) {
      expect(Array.isArray(def.relatedStepIds)).toBe(true);
      expect(def.relatedStepIds.length).toBeGreaterThanOrEqual(1);
    }
  });
});
