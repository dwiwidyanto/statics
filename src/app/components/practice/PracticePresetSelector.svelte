<script lang="ts">
  import { locale, translations } from '../../../lib/utils/i18n';
  import type { ProblemModel } from '../../../lib/domain/models/types';
  import Button from '../../../lib/ui/Button.svelte';

  export let problems: ProblemModel[];
  export let problemDropdownValue: string;
  export let onProblemChange: (event: Event) => void;
  export let onReset: () => void;
  export let onDashboard: () => void;
</script>

<div class="practice-toolbar">
  <div class="toolbar-left">
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a href="#" class="back-link" on:click|preventDefault={onDashboard}>
      ← {translations[$locale].dashboard}
    </a>
    <h2>{translations[$locale].interactiveSandbox}</h2>
  </div>

  <div class="toolbar-right">
    <div class="problem-loader">
      <label for="problem-preset">{translations[$locale].presetProblem}</label>
      <select
        id="problem-preset"
        class="form-control select-preset"
        value={problemDropdownValue}
        on:change={onProblemChange}
      >
        <option value="custom">{translations[$locale].customSandbox}</option>
        {#each problems as prob}
          <option value={prob.id}>{$locale === 'id' ? prob.titleId || prob.title : prob.title}</option>
        {/each}
      </select>
    </div>

    <Button variant="secondary" on:click={onReset}>{translations[$locale].resetDiagram}</Button>
  </div>
</div>

<style>
  .practice-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    background-color: var(--bg-secondary);
    padding: 1rem 1.5rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .toolbar-left h2 {
    font-size: 1.25rem;
    margin-bottom: 0;
  }

  .back-link {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .back-link:hover {
    color: var(--color-primary);
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .problem-loader {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .problem-loader label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .select-preset {
    width: 250px;
  }
</style>
