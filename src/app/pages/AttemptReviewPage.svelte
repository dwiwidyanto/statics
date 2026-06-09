<script lang="ts">
  import { trussProblems } from '../../content/problems/truss-problems';
  import { solveTruss } from '../../lib/domain/truss/solver';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import { getFirstAttemptAccuracy, getHintUsageSummary } from '../../lib/domain/progress/guidedTelemetry';
  import { reconstructTrussReplayState, emptyTrussReplayState } from '../../lib/domain/progress/attemptReplay';
  import { buildAttemptReviewModel } from '../../lib/domain/progress/attemptReviewModel';
  import { buildClassroomReport } from '../../lib/domain/progress/classroomReport';
  import type { Attempt } from '../../lib/domain/progress/types';

  // Import Sub-components
  import AttemptReviewHeader from '../components/attempt-review/AttemptReviewHeader.svelte';
  import LearningTelemetryPanel from '../components/attempt-review/LearningTelemetryPanel.svelte';
  import MisconceptionDetailPanel from '../components/attempt-review/MisconceptionDetailPanel.svelte';
  import SkillBreakdownPanel from '../components/attempt-review/SkillBreakdownPanel.svelte';
  import AttemptTimeline from '../components/attempt-review/AttemptTimeline.svelte';
  import AttemptCanvasReplay from '../components/attempt-review/AttemptCanvasReplay.svelte';
  import StepAttemptDetails from '../components/attempt-review/StepAttemptDetails.svelte';
  import AttemptReviewEmptyState from '../components/attempt-review/AttemptReviewEmptyState.svelte';
  import ReportExportActions from '../components/attempt-review/ReportExportActions.svelte';
  import ClassroomReportPrintView from '../components/attempt-review/ClassroomReportPrintView.svelte';

  export let attemptId: string;
  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();

  // Load active attempt
  $: reviewModel = buildAttemptReviewModel({ attemptId, attempts: repo.getAttempts(), trussProblems });
  $: attempt = reviewModel.mode === 'not_found' ? undefined : reviewModel.attempt as Attempt | undefined;
  $: telemetry = reviewModel.mode === 'truss_replay' || reviewModel.mode === 'missing_problem' || reviewModel.mode === 'summary_only'
    ? reviewModel.telemetry
    : undefined;

  // Resolve the active problem and solver reference
  $: activeProblem = reviewModel.mode === 'truss_replay' ? reviewModel.problem : null;
  $: solverResult = activeProblem ? solveTruss(activeProblem) : null;
  $: referenceZeroForceIds = solverResult?.zeroForceMembers ?? [];
  $: classroomReport = attempt
    ? buildClassroomReport({
        attempt,
        problem: activeProblem
          ? {
              id: activeProblem.id,
              title: activeProblem.title,
              titleId: activeProblem.titleId,
              topic: activeProblem.topic,
              difficulty: activeProblem.difficulty,
            }
          : undefined,
        telemetry,
        solverResult,
      })
    : null;

  // Timeline scrubbing state
  let selectedAttemptIdx = 0;

  // Reset selected index if telemetry changes
  $: if (telemetry) {
    selectedAttemptIdx = telemetry.stepAttempts.length - 1;
  }

  $: reconstructedState = telemetry && activeProblem && solverResult
    ? reconstructTrussReplayState({ telemetry, selectedAttemptIdx, problem: activeProblem, solverResult })
    : emptyTrussReplayState();

  // Derived aggregates
  $: firstAttemptAccuracy = telemetry ? getFirstAttemptAccuracy(telemetry.stepAttempts) : 0;
  $: hintSummary = telemetry ? getHintUsageSummary(telemetry.stepAttempts) : { totalHintsUsed: 0, maxHintLevel: 0, hintsByStep: {} };

  function handlePrintReport() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
</script>

<div class="review-page-container animate-fade-in">
  {#if attempt && activeProblem}
    <AttemptReviewHeader
      {activeProblem}
      {attempt}
      {telemetry}
      {onNavigate}
      onPrint={handlePrintReport}
    />
  {/if}

  {#if !attempt || reviewModel.mode === 'missing_problem' || reviewModel.mode === 'summary_only'}
    <AttemptReviewEmptyState {reviewModel} {onNavigate} />
  {:else if !telemetry || !activeProblem || !solverResult}
    <AttemptReviewEmptyState
      reviewModel={{ mode: 'summary_only', attempt, reason: 'no_guided_telemetry' }}
      {onNavigate}
    />
  {:else}
    {#if classroomReport}
      <ReportExportActions report={classroomReport} onPrint={handlePrintReport} />
      <ClassroomReportPrintView report={classroomReport} />
    {/if}
    <div class="review-grid">
      <!-- Left Column: Metrics & Misconceptions Sidebar -->
      <aside class="sidebar-panel">
        <LearningTelemetryPanel
          {firstAttemptAccuracy}
          totalHintsUsed={hintSummary.totalHintsUsed}
          maxHintLevel={hintSummary.maxHintLevel}
        />

        <MisconceptionDetailPanel misconceptions={attempt.misconceptions || []} />

        <SkillBreakdownPanel skillBreakdown={attempt.skillBreakdown} />
      </aside>

      <!-- Right Column: Interactive Timeline & Canvas -->
      <main class="main-content-panel">
        <AttemptCanvasReplay
          {activeProblem}
          stepAttempt={telemetry.stepAttempts[selectedAttemptIdx]}
          {reconstructedState}
        />

        <AttemptTimeline
          stepAttempts={telemetry.stepAttempts}
          bind:selectedAttemptIdx={selectedAttemptIdx}
        />

        {#if telemetry.stepAttempts[selectedAttemptIdx]}
          {#key selectedAttemptIdx}
            <StepAttemptDetails
              selectedAttempt={telemetry.stepAttempts[selectedAttemptIdx]}
              {activeProblem}
              solverResult={solverResult}
              {referenceZeroForceIds}
            />
          {/key}
        {/if}
      </main>
    </div>
  {/if}
</div>

<style>
  .review-page-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .review-grid {
    display: grid;
    grid-template-columns: 1fr 2.2fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .review-grid {
      grid-template-columns: 1fr;
    }
  }

  .main-content-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

  @media print {
    .review-page-container {
      max-width: none;
      gap: 1rem;
    }

    .review-grid {
      display: none;
    }

  }
</style>
