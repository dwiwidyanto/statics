<script lang="ts">
  import { beamProblems } from '../../content/problems/beam-problems';
  import { starterProblems } from '../../content/problems/statics-problems';
  import { trussProblems } from '../../content/problems/truss-problems';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import type { ProgressSummary, Attempt } from '../../lib/domain/progress/types';
  import type { AnyProblem } from '../../lib/services/progressRepository';
  import { computeLearningAnalytics } from '../../lib/domain/progress/analytics';
  import { serializeProgressData } from '../../lib/services/progressExport';
  import { serializeAttemptsCsv } from '../../lib/services/progressCsvExport';
  import { createProgressImportPlan, type ProgressImportMode, type ProgressImportPlan } from '../../lib/services/progressImportPlan';
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
  import ProgressImportModal from '../components/progress/ProgressImportModal.svelte';
  import ProgressImportResultBanner from '../components/progress/ProgressImportResultBanner.svelte';
  import ProgressDiagnosticsCard from '../components/progress/ProgressDiagnosticsCard.svelte';
  import RecommendedNextList from '../components/progress/RecommendedNextList.svelte';

  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();
  const allProblems: AnyProblem[] = [...beamProblems, ...starterProblems, ...trussProblems];

  let summary: ProgressSummary = repo.getSummary(allProblems);
  let recentAttempts: Attempt[] = repo.getAttempts().slice(-10).reverse();
  let showResetConfirm = false;

  // File import state
  let importPlan: ProgressImportPlan | null = null;
  let importingPayload: unknown = null;
  let importError: string | null = null;
  let importResult: {
    mode: ProgressImportMode;
    schemaVersion: number;
    validAttempts: number;
    importedAttempts: number;
    replacedAttempts: number;
    duplicateAttempts: number;
    internalDuplicateAttempts: number;
    skippedInvalidAttempts: number;
    warnings: string[];
  } | null = null;

  function refreshData() {
    summary = repo.getSummary(allProblems);
    recentAttempts = repo.getAttempts().slice(-10).reverse();
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
    repo.getAttempts(),
    allProblems,
    (id) => repo.getProblemProgress(id)
  );
  $: recommendations = buildLearningRecommendations({
    attempts: repo.getAttempts(),
    allProblems,
    maxItems: 3
  });

  // Import / Export Logic
  function handleExport() {
    const dataStr = serializeProgressData(repo.exportProgress().attempts);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'staticslab_progress.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  function handleInstructorCsvExport() {
    const dataStr = serializeAttemptsCsv(repo.getAttempts());
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'staticslab_instructor_attempts.csv');
    linkElement.click();
  }

  function clearPendingImport() {
    importError = null;
    importPlan = null;
    importingPayload = null;
  }

  function handleFileImport(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        importPlan = createProgressImportPlan(parsed, repo.getAttempts());
        importingPayload = parsed;
        importResult = null;
        importError = null;
      } catch {
        importError = 'Failed to parse JSON text. File may be corrupted.';
        importPlan = null;
        importingPayload = null;
      }
    };
    reader.onerror = () => {
      importError = 'Failed to read import file.';
      importPlan = null;
      importingPayload = null;
    };
    reader.readAsText(file);
    target.value = '';
  }

  function handleConfirmMerge() {
    if (!importingPayload || !importPlan) return;
    const result = repo.importProgress(importingPayload, 'merge');
    importResult = {
      mode: 'merge',
      schemaVersion: result.schemaVersion,
      validAttempts: result.validAttempts,
      importedAttempts: result.importedAttempts,
      replacedAttempts: result.replacedAttempts,
      duplicateAttempts: result.duplicateAttempts,
      internalDuplicateAttempts: result.internalDuplicateAttempts,
      skippedInvalidAttempts: importPlan.skippedInvalidCount,
      warnings: result.warnings
    };
    importPlan = null;
    importingPayload = null;
    refreshData();
  }

  function handleConfirmReplace(allowDangerousEmptyReplace = false) {
    if (!importingPayload || !importPlan) return;
    const result = repo.importProgress(importingPayload, 'replace', { allowDangerousEmptyReplace });
    importResult = {
      mode: 'replace',
      schemaVersion: result.schemaVersion,
      validAttempts: result.validAttempts,
      importedAttempts: result.importedAttempts,
      replacedAttempts: result.replacedAttempts,
      duplicateAttempts: result.duplicateAttempts,
      internalDuplicateAttempts: result.internalDuplicateAttempts,
      skippedInvalidAttempts: importPlan.skippedInvalidCount,
      warnings: result.warnings
    };
    importPlan = null;
    importingPayload = null;
    refreshData();
  }
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

  <!-- Import Error Toast -->
  {#if importError}
    <div class="import-error-banner" role="alert">
      <span>⚠️ {importError}</span>
      <button class="btn-close" on:click={() => importError = null}>×</button>
    </div>
  {/if}

  {#if importResult}
    <ProgressImportResultBanner
      mode={importResult.mode}
      schemaVersion={importResult.schemaVersion}
      validAttempts={importResult.validAttempts}
      importedAttempts={importResult.importedAttempts}
      replacedAttempts={importResult.replacedAttempts}
      duplicateAttempts={importResult.duplicateAttempts}
      internalDuplicateAttempts={importResult.internalDuplicateAttempts}
      skippedInvalidAttempts={importResult.skippedInvalidAttempts}
      warnings={importResult.warnings}
    />
  {/if}

  {#if importPlan}
    <ProgressImportModal
      plan={importPlan}
      onMerge={handleConfirmMerge}
      onReplace={() => handleConfirmReplace(false)}
      onDangerousEmptyReplace={() => handleConfirmReplace(true)}
      onCancel={clearPendingImport}
    />
  {/if}

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
    onExportJson={handleExport}
    onExportCsv={handleInstructorCsvExport}
    onImportFile={handleFileImport}
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

  .import-error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #ef4444;
    opacity: 0.7;
    padding: 0 0.5rem;
  }

  .btn-close:hover {
    opacity: 1;
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
