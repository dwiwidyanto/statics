<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import { trussProblems } from '../../content/problems/truss-problems';
  import { solveTruss } from '../../lib/domain/truss/solver';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import { getFirstAttemptAccuracy, getHintUsageSummary } from '../../lib/domain/progress/guidedTelemetry';
  import { reconstructTrussReplayState, emptyTrussReplayState } from '../../lib/domain/progress/attemptReplay';
  import { buildAttemptReviewModel } from '../../lib/domain/progress/attemptReviewModel';
  import type { Attempt } from '../../lib/domain/progress/types';

  // Import Sub-components
  import AttemptReviewHeader from '../components/attempt-review/AttemptReviewHeader.svelte';
  import LearningTelemetryPanel from '../components/attempt-review/LearningTelemetryPanel.svelte';
  import MisconceptionDetailPanel from '../components/attempt-review/MisconceptionDetailPanel.svelte';
  import SkillBreakdownPanel from '../components/attempt-review/SkillBreakdownPanel.svelte';
  import AttemptTimeline from '../components/attempt-review/AttemptTimeline.svelte';
  import AttemptCanvasReplay from '../components/attempt-review/AttemptCanvasReplay.svelte';
  import StepAttemptDetails from '../components/attempt-review/StepAttemptDetails.svelte';

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
</script>

<div class="review-page-container animate-fade-in">
  {#if attempt && activeProblem}
    <AttemptReviewHeader
      {activeProblem}
      {attempt}
      {telemetry}
      {onNavigate}
    />
  {/if}

  {#if !attempt}
    <div class="empty-state">
      <p>{$locale === 'id' ? 'Percobaan tidak ditemukan.' : 'Attempt not found.'}</p>
    </div>
  {:else if reviewModel.mode === 'missing_problem'}
    <div class="empty-state">
      <p>
        {$locale === 'id'
          ? `Model rangka batang untuk percobaan ini tidak ditemukan: ${reviewModel.problemId}.`
          : `The truss model for this attempt could not be found: ${reviewModel.problemId}.`}
      </p>
    </div>
  {:else if reviewModel.mode === 'summary_only'}
    <div class="empty-state">
      <p>
        {#if reviewModel.reason === 'unsupported_topic'}
          {$locale === 'id'
            ? 'Ringkasan tinjauan tersedia, tetapi replay visual untuk topik ini belum didukung.'
            : 'Review summary is available, but visual replay for this topic is not supported yet.'}
        {:else}
          {$locale === 'id'
            ? 'Data replay visual tidak tersedia untuk percobaan ini.'
            : 'Visual replay data is not available for this attempt.'}
        {/if}
      </p>
      <p>{$locale === 'id' ? `Skor tersimpan: ${Math.round(attempt.score * 100)}%` : `Stored score: ${Math.round(attempt.score * 100)}%`}</p>
    </div>
  {:else if !telemetry || !activeProblem || !solverResult}
    <div class="empty-state">
      <p>{$locale === 'id' ? 'Data tinjauan langkah demi langkah tidak tersedia untuk percobaan ini.' : 'Step-by-step review telemetry is not available for this attempt.'}</p>
    </div>
  {:else}
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

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
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
</style>
