<script lang="ts">
  import { beamProblems } from '../../content/problems/beam-problems';
  import { starterProblems } from '../../content/problems/statics-problems';
  import { trussProblems } from '../../content/problems/truss-problems';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import type { ProgressSummary, Attempt } from '../../lib/domain/progress/types';
  import type { AnyProblem } from '../../lib/services/progressRepository';
  import { computeLearningAnalytics } from '../../lib/domain/progress/analytics';
  import { buildLearningRecommendations, type LearningRecommendationTarget } from '../../lib/domain/progress/recommendations';
  import { routeFromRecommendationTarget } from '../routing/attemptRoutes';
  import type { Route } from '../routing/router';

  // Import Sub-components
  import ProgressHeader from '../components/progress/ProgressHeader.svelte';
  import ProgressStatsGrid from '../components/progress/ProgressStatsGrid.svelte';
  import TopicProgressList from '../components/progress/TopicProgressList.svelte';
  import RecentAttemptsList from '../components/progress/RecentAttemptsList.svelte';
  import MisconceptionSummary from '../components/progress/MisconceptionSummary.svelte';
  import ProgressActions from '../components/progress/ProgressActions.svelte';
  import ProgressExportActions from '../components/progress/ProgressExportActions.svelte';
  import ProgressImportController from '../components/progress/ProgressImportController.svelte';
  import ProgressDiagnosticsCard from '../components/progress/ProgressDiagnosticsCard.svelte';
  import RecommendedNextList from '../components/progress/RecommendedNextList.svelte';

  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();
  const allProblems: AnyProblem[] = [...beamProblems, ...starterProblems, ...trussProblems];

  let summary: ProgressSummary = repo.getSummary(allProblems);
  let recentAttempts: Attempt[] = repo.getAttempts().slice(-10).reverse();
  let allAttempts: Attempt[] = repo.getAttempts();
  let showResetConfirm = false;

  function refreshData() {
    allAttempts = repo.getAttempts();
    summary = repo.getSummary(allProblems);
    recentAttempts = allAttempts.slice(-10).reverse();
  }

  function handleReset() {
    repo.reset();
    showResetConfirm = false;
    refreshData();
  }

  function findNextUnsolved(): AnyProblem | null {
    for (const p of beamProblems) {
      const progress = repo.getProblemProgress(p.id);
      if (!progress.completed) return p;
    }
    for (const p of trussProblems) {
      const progress = repo.getProblemProgress(p.id);
      if (!progress.completed) return p;
    }
    return null;
  }

  function handleContinue() {
    const next = findNextUnsolved();
    if (next) {
      handleStartProblem(next);
    } else {
      onNavigate('dashboard');
    }
  }

  function handleStartProblem(problem: AnyProblem) {
    if (problem.topic === 'trusses') {
      onNavigate('trusses', { problemId: problem.id });
    } else {
      onNavigate(`guided/${problem.id}`);
    }
  }

  function handleRecommendationRoute(targetRoute?: string | LearningRecommendationTarget) {
    const route = routeFromRecommendationTarget(targetRoute);
    if (route) navigateRoute(route);
  }

  function navigateRoute(route: Route) {
    if (route.page === 'dashboard') onNavigate('dashboard');
    else if (route.page === 'progress') onNavigate('progress');
    else if (route.page === 'trusses') onNavigate('trusses', { problemId: route.problemId });
    else if (route.page === 'trusses-guided') onNavigate(`trusses/${route.problemId}/guided`);
    else if (route.page === 'guided') onNavigate(`guided/${route.problemId}`);
    else if (route.page === 'practice') onNavigate('practice', { problemId: route.problemId });
    else if (route.page === 'attempt-review') onNavigate(`progress/attempt/${route.attemptId}`);
    else if (route.page === 'concept') onNavigate(`concept/${route.topicId}`);
  }

  // Reactive calculations for learning analytics
  $: analytics = computeLearningAnalytics(
    allAttempts,
    allProblems,
    (id) => repo.getProblemProgress(id)
  );
  $: recommendations = buildLearningRecommendations({
    attempts: allAttempts,
    allProblems,
    maxItems: 3
  });
</script>

<div class="progress-container animate-fade-in">
  <ProgressHeader />

  <!-- Summary Stats Grid -->
  <ProgressStatsGrid
    totalProblems={summary.totalProblems}
    attemptedProblems={summary.attemptedProblems}
    completedProblems={summary.completedProblems}
    averageBestScore={summary.averageBestScore}
    firstAttemptAccuracy={analytics.totalGuidedAttempts > 0 ? analytics.firstAttemptAccuracy : null}
    totalHintsUsed={analytics.totalHintsUsed}
  />

  <RecommendedNextList {recommendations} onOpen={handleRecommendationRoute} />

  <ProgressExportActions attempts={allAttempts} />

  <ProgressImportController onImported={refreshData} />

  <ProgressDiagnosticsCard {analytics} {allProblems} onStartProblem={handleStartProblem} />

  <!-- Topic Breakdown -->
  <TopicProgressList byTopic={summary.byTopic} />

  <!-- Misconceptions and Skill Proficiency Summary -->
  <MisconceptionSummary attempts={recentAttempts} />

  <!-- Recent Attempts List -->
  <RecentAttemptsList
    {recentAttempts}
    {allProblems}
    {onNavigate}
    {handleContinue}
  />

  <ProgressActions
    {showResetConfirm}
    onContinue={handleContinue}
    onDashboard={() => onNavigate('dashboard')}
    onTriggerReset={() => showResetConfirm = true}
    onConfirmReset={handleReset}
    onCancelReset={() => showResetConfirm = false}
  />
</div>

<style>
  .progress-container {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
