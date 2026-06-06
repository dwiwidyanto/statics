<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import type { TrussModel } from '../../lib/domain/truss/types';

  export let problems: TrussModel[] = [];
  export let selectedId: string;
  export let onSelect: (id: string) => void;
</script>

<div class="selector-card">
  <div class="form-group">
    <label for="truss-problem-select">
      {$locale === 'id' ? 'Pilih Soal Rangka Batang:' : 'Select Truss Problem:'}
    </label>
    <select 
      id="truss-problem-select" 
      class="form-control"
      value={selectedId}
      on:change={(e) => onSelect(e.currentTarget.value)}
    >
      {#each problems as p}
        <option value={p.id}>
          {$locale === 'id' ? p.titleId || p.title : p.title} ({p.difficulty.toUpperCase()})
        </option>
      {/each}
    </select>
  </div>
</div>

<style>
  .selector-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .form-control {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.9rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
  }

  .form-control:focus {
    border-color: var(--color-primary, #2563eb);
  }
</style>
