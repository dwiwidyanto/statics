<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import { beamProblems } from '../../content/problems/beam-problems';
  import { starterProblems } from '../../content/problems/statics-problems';
  import { trussProblems } from '../../content/problems/truss-problems';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import type { ProgressSummary, Attempt } from '../../lib/domain/progress/types';
  import type { AnyProblem } from '../../lib/services/progressRepository';
  import { getFirstAttemptAccuracy, getHintUsageSummary } from '../../lib/domain/progress/guidedTelemetry';

  // Import Sub-components
  import ProgressStatsGrid from '../components/progress/ProgressStatsGrid.svelte';
  import TopicProgressList from '../components/progress/TopicProgressList.svelte';
  import RecentAttemptsList from '../components/progress/RecentAttemptsList.svelte';
  import MisconceptionSummary from '../components/progress/MisconceptionSummary.svelte';

  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();
  const allProblems: AnyProblem[] = [...beamProblems, ...starterProblems, ...trussProblems];

  let summary: ProgressSummary = repo.getSummary(allProblems);
  let recentAttempts: Attempt[] = repo.getAttempts().slice(-10).reverse();
  let showResetConfirm = false;

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
      if (next.topic === 'trusses') {
        onNavigate('trusses', { problemId: next.id });
      } else {
        onNavigate(`guided/${next.id}`);
      }
    } else {
      onNavigate('dashboard');
    }
  }

  // Reactive calculations for guided learning telemetry aggregates
  $: firstAttemptAccuracy = (() => {
    const attemptsWithTelemetry = repo.getAttempts().filter(a => a.guidedTelemetry !== undefined && a.guidedTelemetry.stepAttempts.length > 0);
    if (attemptsWithTelemetry.length === 0) return null;
    const sum = attemptsWithTelemetry.reduce((acc, a) => acc + getFirstAttemptAccuracy(a.guidedTelemetry!.stepAttempts), 0);
    return sum / attemptsWithTelemetry.length;
  })();

  $: totalHintsUsed = (() => {
    const attemptsWithTelemetry = repo.getAttempts().filter(a => a.guidedTelemetry !== undefined);
    return attemptsWithTelemetry.reduce((acc, a) => acc + getHintUsageSummary(a.guidedTelemetry!.stepAttempts).totalHintsUsed, 0);
  })();
</script>

<div class="progress-container animate-fade-in">
  <header class="progress-header">
    <div class="header-text">
      <span class="subheading">{$locale === 'id' ? 'Pelacakan Kemajuan' : 'Progress Tracking'}</span>
      <h1>{$locale === 'id' ? 'Progres Belajar Anda' : 'Your Learning Progress'}</h1>
      <p class="description">
        {$locale === 'id' 
          ? 'Pantau kemajuan Anda dalam menyelesaikan soal-soal statika. Data disimpan secara lokal di browser Anda.'
          : 'Track your progress through the statics problem sets. Data is stored locally in your browser.'}
      </p>
    </div>
  </header>

  <!-- Summary Stats Grid -->
  <ProgressStatsGrid
    totalProblems={summary.totalProblems}
    attemptedProblems={summary.attemptedProblems}
    completedProblems={summary.completedProblems}
    averageBestScore={summary.averageBestScore}
    {firstAttemptAccuracy}
    {totalHintsUsed}
  />

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

  <!-- Actions -->
  <div class="actions-row">
    <button class="btn btn-primary" on:click={handleContinue}>
      {$locale === 'id' ? 'Lanjutkan Soal Berikutnya' : 'Continue Next Problem'}
    </button>
    <button class="btn btn-secondary" on:click={() => onNavigate('dashboard')}>
      {$locale === 'id' ? 'Lihat Soal Selesai' : 'Review Completed'}
    </button>
    {#if !showResetConfirm}
      <button class="btn btn-danger" on:click={() => showResetConfirm = true}>
        {$locale === 'id' ? 'Reset Progres' : 'Reset Progress'}
      </button>
    {:else}
      <div class="reset-confirm">
        <span>{$locale === 'id' ? 'Yakin ingin menghapus semua progres?' : 'Are you sure? This will erase all progress.'}</span>
        <button class="btn btn-danger" on:click={handleReset}>
          {$locale === 'id' ? 'Ya, Hapus' : 'Yes, Reset'}
        </button>
        <button class="btn btn-secondary" on:click={() => showResetConfirm = false}>
          {$locale === 'id' ? 'Batal' : 'Cancel'}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .progress-container {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .progress-header {
    background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
    color: white;
    padding: 2rem 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  :global(html.dark) .progress-header {
    background: linear-gradient(135deg, #115e59 0%, #042f2e 100%);
    border: 1px solid var(--border-color);
  }

  .subheading {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #99f6e4;
  }

  .progress-header h1 {
    color: white;
    font-size: 2rem;
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .description {
    color: #ccfbf1;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .actions-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .btn-danger {
    background-color: #ef4444;
    color: white;
    border: none;
    padding: 0.55rem 1.1rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .btn-danger:hover {
    background-color: #dc2626;
  }

  .reset-confirm {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--color-error);
    font-weight: 600;
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
