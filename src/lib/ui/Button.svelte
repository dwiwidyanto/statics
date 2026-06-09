<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let variant: 'primary' | 'secondary' | 'danger' = 'secondary';
  export let size: 'sm' | 'md' = 'md';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;

  const dispatch = createEventDispatcher<{ click: MouseEvent }>();
</script>

<button
  {type}
  disabled={disabled || loading}
  aria-busy={loading}
  class="btn {variant} {size} {fullWidth ? 'full-width' : ''}"
  on:click={(event) => dispatch('click', event)}
>
  <slot />
</button>

<style>
  .btn {
    font-size: 0.85rem;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.2;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sm {
    font-size: 0.78rem;
    padding: 0.4rem 0.75rem;
  }

  .md {
    font-size: 0.85rem;
    padding: 0.55rem 1.1rem;
  }

  .full-width {
    width: 100%;
  }

  .primary { background-color: var(--color-primary); color: white; }
  .secondary { background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); }
  .danger { background-color: var(--color-error); color: white; }
</style>
