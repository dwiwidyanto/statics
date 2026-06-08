import type { AnyProblem } from '../../services/progressRepository';
import type { Attempt, MisconceptionCode } from './types';
import { getMisconceptionDefinition } from '../learning/misconceptions';

export interface LearningRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: 'review_misconception' | 'retry_problem' | 'continue_topic' | 'advance_topic';
  title: {
    en: string;
    id: string;
  };
  description: {
    en: string;
    id: string;
  };
  targetRoute?: string;
  relatedProblemId?: string;
  relatedMisconception?: MisconceptionCode;
}

function problemRoute(problem: AnyProblem): string {
  return problem.topic === 'trusses' ? `trusses:${problem.id}` : `guided/${problem.id}`;
}

export function buildLearningRecommendations(args: {
  attempts: Attempt[];
  allProblems: AnyProblem[];
  maxItems?: number;
}): LearningRecommendation[] {
  const maxItems = args.maxItems ?? 3;
  const recommendations: LearningRecommendation[] = [];
  const attempts = [...args.attempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (attempts.length === 0) {
    const firstProblem = args.allProblems[0];
    return [{
      priority: 'medium',
      type: 'continue_topic',
      title: { en: 'Start with the first guided problem', id: 'Mulai dari soal terpandu pertama' },
      description: {
        en: 'Begin with a guided attempt so your progress and misconceptions can be tracked locally.',
        id: 'Mulai dengan percobaan terpandu agar progres dan miskonsepsi dapat dilacak secara lokal.'
      },
      targetRoute: firstProblem ? problemRoute(firstProblem) : undefined,
      relatedProblemId: firstProblem?.id
    }];
  }

  const misconceptionCounts: Record<string, number> = {};
  for (const attempt of attempts) {
    for (const code of attempt.misconceptions ?? []) {
      misconceptionCounts[code] = (misconceptionCounts[code] ?? 0) + 1;
    }
  }
  const repeatedMisconception = Object.entries(misconceptionCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const misconception = repeatedMisconception ? getMisconceptionDefinition(repeatedMisconception) : null;
  if (misconception) {
    recommendations.push({
      priority: 'high',
      type: 'review_misconception',
      title: misconception.title,
      description: misconception.remediation,
      relatedMisconception: misconception.code
    });
  }

  const retryAttempt = attempts.find(attempt => attempt.guidedTelemetry && attempt.score < 0.8);
  if (retryAttempt) {
    const problem = args.allProblems.find(p => p.id === retryAttempt.problemId);
    recommendations.push({
      priority: 'high',
      type: 'retry_problem',
      title: { en: 'Retry a guided problem', id: 'Ulangi soal terpandu' },
      description: {
        en: 'A recent guided attempt was below readiness level. Try it again after reviewing the feedback.',
        id: 'Percobaan terpandu terakhir masih di bawah tingkat siap. Coba lagi setelah meninjau umpan balik.'
      },
      targetRoute: problem ? problemRoute(problem) : undefined,
      relatedProblemId: retryAttempt.problemId
    });
  }

  const completedProblemIds = new Set(attempts.filter(a => a.completed || a.score >= 0.8).map(a => a.problemId));
  const nextProblem = args.allProblems.find(problem => !completedProblemIds.has(problem.id));
  if (nextProblem) {
    recommendations.push({
      priority: 'medium',
      type: 'continue_topic',
      title: { en: 'Continue the next topic item', id: 'Lanjutkan materi berikutnya' },
      description: {
        en: 'Keep building breadth by completing the next unfinished local problem.',
        id: 'Bangun cakupan belajar dengan menyelesaikan soal lokal berikutnya yang belum selesai.'
      },
      targetRoute: problemRoute(nextProblem),
      relatedProblemId: nextProblem.id
    });
  }

  const basicsTopics = new Set(['equilibrium', 'beam-internal-forces', 'trusses']);
  const basicsProblems = args.allProblems.filter(problem => basicsTopics.has(problem.topic));
  const completedBasics = basicsProblems.filter(problem => completedProblemIds.has(problem.id));
  const strongBasics = basicsProblems.length > 0 && completedBasics.length / basicsProblems.length >= 0.7 && attempts.slice(0, 5).every(a => a.score >= 0.8);
  if (strongBasics) {
    recommendations.push({
      priority: 'low',
      type: 'advance_topic',
      title: { en: 'Ready for future advanced topics', id: 'Siap untuk topik lanjutan berikutnya' },
      description: {
        en: 'Your beam and truss basics look strong enough for the next stage when advanced modules arrive.',
        id: 'Dasar balok dan rangka batang Anda cukup kuat untuk tahap berikutnya saat modul lanjutan tersedia.'
      }
    });
  }

  return recommendations.slice(0, maxItems);
}
