/**
 * localStorage-backed implementation of ProgressRepository.
 *
 * Storage key: staticslab.progress.v1
 * Schema is versioned via ProgressData.schemaVersion so future
 * migrations are possible without data loss.
 */

import type { ProgressRepository, AnyProblem } from './progressRepository';
import type {
  Attempt,
  ProblemProgress,
  ProgressSummary,
  ProgressData,
  TopicStats,
} from '../domain/progress/types';
import { CURRENT_SCHEMA_VERSION } from '../domain/progress/types';
import { normalizeAttempt, normalizeProgressData } from '../domain/progress/telemetryMigration';
import { createProgressImportPlan } from './progressImportPlan';

const STORAGE_KEY = 'staticslab.progress.v1';

function emptyData(): ProgressData {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, attempts: [] };
}

function loadData(): ProgressData {
  if (typeof localStorage === 'undefined') return emptyData();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();

    const normalized = normalizeProgressData(JSON.parse(raw));
    for (const warning of normalized.warnings) {
      console.warn(`[StaticsLab] ${warning}`);
    }
    if (normalized.warnings.length > 0) saveData(normalized.data);
    return normalized.data;
  } catch {
    console.warn('[StaticsLab] Failed to parse progress data. Starting with empty progress.');
    return emptyData();
  }
}

function saveData(data: ProgressData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[StaticsLab] Failed to save progress data:', e);
  }
}

export class LocalProgressRepository implements ProgressRepository {
  private data: ProgressData;

  constructor() {
    this.data = loadData();
  }

  saveAttempt(attempt: Attempt): void {
    const normalized = normalizeAttempt(attempt);
    if (!normalized) return;
    this.data.attempts.push(normalized);
    saveData(this.data);
  }

  getAttempts(problemId?: string): Attempt[] {
    if (problemId) {
      return this.data.attempts.filter(a => a.problemId === problemId);
    }
    return [...this.data.attempts];
  }

  getProblemProgress(problemId: string): ProblemProgress {
    const attempts = this.data.attempts.filter(a => a.problemId === problemId);

    if (attempts.length === 0) {
      return {
        problemId,
        bestScore: 0,
        attemptsCount: 0,
        completed: false,
        lastAttemptAt: null,
      };
    }

    let bestScore = 0;
    let completed = false;
    let lastAttemptAt = '';

    for (const a of attempts) {
      if (a.score > bestScore) bestScore = a.score;
      if (a.completed) completed = true;
      if (a.createdAt > lastAttemptAt) lastAttemptAt = a.createdAt;
    }

    return {
      problemId,
      bestScore,
      attemptsCount: attempts.length,
      completed,
      lastAttemptAt,
    };
  }

  getSummary(allProblems: AnyProblem[]): ProgressSummary {
    const byTopic: Record<string, TopicStats> = {};

    // Initialize topic buckets from all problems
    for (const p of allProblems) {
      const topic = p.topic;
      if (topic && !byTopic[topic]) {
        byTopic[topic] = { total: 0, attempted: 0, completed: 0, averageBestScore: 0 };
      }
    }

    let totalProblems = allProblems.length;
    let attemptedProblems = 0;
    let completedProblems = 0;
    let totalBestScore = 0;
    let scoredCount = 0;

    // Per-topic accumulators
    const topicScores: Record<string, { sum: number; count: number }> = {};

    for (const p of allProblems) {
      const topic = p.topic;
      if (topic && byTopic[topic]) {
        byTopic[topic].total++;
      }

      const progress = this.getProblemProgress(p.id);

      if (progress.attemptsCount > 0) {
        attemptedProblems++;
        totalBestScore += progress.bestScore;
        scoredCount++;

        if (topic && byTopic[topic]) {
          byTopic[topic].attempted++;
          if (!topicScores[topic]) topicScores[topic] = { sum: 0, count: 0 };
          topicScores[topic].sum += progress.bestScore;
          topicScores[topic].count++;
        }
      }

      if (progress.completed) {
        completedProblems++;
        if (topic && byTopic[topic]) {
          byTopic[topic].completed++;
        }
      }
    }

    // Compute topic averages
    for (const [topic, scores] of Object.entries(topicScores)) {
      if (byTopic[topic] && scores.count > 0) {
        byTopic[topic].averageBestScore = scores.sum / scores.count;
      }
    }

    return {
      totalProblems,
      attemptedProblems,
      completedProblems,
      averageBestScore: scoredCount > 0 ? totalBestScore / scoredCount : 0,
      byTopic,
    };
  }

  exportProgress(): ProgressData {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      attempts: [...this.data.attempts],
    };
  }

  importProgress(data: unknown, mode: 'replace' | 'merge', options?: { allowDangerousEmptyReplace?: boolean }): {
    importedAttempts: number;
    skippedAttempts: number;
    duplicateAttempts: number;
    schemaVersion: number;
    validAttempts: number;
    replacedAttempts: number;
    warnings: string[];
  } {
    const plan = createProgressImportPlan(data, this.data.attempts);

    if (mode === 'replace') {
      if (plan.validAttempts.length === 0 && !options?.allowDangerousEmptyReplace) {
        return {
          importedAttempts: 0,
          skippedAttempts: plan.skippedInvalidCount,
          duplicateAttempts: 0,
          schemaVersion: plan.schemaVersion,
          validAttempts: 0,
          replacedAttempts: 0,
          warnings: [
            ...plan.warnings,
            'Replace import blocked because the file contains zero valid attempts.'
          ],
        };
      }
      this.data = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        attempts: plan.validAttempts,
      };
      saveData(this.data);
      return {
        importedAttempts: plan.validAttempts.length,
        skippedAttempts: plan.skippedInvalidCount + plan.internalDuplicateCount,
        duplicateAttempts: plan.internalDuplicateCount,
        schemaVersion: plan.schemaVersion,
        validAttempts: plan.validAttempts.length,
        replacedAttempts: plan.validAttempts.length,
        warnings: plan.warnings,
      };
    }

    const existingById = new Map(this.data.attempts.map(attempt => [attempt.id, attempt]));
    let added = 0;
    let duplicates = 0;
    for (const attempt of plan.validAttempts) {
      if (!existingById.has(attempt.id)) {
        existingById.set(attempt.id, attempt);
        added++;
      } else {
        duplicates++;
      }
    }

    this.data = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      attempts: Array.from(existingById.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    };
    saveData(this.data);

    return {
      importedAttempts: added,
      skippedAttempts: duplicates + plan.skippedInvalidCount + plan.internalDuplicateCount,
      duplicateAttempts: duplicates,
      schemaVersion: plan.schemaVersion,
      validAttempts: plan.validAttempts.length,
      replacedAttempts: 0,
      warnings: plan.warnings,
    };
  }

  reset(): void {
    this.data = emptyData();
    saveData(this.data);
  }
}

// Module-level singleton
let instance: LocalProgressRepository | null = null;

export function getProgressRepository(): ProgressRepository {
  if (!instance) {
    instance = new LocalProgressRepository();
  }
  return instance;
}
