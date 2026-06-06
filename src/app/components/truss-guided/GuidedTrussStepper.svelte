<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { GuidedTrussStep } from '../../../lib/domain/truss/guidedTypes';

  export let activeStep: GuidedTrussStep;
  
  const steps: { key: GuidedTrussStep; labelEn: string; labelId: string }[] = [
    { key: 'overview', labelEn: 'Overview', labelId: 'Ringkasan' },
    { key: 'determinacy', labelEn: 'Determinacy', labelId: 'Determinasi' },
    { key: 'reactions', labelEn: 'Reactions', labelId: 'Reaksi' },
    { key: 'zero_members', labelEn: 'Zero-Force', labelId: 'Batang Nol' },
    { key: 'joint_sequence', labelEn: 'Method of Joints', labelId: 'Titik Hubung' },
    { key: 'summary', labelEn: 'Summary', labelId: 'Hasil Akhir' }
  ];

  function getStepIndex(key: GuidedTrussStep): number {
    return steps.findIndex(s => s.key === key);
  }

  $: activeIndex = getStepIndex(activeStep);
</script>

<div class="stepper-container">
  <div class="stepper-bar">
    {#each steps as step, idx}
      <div 
        class="step-item"
        class:active={idx === activeIndex}
        class:completed={idx < activeIndex}
      >
        <div class="step-num">{idx + 1}</div>
        <span class="step-label">
          {$locale === 'id' ? step.labelId : step.labelEn}
        </span>
      </div>
      {#if idx < steps.length - 1}
        <div class="step-line" class:completed={idx < activeIndex}></div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .stepper-container {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    overflow-x: auto;
  }

  .stepper-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 600px;
    gap: 0.5rem;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    opacity: 0.5;
    transition: opacity 0.25s;
  }

  .step-item.active {
    opacity: 1;
    font-weight: 700;
  }

  .step-item.completed {
    opacity: 0.85;
  }

  .step-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--bg-primary);
    border: 2px solid var(--border-color);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    font-weight: bold;
    transition: all 0.25s;
  }

  .step-item.active .step-num {
    border-color: var(--color-primary, #2563eb);
    background-color: var(--color-primary, #2563eb);
    color: white;
  }

  .step-item.completed .step-num {
    border-color: #10b981;
    background-color: #10b981;
    color: white;
  }

  .step-label {
    font-size: 0.82rem;
    color: var(--text-primary);
    white-space: nowrap;
  }

  .step-line {
    flex-grow: 1;
    height: 2px;
    background-color: var(--border-color);
    transition: background-color 0.25s;
  }

  .step-line.completed {
    background-color: #10b981;
  }
</style>
