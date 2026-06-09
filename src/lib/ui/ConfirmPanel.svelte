<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ActionRow from './ActionRow.svelte';
  import Button from './Button.svelte';

  export let title: string;
  export let message: string;
  export let confirmLabel: string;
  export let cancelLabel: string;
  export let danger = false;

  const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();
</script>

<div class="confirm-panel {danger ? 'danger' : ''}" role={danger ? 'alert' : 'status'}>
  <div class="confirm-copy">
    <h3>{title}</h3>
    <p>{message}</p>
  </div>
  <ActionRow align="right" compact>
    <Button variant={danger ? 'danger' : 'primary'} size="sm" on:click={() => dispatch('confirm')}>
      {confirmLabel}
    </Button>
    <Button variant="secondary" size="sm" on:click={() => dispatch('cancel')}>
      {cancelLabel}
    </Button>
  </ActionRow>
</div>

<style>
  .confirm-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    width: 100%;
    border: 1px solid var(--status-warning-border, rgba(245, 158, 11, 0.25));
    background-color: var(--status-warning-bg, rgba(245, 158, 11, 0.08));
    border-radius: 8px;
    padding: 0.85rem 1rem;
  }

  .confirm-panel.danger {
    border-color: var(--status-danger-border, rgba(239, 68, 68, 0.25));
    background-color: var(--status-danger-bg, rgba(239, 68, 68, 0.08));
  }

  .confirm-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  h3 {
    margin: 0;
    font-size: 0.9rem;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.82rem;
    line-height: 1.4;
  }

  @media (max-width: 640px) {
    .confirm-panel {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>
