<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let variant: 'primary' | 'secondary' | 'danger' = 'secondary';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;

  const dispatch = createEventDispatcher<{ click: MouseEvent }>();
</script>

<button {type} {disabled} class="btn {variant}" on:click={(event) => dispatch('click', event)}>
  <slot />
</button>

<style>
  .btn {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.55rem 1.1rem;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    font-family: inherit;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .primary { background-color: var(--color-primary); color: white; }
  .secondary { background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); }
  .danger { background-color: #ef4444; color: white; }
</style>
