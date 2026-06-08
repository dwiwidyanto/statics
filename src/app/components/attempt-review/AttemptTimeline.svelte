<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { GuidedStepId } from '../../../lib/domain/progress/types';

  export let stepAttempts: any[] = [];
  export let selectedAttemptIdx: number;

  const stepLabels: Record<GuidedStepId, { en: string; id: string }> = {
    overview: { en: 'Overview', id: 'Tinjauan' },
    determinacy: { en: 'Determinacy', id: 'Determinasi' },
    reactions: { en: 'Reactions', id: 'Reaksi Tumpuan' },
    zero_members: { en: 'Zero-Force Members', id: 'Batang Gaya Nol' },
    joint_sequence: { en: 'Joint Selection', id: 'Pemilihan Titik Hubung' },
    member_forces: { en: 'Member Forces', id: 'Gaya Batang' },
    summary: { en: 'Summary', id: 'Ringkasan' }
  };
</script>

<div class="timeline-card card">
  <h3>{$locale === 'id' ? 'Riwayat Langkah demi Langkah' : 'Step-by-Step History Timeline'}</h3>

  <div class="timeline-container">
    <div class="timeline-scroller">
      {#each stepAttempts as stepAttempt, idx}
        {@const isSelected = selectedAttemptIdx === idx}
        <button
          type="button"
          class="timeline-node {isSelected ? 'selected' : ''} {stepAttempt.isCorrect ? 'correct' : 'incorrect'}"
          on:click={() => selectedAttemptIdx = idx}
        >
          <div class="node-icon">
            {stepAttempt.isCorrect ? '✓' : '✗'}
          </div>
          <div class="node-info">
            <span class="node-step">
              {$locale === 'id' ? stepLabels[stepAttempt.stepId as GuidedStepId].id : stepLabels[stepAttempt.stepId as GuidedStepId].en}
            </span>
            <span class="node-attempt">
              {$locale === 'id' ? `Percobaan #${stepAttempt.attemptNumber}` : `Attempt #${stepAttempt.attemptNumber}`}
            </span>
          </div>
        </button>
      {/each}
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

  .timeline-card h3 {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    font-weight: bold;
    color: var(--text-primary);
  }

  .timeline-container {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .timeline-scroller {
    display: flex;
    gap: 1rem;
    min-width: max-content;
    padding: 0.25rem;
  }

  .timeline-node {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    border-radius: 20px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
  }

  .timeline-node:hover {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.04);
  }

  .timeline-node.selected {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.1);
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .node-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
  }

  .timeline-node.correct .node-icon {
    background-color: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .timeline-node.incorrect .node-icon {
    background-color: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .node-info {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .node-step {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .node-attempt {
    font-size: 0.65rem;
    color: var(--text-secondary);
  }
</style>
