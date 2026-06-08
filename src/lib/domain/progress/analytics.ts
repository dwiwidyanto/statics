import type { Attempt, GuidedAttemptTelemetry } from './types';
import { getFirstAttemptAccuracy, getHintUsageSummary } from './guidedTelemetry';

export interface LearningAnalytics {
  totalGuidedAttempts: number;
  averageScore: number;
  firstAttemptAccuracy: number;
  totalHintsUsed: number;
  averageHintsPerGuidedAttempt: number;
  strongestSkill: string | null;
  weakestSkill: string | null;
  mostFrequentMisconception: string | null;
  skillAverages: Record<string, number>;
  recentTrend: number;
  recommendedProblemId: string | null;
}

export function computeLearningAnalytics(
  attempts: Attempt[],
  allProblems: { id: string; topic: string; learningObjectives?: string[] }[],
  getProblemProgress: (id: string) => { completed: boolean }
): LearningAnalytics {
  const guidedAttempts = attempts
    .filter(a => a.guidedTelemetry !== undefined)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const totalGuidedAttempts = guidedAttempts.length;

  // 1. Average Score
  const averageScore = totalGuidedAttempts > 0
    ? parseFloat((guidedAttempts.reduce((sum, a) => sum + a.score, 0) / totalGuidedAttempts).toFixed(2))
    : 0;

  // 2. First Attempt Accuracy
  const firstAttemptAccuracy = totalGuidedAttempts > 0
    ? parseFloat(
        (
          guidedAttempts.reduce((sum, a) => {
            const telemetry = a.guidedTelemetry;
            return sum + (telemetry ? getFirstAttemptAccuracy(telemetry.stepAttempts) : 0);
          }, 0) / totalGuidedAttempts
        ).toFixed(2)
      )
    : 0;

  // 3. Hints Stats
  let totalHintsUsed = 0;
  for (const a of guidedAttempts) {
    if (a.guidedTelemetry) {
      totalHintsUsed += getHintUsageSummary(a.guidedTelemetry.stepAttempts).totalHintsUsed;
    }
  }
  const averageHintsPerGuidedAttempt = totalGuidedAttempts > 0
    ? parseFloat((totalHintsUsed / totalGuidedAttempts).toFixed(2))
    : 0;

  // 4. Skill Breakdown Averages
  const skillSums: Record<string, number> = {
    determinacy: 0,
    reactions: 0,
    zeroForceMembers: 0,
    jointSelection: 0,
    memberForces: 0
  };
  const skillCounts: Record<string, number> = {
    determinacy: 0,
    reactions: 0,
    zeroForceMembers: 0,
    jointSelection: 0,
    memberForces: 0
  };

  for (const a of attempts) {
    if (a.skillBreakdown) {
      for (const [skill, val] of Object.entries(a.skillBreakdown)) {
        if (skill in skillSums) {
          skillSums[skill] += val;
          skillCounts[skill]++;
        }
      }
    }
  }

  const skillAverages: Record<string, number> = {};
  for (const skill of Object.keys(skillSums)) {
    const count = skillCounts[skill];
    skillAverages[skill] = count > 0 ? parseFloat((skillSums[skill] / count).toFixed(2)) : 0;
  }

  // Strongest / Weakest Skill (Weakest must be < 0.85)
  let strongestSkill: string | null = null;
  let strongestVal = -1;
  let weakestSkill: string | null = null;
  let weakestVal = 2; // starts higher than 1.0

  for (const [skill, avg] of Object.entries(skillAverages)) {
    if (skillCounts[skill] > 0) {
      if (avg > strongestVal) {
        strongestVal = avg;
        strongestSkill = skill;
      }
      if (avg < weakestVal) {
        weakestVal = avg;
        weakestSkill = skill;
      }
    }
  }

  // If weakest average is >= 0.85, we do not flag it as a weak skill
  if (weakestVal >= 0.85) {
    weakestSkill = null;
  }

  // 5. Most Frequent Misconception
  const miscCounts: Record<string, number> = {};
  for (const a of attempts) {
    if (a.misconceptions) {
      for (const misc of a.misconceptions) {
        miscCounts[misc] = (miscCounts[misc] || 0) + 1;
      }
    }
  }

  let mostFrequentMisconception: string | null = null;
  let maxMiscCount = 0;
  for (const [misc, count] of Object.entries(miscCounts)) {
    if (count > maxMiscCount) {
      maxMiscCount = count;
      mostFrequentMisconception = misc;
    }
  }

  // 6. Recent Trend (last 3 vs previous 3)
  let recentTrend = 0;
  if (totalGuidedAttempts >= 6) {
    const last3 = guidedAttempts.slice(-3);
    const prev3 = guidedAttempts.slice(-6, -3);
    const avgLast3 = last3.reduce((sum, a) => sum + a.score, 0) / 3;
    const avgPrev3 = prev3.reduce((sum, a) => sum + a.score, 0) / 3;
    recentTrend = parseFloat((avgLast3 - avgPrev3).toFixed(2));
  }

  // 7. Recommended Next Problem
  let recommendedProblemId: string | null = null;

  if (weakestSkill) {
    // If ZFM is weak, recommend an unsolved ZFM-heavy problem (e.g. truss-king-post, truss-unloaded-joint)
    if (weakestSkill === 'zeroForceMembers') {
      const zfmProblem = allProblems.find(
        p => p.topic === 'trusses' &&
             (p.id === 'truss-king-post' || p.id === 'truss-unloaded-joint') &&
             !getProblemProgress(p.id).completed
      );
      if (zfmProblem) recommendedProblemId = zfmProblem.id;
    }

    // If jointSelection or memberForces are weak, recommend any unsolved truss problem
    if (!recommendedProblemId && (weakestSkill === 'jointSelection' || weakestSkill === 'memberForces')) {
      const trussProblem = allProblems.find(p => p.topic === 'trusses' && !getProblemProgress(p.id).completed);
      if (trussProblem) recommendedProblemId = trussProblem.id;
    }

    // If determinacy or reactions is weak, recommend any unsolved problem
    if (!recommendedProblemId && (weakestSkill === 'determinacy' || weakestSkill === 'reactions')) {
      const anyUnsolved = allProblems.find(p => !getProblemProgress(p.id).completed);
      if (anyUnsolved) recommendedProblemId = anyUnsolved.id;
    }
  }

  // Fallback: recommend the first unsolved problem in the workspace
  if (!recommendedProblemId) {
    const firstUnsolved = allProblems.find(p => !getProblemProgress(p.id).completed);
    if (firstUnsolved) {
      recommendedProblemId = firstUnsolved.id;
    }
  }

  return {
    totalGuidedAttempts,
    averageScore,
    firstAttemptAccuracy,
    totalHintsUsed,
    averageHintsPerGuidedAttempt,
    strongestSkill,
    weakestSkill,
    mostFrequentMisconception,
    skillAverages,
    recentTrend,
    recommendedProblemId
  };
}
