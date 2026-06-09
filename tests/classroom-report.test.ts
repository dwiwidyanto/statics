import { describe, expect, it } from 'vitest';
import { trussProblems } from '../src/content/problems/truss-problems';
import {
  buildAttemptReportFilename,
  buildClassroomReport,
  escapeCsvCell,
  serializeClassroomReportCsv,
  serializeClassroomReportJson,
} from '../src/lib/domain/progress/classroomReport';
import type { Attempt, GuidedAttemptTelemetry } from '../src/lib/domain/progress/types';
import { solveTruss } from '../src/lib/domain/truss/solver';

const problem = trussProblems[0];

const telemetry: GuidedAttemptTelemetry = {
  problemId: problem.id,
  problemVersion: problem.version,
  topic: 'trusses',
  startedAt: '2026-06-01T00:00:00Z',
  completedAt: '2026-06-01T00:02:00Z',
  totalScore: 0.8,
  completed: true,
  stepAttempts: [
    {
      stepId: 'reactions',
      createdAt: '2026-06-01T00:00:30Z',
      isCorrect: true,
      score: 1,
      feedbackMessages: ['Good reaction setup.'],
      misconceptions: ['sign_reversed'],
      hintLevelUsed: 1,
      attemptNumber: 1,
      answersSnapshot: { kind: 'reactions', answers: { R_Ay: 300 } },
    },
    {
      stepId: 'member_forces',
      createdAt: '2026-06-01T00:01:30Z',
      isCorrect: false,
      score: 0.6,
      feedbackMessages: ['Check the tension sign convention.'],
      misconceptions: ['tension_compression_confusion'],
      hintLevelUsed: 2,
      attemptNumber: 1,
      answersSnapshot: {
        kind: 'member_forces',
        jointId: problem.joints[0].id,
        answers: { AB: -100 },
        unknownMemberIds: [problem.members[0].id],
      },
    },
  ],
  misconceptionCounts: { tension_compression_confusion: 1 },
  skillBreakdown: {
    determinacy: 1,
    reactions: 1,
    zeroForceMembers: 0.8,
    jointSelection: 0.75,
    memberForces: 0.6,
  },
  finalAnswers: { R_Ay: 300, AB: -100 },
};

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'att-1',
    problemId: problem.id,
    problemVersion: problem.version,
    createdAt: '2026-06-01T00:00:00Z',
    answers: { R_Ay: 300 },
    score: 0.8,
    feedback: ['Great, "quoted" progress.\nCheck signs.'],
    completed: true,
    topic: 'trusses',
    skillBreakdown: { reactions: 1 },
    misconceptions: ['sign_reversed'],
    guidedTelemetry: telemetry,
    ...overrides,
  };
}

describe('classroom attempt report export', () => {
  it('builds a printable/exportable report with telemetry, misconceptions, and solver metadata', () => {
    const solverResult = solveTruss(problem);
    const report = buildClassroomReport({
      attempt: attempt(),
      problem,
      telemetry,
      solverResult,
    });

    expect(report.attemptId).toBe('att-1');
    expect(report.title).toBe(problem.title);
    expect(report.durationSeconds).toBe(120);
    expect(report.firstAttemptAccuracy).toBe(0.5);
    expect(report.totalHintsUsed).toBe(3);
    expect(report.misconceptions.map(item => item.code)).toEqual([
      'sign_reversed',
      'tension_compression_confusion',
    ]);
    expect(report.misconceptions[0].remediation.en.length).toBeGreaterThan(0);
    expect(report.finalAnswers).toEqual({ R_Ay: 300, AB: -100 });
    expect(Object.keys(report.referenceAnswers).length).toBeGreaterThan(0);
    expect(report.solver.method).toBe('method_of_joints');
    expect(report.solver.messages.length).toBeGreaterThan(0);
  });

  it('falls back gracefully when guided telemetry is unavailable', () => {
    const report = buildClassroomReport({
      attempt: attempt({ guidedTelemetry: undefined, misconceptions: undefined, skillBreakdown: undefined }),
      problem,
    });

    expect(report.durationSeconds).toBeNull();
    expect(report.firstAttemptAccuracy).toBeNull();
    expect(report.totalHintsUsed).toBe(0);
    expect(report.skillBreakdown).toEqual({});
    expect(report.finalAnswers).toEqual({ R_Ay: 300 });
    expect(report.solver.method).toBe('unknown');
  });

  it('serializes stable CSV and JSON classroom exports', () => {
    const report = buildClassroomReport({
      attempt: attempt(),
      problem: { ...problem, title: 'Intro, Truss' },
      telemetry,
      solverResult: solveTruss(problem),
    });
    const csv = serializeClassroomReportCsv(report);
    const json = serializeClassroomReportJson(report);

    expect(csv.split('\n')[0]).toBe(
      'attempt_id,problem_id,title,topic,difficulty,score,completed,duration_seconds,first_attempt_accuracy,total_hints,misconceptions,solver_method,max_residual,skill_breakdown,final_answers'
    );
    expect(csv.split('\n')[1]).toContain('"Intro, Truss"');
    expect(JSON.parse(json).attemptId).toBe('att-1');
    expect(buildAttemptReportFilename(report, 'json')).toBe(`staticslab_attempt_${problem.id}_att-1_2026-06-01.json`);
  });

  it('escapes CSV cells with commas, quotes, and line breaks', () => {
    expect(escapeCsvCell('a,"b"\nline')).toBe('"a,""b""\nline"');
  });
});
