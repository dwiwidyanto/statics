<script lang="ts">
  import { trussProblems } from '../../content/problems/truss-problems';
  import { solveTruss } from '../../lib/domain/truss/solver';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import { locale } from '../../lib/utils/i18n';
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
  import AttemptReviewEmptyState from '../components/attempt-review/AttemptReviewEmptyState.svelte';

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

  function handlePrintReport() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  function formatScore(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function recordEntries(record: Record<string, number> | undefined): Array<[string, number]> {
    return Object.entries(record ?? {});
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
    <section class="print-report">
      <h2>{$locale === 'id' ? 'Laporan Percobaan Siswa' : 'Student Attempt Report'}</h2>
      <dl>
        <div><dt>{$locale === 'id' ? 'Soal' : 'Problem'}</dt><dd>{$locale === 'id' ? activeProblem.titleId || activeProblem.title : activeProblem.title}</dd></div>
        <div><dt>Topic</dt><dd>{attempt.topic ?? telemetry.topic}</dd></div>
        <div><dt>Score</dt><dd>{formatScore(attempt.score)}</dd></div>
        <div><dt>Status</dt><dd>{attempt.completed ? ($locale === 'id' ? 'Selesai' : 'Completed') : ($locale === 'id' ? 'Belum selesai' : 'Incomplete')}</dd></div>
        <div><dt>{$locale === 'id' ? 'Tanggal' : 'Created'}</dt><dd>{attempt.createdAt}</dd></div>
        <div><dt>{$locale === 'id' ? 'Petunjuk' : 'Hints'}</dt><dd>{hintSummary.totalHintsUsed}</dd></div>
      </dl>
      <h3>{$locale === 'id' ? 'Keterampilan' : 'Skill Breakdown'}</h3>
      <ul>
        {#each Object.entries(attempt.skillBreakdown ?? telemetry.skillBreakdown ?? {}) as [skill, value]}
          <li>{skill}: {formatScore(value)}</li>
        {/each}
      </ul>
      <h3>{$locale === 'id' ? 'Miskonsepsi' : 'Misconceptions'}</h3>
      <p>{(attempt.misconceptions ?? []).join(', ') || '-'}</p>
      <h3>{$locale === 'id' ? 'Jawaban Akhir' : 'Final Answers'}</h3>
      <ul>
        {#each recordEntries(telemetry.finalAnswers ?? attempt.answers) as [key, value]}
          <li>{key}: {value}</li>
        {/each}
      </ul>
      <h3>{$locale === 'id' ? 'Umpan Balik' : 'Feedback'}</h3>
      <ul>
        {#each attempt.feedback as message}
          <li>{message}</li>
        {/each}
      </ul>
    </section>
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

  .print-report {
    display: none;
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

    .print-report {
      display: block;
      border: 1px solid #d1d5db;
      padding: 1rem;
      color: #111827;
    }

    .print-report h2,
    .print-report h3 {
      color: #111827;
      margin-top: 0.75rem;
    }

    .print-report dl {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.35rem 1rem;
      margin: 0.5rem 0 1rem;
    }

    .print-report div {
      break-inside: avoid;
    }

    .print-report dt {
      font-weight: 700;
    }

    .print-report dd {
      margin: 0;
    }
  }
</style>
