import type { Attempt } from '../domain/progress/types';
import { CURRENT_SCHEMA_VERSION } from '../domain/progress/types';
import { normalizeProgressData } from '../domain/progress/telemetryMigration';

export interface ProgressExportData {
  schemaVersion: number;
  exportedAt: string;
  appName: string;
  appVersion: string;
  attempts: Attempt[];
}

/**
 * Serializes the student attempts list into a standard portable JSON string.
 */
export function serializeProgressData(attempts: Attempt[]): string {
  const exportData: ProgressExportData = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'StaticsLab',
    appVersion: '1.0.0',
    attempts
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Validates the raw imported JSON text.
 * Rejects malformed JSON and enforces schema version compatibilities.
 * Filters out invalid individual attempts to recover gracefully.
 */
export function validateAndParseImportData(rawJson: string): {
  isValid: boolean;
  error?: string;
  attempts?: Attempt[];
  warnings?: string[];
} {
  try {
    const parsed = JSON.parse(rawJson);

    if (typeof parsed !== 'object' || parsed === null) {
      return { isValid: false, error: 'Imported file is not a valid JSON object' };
    }

    if (typeof parsed.schemaVersion !== 'number') {
      return { isValid: false, error: 'Missing schemaVersion' };
    }

    if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
      return {
        isValid: false,
        error: `Imported schema version ${parsed.schemaVersion} is newer than supported version ${CURRENT_SCHEMA_VERSION}`
      };
    }

    if (!Array.isArray(parsed.attempts)) return { isValid: false, error: 'Imported data must contain an attempts array' };

    const normalized = normalizeProgressData(parsed);

    return {
      isValid: true,
      attempts: normalized.data.attempts,
      warnings: normalized.warnings
    };
  } catch {
    return { isValid: false, error: 'Failed to parse JSON text. File may be corrupted.' };
  }
}

/**
 * Merges imported attempts with current attempts, avoiding duplicates by ID.
 */
export function mergeAttempts(current: Attempt[], imported: Attempt[]): Attempt[] {
  const mergedMap = new Map<string, Attempt>();
  for (const a of current) {
    mergedMap.set(a.id, a);
  }
  for (const a of imported) {
    mergedMap.set(a.id, a);
  }
  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
