<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import MetricCard from '../../../lib/ui/MetricCard.svelte';

  export let totalProblems: number;
  export let attemptedProblems: number;
  export let completedProblems: number;
  export let averageBestScore: number;
  export let firstAttemptAccuracy: number | null = null;
  export let totalHintsUsed: number = 0;

  function formatScore(score: number): string {
    return `${Math.round(score * 100)}%`;
  }
</script>

<div class="stats-grid">
  <MetricCard value={totalProblems} label={$locale === 'id' ? 'Total Soal' : 'Total Problems'} />
  <MetricCard value={attemptedProblems} label={$locale === 'id' ? 'Sudah Dicoba' : 'Attempted'} />
  <MetricCard value={completedProblems} label={$locale === 'id' ? 'Selesai' : 'Completed'} tone="success" />
  <MetricCard value={formatScore(averageBestScore)} label={$locale === 'id' ? 'Rata-Rata Skor' : 'Avg. Best Score'} />
  {#if firstAttemptAccuracy !== null}
    <MetricCard value={formatScore(firstAttemptAccuracy)} label={$locale === 'id' ? 'Akurasi Percobaan Pertama' : '1st Attempt Accuracy'} tone="info" />
  {/if}
  <MetricCard value={totalHintsUsed} label={$locale === 'id' ? 'Petunjuk Digunakan' : 'Hints Used'} tone="warning" />
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    width: 100%;
  }
</style>
