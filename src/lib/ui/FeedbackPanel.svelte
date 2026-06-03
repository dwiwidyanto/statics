<script lang="ts">
  import type { ValidationFeedback } from '../domain/validation/checker';

  export let feedbacks: ValidationFeedback[] = [];
  export let determinacy: 'statically_determinate' | 'statically_indeterminate' | 'unstable';
  export let stability: 'stable' | 'unstable';

  function getDeterminacyBadgeClass(det: string) {
    if (det === 'statically_determinate') return 'badge-success';
    if (det === 'statically_indeterminate') return 'badge-warning';
    return 'badge-danger';
  }

  function getDeterminacyText(det: string) {
    if (det === 'statically_determinate') return 'Statically Determinate';
    if (det === 'statically_indeterminate') return 'Statically Indeterminate';
    return 'Unstable / Under-restrained';
  }

  function getStabilityBadgeClass(stab: string) {
    return stab === 'stable' ? 'badge-success' : 'badge-danger';
  }
</script>

<div class="feedback-panel">
  <div class="status-summary">
    <div class="status-item">
      <span class="status-label">Determinacy:</span>
      <span class="badge {getDeterminacyBadgeClass(determinacy)}">
        {getDeterminacyText(determinacy)}
      </span>
    </div>
    <div class="status-item">
      <span class="status-label">Stability:</span>
      <span class="badge {getStabilityBadgeClass(stability)}">
        {stability.toUpperCase()}
      </span>
    </div>
  </div>

  <h3 class="panel-title">System Feedback</h3>

  {#if feedbacks.length === 0}
    <div class="empty-state">
      No diagnostics. Try placing supports and loads to analyze the model.
    </div>
  {:else}
    <div class="feedback-list">
      {#each feedbacks as feedback}
        <div class="feedback-card {feedback.type}">
          <div class="feedback-header">
            <span class="feedback-icon">
              {#if feedback.type === 'error'}
                ❌
              {:else}
                ⚠️
              {/if}
            </span>
            <h4 class="feedback-title">{feedback.title}</h4>
          </div>
          <p class="feedback-message">{feedback.message}</p>
          
          {#if feedback.whyItMatters}
            <div class="why-matters">
              <strong>Why this matters:</strong> {feedback.whyItMatters}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .feedback-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .panel-title {
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .status-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    background-color: var(--bg-primary);
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
  }

  .status-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .status-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: 4px;
    text-align: center;
  }

  .badge-success {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--color-success);
    border: 1px solid var(--color-success);
  }

  .badge-warning {
    background-color: rgba(245, 158, 11, 0.15);
    color: var(--color-warning);
    border: 1px solid var(--color-warning);
  }

  .badge-danger {
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--color-error);
    border: 1px solid var(--color-error);
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.875rem;
    background-color: var(--bg-primary);
    border-radius: 6px;
    border: 1px dashed var(--border-color);
  }

  .feedback-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .feedback-card {
    padding: 0.85rem;
    border-radius: 6px;
    border-left: 4px solid transparent;
    background-color: var(--bg-primary);
    font-size: 0.875rem;
  }

  .feedback-card.error {
    border-left-color: var(--color-error);
    background-color: rgba(239, 68, 68, 0.03);
  }

  .feedback-card.warning {
    border-left-color: var(--color-warning);
    background-color: rgba(245, 158, 11, 0.03);
  }

  .feedback-card.success {
    border-left-color: var(--color-success);
    background-color: rgba(16, 185, 129, 0.03);
  }

  .feedback-card.info {
    border-left-color: var(--color-info);
    background-color: rgba(6, 182, 212, 0.03);
  }

  .feedback-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.25rem;
  }

  .feedback-title {
    font-size: 0.9rem;
    font-weight: 700;
    margin-bottom: 0;
  }

  .feedback-message {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .why-matters {
    font-size: 0.8rem;
    color: var(--text-secondary);
    border-top: 1px solid var(--border-color);
    padding-top: 0.4rem;
    line-height: 1.4;
  }
</style>
