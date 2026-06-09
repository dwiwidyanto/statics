import { getMisconceptionDefinition } from '../learning/misconceptions';
import type { Attempt, GuidedAttemptTelemetry } from './types';
import type { TrussSolverResult } from '../truss/types';

export interface ClassroomReportProblem {
  id: string;
  title: string;
  titleId?: string;
  topic?: string;
  difficulty?: string;
}

export interface ClassroomReport {
  attemptId: string;
  problemId: string;
  title: string;
  titleId?: string;
  topic: string;
  difficulty: string;
  score: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  durationSeconds: number | null;
  firstAttemptAccuracy: number | null;
  totalHintsUsed: number;
  skillBreakdown: Record<string, number>;
  misconceptions: Array<{
    code: string;
    title: { en: string; id: string };
    remediation: { en: string; id: string };
  }>;
  finalAnswers: Record<string, number>;
  referenceAnswers: Record<string, number>;
  feedback: string[];
  solver: {
    method: string;
    unknownCount?: number;
    equationCount?: number;
    maxResidual?: number;
    messages: string[];
  };
}

function durationSeconds(telemetry?: GuidedAttemptTelemetry): number | null {
  if (!telemetry?.completedAt) return null;
  const started = new Date(telemetry.startedAt).getTime();
  const completed = new Date(telemetry.completedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(completed)) return null;
  return Math.max(0, Math.round((completed - started) / 1000));
}

function firstAttemptAccuracy(telemetry?: GuidedAttemptTelemetry): number | null {
  if (!telemetry || telemetry.stepAttempts.length === 0) return null;
  const firstByStep = new Map<string, boolean>();
  for (const attempt of telemetry.stepAttempts) {
    if (!firstByStep.has(attempt.stepId)) firstByStep.set(attempt.stepId, attempt.isCorrect);
  }
  const values = Array.from(firstByStep.values());
  return values.filter(Boolean).length / values.length;
}

function totalHints(telemetry?: GuidedAttemptTelemetry): number {
  return telemetry?.stepAttempts.reduce((sum, step) => sum + step.hintLevelUsed, 0) ?? 0;
}

export function buildClassroomReport(args: {
  attempt: Attempt;
  problem?: ClassroomReportProblem;
  telemetry?: GuidedAttemptTelemetry;
  solverResult?: TrussSolverResult | null;
}): ClassroomReport {
  const telemetry = args.telemetry ?? args.attempt.guidedTelemetry;
  const solver = args.solverResult;
  const misconceptionCodes = args.attempt.misconceptions ?? [];
  const misconceptionCounts = telemetry ? Object.keys(telemetry.misconceptionCounts) : [];
  const uniqueMisconceptions = Array.from(new Set([...misconceptionCodes, ...misconceptionCounts]));

  return {
    attemptId: args.attempt.id,
    problemId: args.attempt.problemId,
    title: args.problem?.title ?? args.attempt.problemId,
    titleId: args.problem?.titleId,
    topic: args.attempt.topic ?? telemetry?.topic ?? args.problem?.topic ?? '',
    difficulty: args.problem?.difficulty ?? '',
    score: args.attempt.score,
    completed: args.attempt.completed,
    createdAt: args.attempt.createdAt,
    completedAt: telemetry?.completedAt,
    durationSeconds: durationSeconds(telemetry),
    firstAttemptAccuracy: firstAttemptAccuracy(telemetry),
    totalHintsUsed: totalHints(telemetry),
    skillBreakdown: { ...(args.attempt.skillBreakdown ?? telemetry?.skillBreakdown ?? {}) },
    misconceptions: uniqueMisconceptions.map(code => {
      const definition = getMisconceptionDefinition(code);
      return {
        code,
        title: definition?.title ?? { en: code, id: code },
        remediation: definition?.remediation ?? { en: '', id: '' }
      };
    }),
    finalAnswers: telemetry?.finalAnswers ?? args.attempt.answers ?? {},
    referenceAnswers: {
      ...(solver?.reactions ?? {}),
      ...(solver?.memberForces ?? {})
    },
    feedback: args.attempt.feedback ?? [],
    solver: {
      method: solver?.solverMethod ?? 'unknown',
      unknownCount: solver?.equationSystem?.unknownCount,
      equationCount: solver?.equationSystem?.equationCount,
      maxResidual: solver?.equationSystem?.residuals.maxAbs,
      messages: solver?.messages ?? []
    }
  };
}

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const classroomReportCsvHeaders = [
  'attempt_id',
  'problem_id',
  'title',
  'topic',
  'difficulty',
  'score',
  'completed',
  'duration_seconds',
  'first_attempt_accuracy',
  'total_hints',
  'misconceptions',
  'solver_method',
  'max_residual',
  'skill_breakdown',
  'final_answers'
];

export function serializeClassroomReportCsv(report: ClassroomReport): string {
  const row = [
    report.attemptId,
    report.problemId,
    report.title,
    report.topic,
    report.difficulty,
    report.score,
    report.completed,
    report.durationSeconds ?? '',
    report.firstAttemptAccuracy ?? '',
    report.totalHintsUsed,
    report.misconceptions.map(item => item.code).join(';'),
    report.solver.method,
    report.solver.maxResidual ?? '',
    Object.entries(report.skillBreakdown).map(([key, value]) => `${key}:${value}`).join(';'),
    Object.entries(report.finalAnswers).map(([key, value]) => `${key}:${value}`).join(';')
  ];
  return [classroomReportCsvHeaders.join(','), row.map(escapeCsvCell).join(',')].join('\n');
}

export function serializeClassroomReportJson(report: ClassroomReport): string {
  return JSON.stringify(report, null, 2);
}

export function buildAttemptReportFilename(report: ClassroomReport, extension: 'json' | 'csv'): string {
  const date = report.createdAt.slice(0, 10) || 'unknown-date';
  return `staticslab_attempt_${report.problemId}_${report.attemptId}_${date}.${extension}`;
}
