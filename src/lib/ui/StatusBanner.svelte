<script lang="ts">
  export let tone: 'success' | 'warning' | 'danger' | 'info' = 'info';
  export let role: 'status' | 'alert' = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';
</script>

<div class="banner {tone}" {role}>
  <slot />
</div>

<style>
  .banner {
    border-radius: 8px;
    padding: 0.75rem 1.25rem;
    font-size: 0.85rem;
    color: var(--text-primary);
  }

  .success {
    background-color: var(--status-success-bg, rgba(16, 185, 129, 0.08));
    border: 1px solid var(--status-success-border, rgba(16, 185, 129, 0.25));
  }

  .warning {
    background-color: var(--status-warning-bg, rgba(245, 158, 11, 0.08));
    border: 1px solid var(--status-warning-border, rgba(245, 158, 11, 0.25));
  }

  .danger {
    background-color: var(--status-danger-bg, rgba(239, 68, 68, 0.08));
    border: 1px solid var(--status-danger-border, rgba(239, 68, 68, 0.25));
    color: var(--color-error);
  }

  .info {
    background-color: var(--status-info-bg, rgba(59, 130, 246, 0.08));
    border: 1px solid var(--status-info-border, rgba(59, 130, 246, 0.25));
  }
</style>
