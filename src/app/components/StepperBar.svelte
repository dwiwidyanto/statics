<script lang="ts">
  import { locale } from '../../lib/utils/i18n';

  export let activeStep: number;
  export let totalSteps = 6;
  export let showReactionsSolved = false;
  export let onStepClick: (step: number) => void;
</script>

<div class="stepper-bar">
  {#each Array(totalSteps) as _, i}
    <button 
      class="step-dot {activeStep === i + 1 ? 'active' : ''} {activeStep > i + 1 ? 'completed' : ''}"
      on:click={() => {
        if (i + 1 <= 3 || showReactionsSolved) {
          onStepClick(i + 1);
        }
      }}
    >
      <span class="dot-num">{i + 1}</span>
      <span class="dot-label">
        {#if i === 0}
          {$locale === 'id' ? 'Soal' : 'Problem'}
        {:else if i === 1}
          FBD
        {:else if i === 2}
          {$locale === 'id' ? 'Reaksi' : 'Reactions'}
        {:else if i === 3}
          SFD
        {:else if i === 4}
          BMD
        {:else}
          {$locale === 'id' ? 'Ulasan' : 'Review'}
        {/if}
      </span>
    </button>
    {#if i < totalSteps - 1}
      <div class="step-line {activeStep > i + 1 ? 'active' : ''}"></div>
    {/if}
  {/each}
</div>

<style>
  .stepper-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 1.25rem 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .step-dot {
    background: none;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    position: relative;
    z-index: 2;
  }

  .dot-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: var(--bg-primary);
    border: 2px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-secondary);
    transition: all 0.2s;
  }

  .step-dot.active .dot-num {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
  }

  .step-dot.completed .dot-num {
    background-color: var(--color-success);
    border-color: var(--color-success);
    color: white;
  }

  .dot-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    font-family: inherit;
  }

  .step-dot.active .dot-label {
    color: var(--color-primary);
    font-weight: 700;
  }

  .step-line {
    flex: 1;
    height: 3px;
    background-color: var(--border-color);
    margin: 0 1rem;
    transform: translateY(-10px);
    transition: background-color 0.2s;
  }

  .step-line.active {
    background-color: var(--color-success);
  }
</style>
