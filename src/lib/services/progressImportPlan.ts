import type { Attempt } from '../domain/progress/types';
import { CURRENT_SCHEMA_VERSION } from '../domain/progress/types';
import { normalizeProgressData } from '../domain/progress/telemetryMigration';

export type ProgressImportMode = 'merge' | 'replace';

export interface ProgressImportPlan {
  validAttempts: Attempt[];
  schemaVersion: number;
  importedCandidateCount: number;
  duplicateCount: number;
  internalDuplicateCount: number;
  skippedInvalidCount: number;
  warnings: string[];
  canMerge: boolean;
  canReplaceSafely: boolean;
  requiresDangerousEmptyReplaceConfirmation: boolean;
  summaryMessage: {
    en: string;
    id: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function countInternalDuplicates(attempts: Attempt[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const attempt of attempts) {
    if (seen.has(attempt.id)) duplicates++;
    seen.add(attempt.id);
  }
  return duplicates;
}

function dedupeAttempts(attempts: Attempt[]): Attempt[] {
  const byId = new Map<string, Attempt>();
  for (const attempt of attempts) {
    byId.set(attempt.id, attempt);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function createProgressImportPlan(raw: unknown, existingAttempts: Attempt[]): ProgressImportPlan {
  const schemaVersion = isRecord(raw) && typeof raw.schemaVersion === 'number'
    ? raw.schemaVersion
    : CURRENT_SCHEMA_VERSION;
  const importedCandidateCount = isRecord(raw) && Array.isArray(raw.attempts) ? raw.attempts.length : 0;
  const normalized = normalizeProgressData(raw);
  const internalDuplicateCount = countInternalDuplicates(normalized.data.attempts);
  const validAttempts = dedupeAttempts(normalized.data.attempts);
  const existingIds = new Set(existingAttempts.map(attempt => attempt.id));
  const duplicateCount = validAttempts.filter(attempt => existingIds.has(attempt.id)).length;
  const skippedInvalidCount = normalized.warnings.filter(warning => warning.startsWith('Skipped invalid attempt')).length;
  const warnings = [
    ...normalized.warnings,
    ...(internalDuplicateCount > 0 ? [`${internalDuplicateCount} duplicate attempt ID(s) inside import were deduplicated.`] : [])
  ];
  const requiresDangerousEmptyReplaceConfirmation = validAttempts.length === 0 && existingAttempts.length > 0;

  return {
    validAttempts,
    schemaVersion,
    importedCandidateCount,
    duplicateCount,
    internalDuplicateCount,
    skippedInvalidCount,
    warnings,
    canMerge: validAttempts.length > 0,
    canReplaceSafely: validAttempts.length > 0,
    requiresDangerousEmptyReplaceConfirmation,
    summaryMessage: {
      en: `Found ${validAttempts.length} valid attempts, ${duplicateCount} existing duplicates, and ${skippedInvalidCount} invalid records.`,
      id: `Ditemukan ${validAttempts.length} percobaan valid, ${duplicateCount} duplikat yang sudah ada, dan ${skippedInvalidCount} rekaman tidak valid.`
    }
  };
}
