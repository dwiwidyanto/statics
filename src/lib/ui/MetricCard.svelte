<script lang="ts">
  export let label: string;
  export let value: string | number;
  export let helper = '';
  export let tone: 'default' | 'info' | 'success' | 'warning' | 'danger' = 'default';
</script>

<div class="metric-card {tone}">
  <span class="metric-value">{value}</span>
  <span class="metric-label">{label}</span>
  {#if helper}
    <span class="metric-helper">{helper}</span>
  {/if}
</div>

<style>
  .metric-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    transition: transform 0.2s, box-shadow 0.2s;
    text-align: center;
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .info {
    border-color: var(--status-info-border, rgba(59, 130, 246, 0.25));
    background: linear-gradient(135deg, var(--bg-secondary), var(--status-info-bg, rgba(59, 130, 246, 0.08)));
  }

  .success {
    border-color: var(--status-success-border, rgba(16, 185, 129, 0.25));
    background: linear-gradient(135deg, var(--bg-secondary), var(--status-success-bg, rgba(16, 185, 129, 0.08)));
  }

  .warning {
    border-color: var(--status-warning-border, rgba(245, 158, 11, 0.25));
    background: linear-gradient(135deg, var(--bg-secondary), var(--status-warning-bg, rgba(245, 158, 11, 0.08)));
  }

  .danger {
    border-color: var(--status-danger-border, rgba(239, 68, 68, 0.25));
    background: linear-gradient(135deg, var(--bg-secondary), var(--status-danger-bg, rgba(239, 68, 68, 0.08)));
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }

  .metric-label,
  .metric-helper {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .metric-label {
    letter-spacing: 0.05em;
  }

  .metric-helper {
    text-transform: none;
    font-weight: 500;
  }
</style>
