<script lang="ts">
  import { locale } from '../../lib/utils/i18n';

  export let jointEquations: Array<{
    jointLabel: string;
    eqX: string;
    eqY: string;
    solved: Record<string, number>;
    explanation: string;
  }> = [];

  export let messages: string[] = [];
</script>

<div class="equations-panel">
  <div class="panel-header">
    <h3>{$locale === 'id' ? 'Langkah Analisis Titik Hubung' : 'Method of Joints Analysis Steps'}</h3>
  </div>

  <!-- Solver Warning Messages / Zero-force notices -->
  {#if messages.length > 0}
    <div class="messages-box">
      <h4>{$locale === 'id' ? 'Catatan & Aturan Inspeksi Solver:' : 'Solver Notes & Inspection Rules:'}</h4>
      <ul class="messages-list">
        {#each messages as msg}
          <li>{msg}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if jointEquations.length > 0}
    <div class="steps-flow">
      {#each jointEquations as step, index}
        <div class="step-card">
          <div class="step-num">
            <span>{$locale === 'id' ? 'Langkah' : 'Step'} {index + 1}</span>
            <span class="joint-badge">{$locale === 'id' ? 'Titik' : 'Joint'} {step.jointLabel}</span>
          </div>

          <div class="equations-math">
            <div class="eq-row">
              <span class="eq-type">ΣFx = 0 ➔</span>
              <code class="eq-code">{step.eqX}</code>
            </div>
            <div class="eq-row">
              <span class="eq-type">ΣFy = 0 ➔</span>
              <code class="eq-code">{step.eqY}</code>
            </div>
          </div>

          <p class="step-explanation">{step.explanation}</p>
        </div>
      {/each}
    </div>
  {:else}
    <p class="empty-msg">
      {$locale === 'id'
        ? 'Pilih soal rangka batang yang stabil untuk melihat langkah-langkah penyelesaian.'
        : 'Select a stable truss problem to view joint-by-joint equilibrium steps.'}
    </p>
  {/if}
</div>

<style>
  .equations-panel {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .messages-box {
    background-color: rgba(37, 99, 235, 0.05);
    border: 1px dashed var(--color-primary-light, rgba(37, 99, 235, 0.3));
    border-radius: 6px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.25rem;
  }

  .messages-box h4 {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-primary, #2563eb);
    margin-top: 0;
    margin-bottom: 0.4rem;
  }

  .messages-list {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .messages-list li {
    margin-bottom: 0.25rem;
  }

  .steps-flow {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .step-card {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1rem;
  }

  .step-num {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .joint-badge {
    background-color: var(--color-primary, #2563eb);
    color: white;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .equations-math {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    background-color: var(--bg-secondary);
    padding: 0.6rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    margin-bottom: 0.75rem;
  }

  .eq-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    font-size: 0.8rem;
  }

  .eq-type {
    font-weight: 700;
    color: var(--text-secondary);
    min-width: 60px;
    flex-shrink: 0;
  }

  .eq-code {
    font-family: 'Courier New', Courier, monospace;
    color: var(--text-primary);
    word-break: break-all;
  }

  .step-explanation {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .empty-msg {
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-align: center;
    margin: 1.5rem 0;
  }
</style>
