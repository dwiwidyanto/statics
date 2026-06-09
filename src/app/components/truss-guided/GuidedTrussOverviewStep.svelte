<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussEquationSystem, TrussModel, TrussSolverMethod } from '../../../lib/domain/truss/types';
  import SolverMethodPanel from '../truss/SolverMethodPanel.svelte';

  export let problem: TrussModel;
  export let solverMethod: TrussSolverMethod | undefined;
  export let equationSystem: TrussEquationSystem | undefined;
  export let onStart: () => void;
</script>

<div class="step-card">
  <h3>{$locale === 'id' ? 'Langkah 1: Tinjauan Soal' : 'Step 1: Problem Overview'}</h3>
  <p class="desc">
    {$locale === 'id' ? problem.descriptionId || problem.description : problem.description}
  </p>

  <div class="objectives-box">
    <h4>{$locale === 'id' ? 'Tujuan Pembelajaran:' : 'Learning Objectives:'}</h4>
    <ul>
      {#each problem.learningObjectives as obj}
        <li>{obj}</li>
      {/each}
    </ul>
  </div>

  <SolverMethodPanel {solverMethod} {equationSystem} />

  <div class="actions">
    <button class="btn btn-primary" on:click={onStart}>
      {$locale === 'id' ? 'Mulai Belajar Terpandu' : 'Start Guided Analysis'}
    </button>
  </div>
</div>

<style>
  .step-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h3 {
    font-size: 1.05rem;
    margin: 0;
  }

  .desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .objectives-box {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .objectives-box h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--text-primary);
  }

  .objectives-box ul {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    transition: background-color 0.15s;
  }

  .btn-primary { background-color: var(--color-primary); color: white; }
  .btn-primary:hover { background-color: var(--color-primary-hover); }
</style>
