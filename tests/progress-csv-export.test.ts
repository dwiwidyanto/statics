import { describe, expect, it } from 'vitest';
import { serializeAttemptsCsv } from '../src/lib/services/progressCsvExport';
import type { Attempt } from '../src/lib/domain/progress/types';

describe('Instructor CSV progress export', () => {
  it('serializes attempts with classroom review fields', () => {
    const attempts: Attempt[] = [
      {
        id: 'att-2',
        problemId: 'truss-simple',
        problemVersion: 1,
        createdAt: '2026-06-02T00:00:00Z',
        answers: {},
        score: 0.7,
        feedback: [],
        completed: false,
        topic: 'trusses',
        misconceptions: ['sign_reversed', 'zero_force_missed'],
        skillBreakdown: { reactions: 0.4, memberForces: 0.8 },
      },
      {
        id: 'att-1',
        problemId: 'beam-1',
        problemVersion: 1,
        createdAt: '2026-06-01T00:00:00Z',
        answers: {},
        score: 1,
        feedback: [],
        completed: true,
        topic: 'beam-internal-forces',
      },
    ];

    const csv = serializeAttemptsCsv(attempts);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('attempt_id,problem_id,topic,score,completed,created_at,misconceptions,weakest_skill,hints_used');
    expect(lines[1]).toContain('att-1,beam-1,beam-internal-forces,1,true,2026-06-01T00:00:00Z');
    expect(lines[2]).toContain('att-2,truss-simple,trusses,0.7,false,2026-06-02T00:00:00Z,sign_reversed;zero_force_missed,reactions,0');
  });
});
