<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';

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
  <div class="stat-card">
    <span class="stat-value">{totalProblems}</span>
    <span class="stat-label">{$locale === 'id' ? 'Total Soal' : 'Total Problems'}</span>
  </div>
  <div class="stat-card">
    <span class="stat-value">{attemptedProblems}</span>
    <span class="stat-label">{$locale === 'id' ? 'Sudah Dicoba' : 'Attempted'}</span>
  </div>
  <div class="stat-card">
    <span class="stat-value">{completedProblems}</span>
    <span class="stat-label">{$locale === 'id' ? 'Selesai' : 'Completed'}</span>
  </div>
  <div class="stat-card">
    <span class="stat-value">{formatScore(averageBestScore)}</span>
    <span class="stat-label">{$locale === 'id' ? 'Rata-Rata Skor' : 'Avg. Best Score'}</span>
  </div>
  {#if firstAttemptAccuracy !== null}
    <div class="stat-card premium-card">
      <span class="stat-value">{formatScore(firstAttemptAccuracy)}</span>
      <span class="stat-label">{$locale === 'id' ? 'Akurasi Percobaan Pertama' : '1st Attempt Accuracy'}</span>
    </div>
  {/if}
  <div class="stat-card hint-card">
    <span class="stat-value">{totalHintsUsed}</span>
    <span class="stat-label">{$locale === 'id' ? 'Petunjuk Digunakan' : 'Hints Used'}</span>
  </div>
</div>

<style>
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    width: 100%;
  }

  .stat-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    transition: transform 0.2s, box-shadow 0.2s;
    text-align: center;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .premium-card {
    border-color: #3b82f6;
    background: linear-gradient(135deg, var(--bg-secondary), rgba(59, 130, 246, 0.05));
  }

  .hint-card {
    border-color: #f59e0b;
    background: linear-gradient(135deg, var(--bg-secondary), rgba(245, 158, 11, 0.05));
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
