<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { Attempt, GuidedAttemptTelemetry } from '../../../lib/domain/progress/types';

  export let activeProblem: { title: string; titleId?: string };
  export let attempt: Attempt;
  export let telemetry: GuidedAttemptTelemetry | undefined = undefined;
  export let onNavigate: (page: string, params?: any) => void;
  export let onPrint: () => void = () => {};

  function formatTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString($locale === 'id' ? 'id-ID' : 'en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  function getDurationString(start: string, end?: string): string {
    if (!end) return '-';
    try {
      const diffMs = new Date(end).getTime() - new Date(start).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      if (mins > 0) {
        return $locale === 'id' ? `${mins} mnt ${secs} dtk` : `${mins}m ${secs}s`;
      }
      return $locale === 'id' ? `${secs} dtk` : `${secs}s`;
    } catch {
      return '-';
    }
  }
</script>

<header class="review-header">
  <div class="review-actions no-print">
    <button class="btn btn-secondary back-btn" on:click={() => onNavigate('progress')}>
      ◀ {$locale === 'id' ? 'Kembali ke Progress' : 'Back to Progress'}
    </button>
    <button class="btn btn-secondary back-btn" on:click={onPrint}>
      {$locale === 'id' ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}
    </button>
  </div>

  <div class="header-main">
    <div class="header-title">
      <span class="guided-badge">🎓 {$locale === 'id' ? 'Tinjauan Percobaan Terpandu' : 'Guided Attempt Review'}</span>
      <h1>{$locale === 'id' ? activeProblem.titleId || activeProblem.title : activeProblem.title}</h1>
      <p class="timestamp">
        {$locale === 'id' ? 'Diselesaikan pada:' : 'Completed on:'} {formatTime(attempt.createdAt)}
        {#if telemetry}
          | {$locale === 'id' ? 'Durasi:' : 'Duration:'} {getDurationString(telemetry.startedAt, telemetry.completedAt)}
        {/if}
      </p>
    </div>

    <div class="score-card">
      <span class="score-label">{$locale === 'id' ? 'Skor Akhir' : 'Final Score'}</span>
      <span class="score-value">{Math.round(attempt.score * 100)}%</span>
    </div>
  </div>
</header>

<style>
  .review-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1.25rem;
  }

  .back-btn {
    align-self: flex-start;
    font-size: 0.82rem;
    padding: 0.45rem 0.75rem;
  }

  .review-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-title h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0.25rem 0;
    color: var(--text-primary);
  }

  .timestamp {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .guided-badge {
    font-size: 0.7rem;
    background-color: rgba(37, 99, 235, 0.1);
    color: var(--color-primary);
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
    font-weight: 700;
  }

  .score-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .score-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: bold;
    color: var(--text-secondary);
  }

  .score-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--color-success, #10b981);
  }

  @media print {
    .no-print {
      display: none !important;
    }
  }
</style>
