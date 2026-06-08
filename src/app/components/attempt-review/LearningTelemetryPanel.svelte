<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';

  export let firstAttemptAccuracy: number;
  export let totalHintsUsed: number;
  export let maxHintLevel: number;
</script>

<div class="card panel-card">
  <h3>{$locale === 'id' ? 'Metrik Pembelajaran' : 'Learning Telemetry'}</h3>
  <div class="metrics-list">
    <div class="metric-item">
      <span class="metric-label">{$locale === 'id' ? 'Akurasi Percobaan Pertama' : 'First-Attempt Accuracy'}</span>
      <span class="metric-value">{Math.round(firstAttemptAccuracy * 100)}%</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">{$locale === 'id' ? 'Total Petunjuk Digunakan' : 'Total Hints Used'}</span>
      <span class="metric-value">{totalHintsUsed}</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">{$locale === 'id' ? 'Level Petunjuk Maksimum' : 'Max Hint Level'}</span>
      <span class="metric-value">{maxHintLevel} / 3</span>
    </div>
  </div>
</div>

<style>
  .card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .panel-card {
    margin-bottom: 1.25rem;
  }

  .panel-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .metrics-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
  }

  .metric-label {
    color: var(--text-secondary);
  }

  .metric-value {
    font-weight: bold;
    color: var(--text-primary);
  }
</style>
