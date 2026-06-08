import type { Attempt } from '../domain/progress/types';
import { getHintUsageSummary } from '../domain/progress/guidedTelemetry';

const csvHeaders = [
  'attempt_id',
  'problem_id',
  'topic',
  'score',
  'completed',
  'created_at',
  'misconceptions',
  'weakest_skill',
  'hints_used'
];

function escapeCsv(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function weakestSkill(attempt: Attempt): string {
  if (!attempt.skillBreakdown) return '';
  const entries = Object.entries(attempt.skillBreakdown);
  if (entries.length === 0) return '';
  return entries.sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0][0];
}

function hintsUsed(attempt: Attempt): number {
  return attempt.guidedTelemetry
    ? getHintUsageSummary(attempt.guidedTelemetry.stepAttempts).totalHintsUsed
    : 0;
}

export function serializeAttemptsCsv(attempts: Attempt[]): string {
  const rows = [...attempts]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(attempt => [
      attempt.id,
      attempt.problemId,
      attempt.topic ?? '',
      attempt.score,
      attempt.completed,
      attempt.createdAt,
      (attempt.misconceptions ?? []).join(';'),
      weakestSkill(attempt),
      hintsUsed(attempt)
    ].map(escapeCsv).join(','));

  return [csvHeaders.join(','), ...rows].join('\n');
}
