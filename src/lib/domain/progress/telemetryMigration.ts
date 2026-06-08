import {
  CURRENT_SCHEMA_VERSION,
  type Attempt,
  type GuidedAnswersSnapshot,
  type GuidedAttemptTelemetry,
  type GuidedStepAttempt,
  type GuidedStepId,
  type ProgressData
} from './types';

const stepIds = new Set<GuidedStepId>([
  'overview',
  'determinacy',
  'reactions',
  'zero_members',
  'joint_sequence',
  'member_forces',
  'summary'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function numberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'number' && Number.isFinite(raw)) out[key] = raw;
  }
  return out;
}

function nullableNumberRecord(value: unknown): Record<string, number | null> {
  if (!isRecord(value)) return {};
  const out: Record<string, number | null> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (raw === null || raw === '') out[key] = null;
    else if (typeof raw === 'number' && Number.isFinite(raw)) out[key] = raw;
    else if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) out[key] = Number(raw);
  }
  return out;
}

function normalizeSnapshot(stepId: GuidedStepId, raw: unknown): GuidedAnswersSnapshot | null {
  if (isRecord(raw) && raw.kind === stepId) {
    if (stepId === 'determinacy') {
      return {
        kind: 'determinacy',
        m: typeof raw.m === 'number' ? raw.m : null,
        r: typeof raw.r === 'number' ? raw.r : null,
        j: typeof raw.j === 'number' ? raw.j : null,
        classification:
          raw.classification === 'statically_determinate' ||
          raw.classification === 'statically_indeterminate' ||
          raw.classification === 'unstable'
            ? raw.classification
            : null
      };
    }
    if (stepId === 'reactions') return { kind: 'reactions', answers: nullableNumberRecord(raw.answers) };
    if (stepId === 'zero_members') return { kind: 'zero_members', selectedMemberIds: optionalStringArray(raw.selectedMemberIds) };
    if (stepId === 'joint_sequence') {
      return {
        kind: 'joint_sequence',
        jointId: typeof raw.jointId === 'string' ? raw.jointId : null,
        availableJointIds: optionalStringArray(raw.availableJointIds),
        recommendedJointIds: optionalStringArray(raw.recommendedJointIds)
      };
    }
    if (stepId === 'member_forces') {
      return {
        kind: 'member_forces',
        jointId: typeof raw.jointId === 'string' ? raw.jointId : '',
        answers: nullableNumberRecord(raw.answers),
        unknownMemberIds: optionalStringArray(raw.unknownMemberIds)
      };
    }
  }

  if (stepId === 'determinacy' && isRecord(raw)) {
    return {
      kind: 'determinacy',
      m: typeof raw.m === 'number' ? raw.m : null,
      r: typeof raw.r === 'number' ? raw.r : null,
      j: typeof raw.j === 'number' ? raw.j : null,
      classification:
        raw.classification === 'statically_determinate' ||
        raw.classification === 'statically_indeterminate' ||
        raw.classification === 'unstable'
          ? raw.classification
          : null
    };
  }
  if (stepId === 'reactions' && isRecord(raw)) return { kind: 'reactions', answers: nullableNumberRecord(raw) };
  if (stepId === 'zero_members' && Array.isArray(raw)) return { kind: 'zero_members', selectedMemberIds: optionalStringArray(raw) };
  if (stepId === 'joint_sequence' && isRecord(raw)) {
    return {
      kind: 'joint_sequence',
      jointId: typeof raw.jointId === 'string' ? raw.jointId : null,
      availableJointIds: [],
      recommendedJointIds: []
    };
  }
  if (stepId === 'member_forces' && isRecord(raw)) {
    const answers = nullableNumberRecord(raw.answers);
    return {
      kind: 'member_forces',
      jointId: typeof raw.jointId === 'string' ? raw.jointId : '',
      answers,
      unknownMemberIds: Object.keys(answers)
    };
  }

  return null;
}

