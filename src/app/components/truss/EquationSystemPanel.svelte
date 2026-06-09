<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussEquationSystem } from '../../../lib/domain/truss/types';

  export let equationSystem: TrussEquationSystem | undefined = undefined;
</script>

{#if equationSystem}
  <details class="equation-system-panel">
    <summary>{$locale === 'id' ? 'Lihat sistem persamaan joint' : 'View joint equation system'}</summary>
    <div class="system-summary">
      <span>{$locale === 'id' ? 'Unknown' : 'Unknowns'}: {equationSystem.unknownCount}</span>
      <span>{$locale === 'id' ? 'Persamaan' : 'Equations'}: {equationSystem.equationCount}</span>
      <span>{$locale === 'id' ? 'Residual maks' : 'Max residual'}: {equationSystem.residuals.maxAbs.toFixed(2)} N</span>
    </div>
    <div class="equation-list">
      {#each equationSystem.equations as row}
        <code>{row.equation}</code>
      {/each}
    </div>
  </details>
{/if}

<style>
  .equation-system-panel {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
  }

  summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--color-primary);
  }

  .system-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 0.75rem 0;
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  .equation-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 280px;
    overflow: auto;
  }

  code {
    white-space: pre-wrap;
    font-size: 0.78rem;
    color: var(--text-primary);
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0.4rem;
  }
</style>
