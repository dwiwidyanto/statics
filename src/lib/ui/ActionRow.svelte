<script lang="ts">
  export let align: 'left' | 'right' | 'between' = 'left';
  export let compact = false;
</script>

<div class="action-row {align} {compact ? 'compact' : ''}">
  <slot />
</div>

<style>
  .action-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .compact {
    gap: 0.5rem;
  }

  .left {
    justify-content: flex-start;
  }

  .right {
    justify-content: flex-end;
  }

  .between {
    justify-content: space-between;
  }

  @media (max-width: 640px) {
    .action-row {
      align-items: stretch;
    }

    .action-row :global(button) {
      width: 100%;
    }
  }
</style>