export function normalizeGuidedTelemetry(raw: unknown): GuidedAttemptTelemetry | null {
  if (!isRecord(raw) || !Array.isArray(raw.stepAttempts)) return null;
  if (typeof raw.problemId !== 'string' || typeof raw.startedAt !== 'string') return null;

  const stepAttempts: GuidedStepAttempt[] = [];
  for (const item of raw.stepAttempts) {
    if (!isRecord(item) || typeof item.stepId !== 'string' || !stepIds.has(item.stepId as GuidedStepId)) continue;
    if (item.stepId === 'overview' || item.stepId === 'summary') continue;
    const snapshot = normalizeSnapshot(item.stepId as GuidedStepId, item.answersSnapshot);
    if (!snapshot) continue;
    stepAttempts.push({
      stepId: item.stepId,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : raw.startedAt,
      isCorrect: item.isCorrect === true,
      score: typeof item.score === 'number' ? item.score : 0,
      answersSnapshot: snapshot,
      feedbackMessages: optionalStringArray(item.feedbackMessages),
      misconceptions: optionalStringArray(item.misconceptions),
      hintLevelUsed: typeof item.hintLevelUsed === 'number' ? item.hintLevelUsed : 0,
      attemptNumber: typeof item.attemptNumber === 'number' ? item.attemptNumber : stepAttempts.length + 1
    } as GuidedStepAttempt);
  }

  return {
    problemId: raw.problemId,
    problemVersion: typeof raw.problemVersion === 'number' ? raw.problemVersion : 1,
    topic: typeof raw.topic === 'string' ? raw.topic : 'unknown',
    startedAt: raw.startedAt,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : undefined,
    totalScore: typeof raw.totalScore === 'number' ? raw.totalScore : 0,
    completed: raw.completed === true,
    stepAttempts,
    misconceptionCounts: numberRecord(raw.misconceptionCounts),
    skillBreakdown: numberRecord(raw.skillBreakdown),
    finalAnswers: numberRecord(raw.finalAnswers)
  };
}

export function normalizeAttempt(raw: unknown): Attempt | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.problemId !== 'string' || typeof raw.createdAt !== 'string') return null;

  return {
    id: raw.id,
    problemId: raw.problemId,
    problemVersion: typeof raw.problemVersion === 'number' ? raw.problemVersion : 1,
    createdAt: raw.createdAt,
    answers: numberRecord(raw.answers),
    score: typeof raw.score === 'number' ? raw.score : 0,
    feedback: optionalStringArray(raw.feedback),
    completed: typeof raw.completed === 'boolean' ? raw.completed : typeof raw.score === 'number' && raw.score >= 0.8,
    topic: typeof raw.topic === 'string' ? raw.topic : undefined,
    skillBreakdown: isRecord(raw.skillBreakdown) ? numberRecord(raw.skillBreakdown) : undefined,
    misconceptions: Array.isArray(raw.misconceptions) ? optionalStringArray(raw.misconceptions) : undefined,
    guidedTelemetry: raw.guidedTelemetry ? normalizeGuidedTelemetry(raw.guidedTelemetry) ?? undefined : undefined
  };
}

export function normalizeProgressData(raw: unknown): { data: ProgressData; warnings: string[] } {
  const warnings: string[] = [];
  if (!isRecord(raw)) return { data: { schemaVersion: CURRENT_SCHEMA_VERSION, attempts: [] }, warnings: ['Progress data is not an object.'] };
  if (typeof raw.schemaVersion === 'number' && raw.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { data: { schemaVersion: CURRENT_SCHEMA_VERSION, attempts: [] }, warnings: [`Progress schema v${raw.schemaVersion} is newer than supported v${CURRENT_SCHEMA_VERSION}.`] };
  }
  if (!Array.isArray(raw.attempts)) {
    return { data: { schemaVersion: CURRENT_SCHEMA_VERSION, attempts: [] }, warnings: ['Progress data is missing an attempts array.'] };
  }

  const attempts: Attempt[] = [];
  raw.attempts.forEach((attemptRaw, index) => {
    const attempt = normalizeAttempt(attemptRaw);
    if (attempt) attempts.push(attempt);
    else warnings.push(`Skipped invalid attempt at index ${index}.`);
  });

  return { data: { schemaVersion: CURRENT_SCHEMA_VERSION, attempts }, warnings };
}
