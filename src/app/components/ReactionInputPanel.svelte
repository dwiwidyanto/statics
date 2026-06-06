<script lang="ts">
  import { locale } from '../../lib/utils/i18n';

  export let reactionKeys: string[];
  export let userReactionsInput: Record<string, string | number>;
  export let showReactionsSolved: boolean;
  export let reactionInputError: string;
  export let reactionExplanation: string;
  export let onVerify: () => void;
</script>

<div class="step-card animate-fade-in">
  <span class="step-badge">{$locale === 'id' ? 'Langkah 3' : 'Step 3'}: {$locale === 'id' ? 'Kesetimbangan Statis' : 'Static Equilibrium'}</span>
  <h2>{$locale === 'id' ? 'Hitung Nilai Reaksi Tumpuan' : 'Calculate Support Reactions'}</h2>
  
  <p class="explanation">
    {$locale === 'id'
      ? 'Gunakan hukum kesetimbangan statis 2D di bawah untuk menghitung nilai reaksi. Masukkan jawaban Anda pada kotak di bawah:'
      : 'Apply 2D static equilibrium equations to solve for the support reactions. Enter your answers in the boxes below:'}
  </p>

  <div class="reactions-input-container">
    {#each reactionKeys as key}
      <div class="input-group">
        <label for="rx-{key}">
          <strong>{key}</strong>
          ({key.startsWith('M_') ? 'N·m' : 'N'})
        </label>
        <input 
          id="rx-{key}" 
          type="number" 
          step="any"
          placeholder="0"
          bind:value={userReactionsInput[key]}
          class="form-control"
          disabled={showReactionsSolved}
        />
      </div>
    {/each}
  </div>

  {#if reactionInputError}
    <div class="alert alert-important animate-fade-in">
      <p style="white-space: pre-line;">{reactionInputError}</p>
    </div>
  {/if}

  {#if !showReactionsSolved}
    <button class="btn btn-primary w-full mt-3" on:click={onVerify}>
      {$locale === 'id' ? 'Periksa Jawaban Reaksi' : 'Verify Reaction Values'}
    </button>
  {:else}
    <div class="alert alert-tip animate-fade-in">
      <p><strong>✅ {$locale === 'id' ? 'Semua reaksi benar!' : 'All reactions are correct!'}</strong></p>
    </div>
  {/if}

  <div class="accordion-hint">
    <details>
      <summary>💡 {$locale === 'id' ? 'Tampilkan Cara Penyelesaian' : 'Show Step-by-Step Solution'}</summary>
      <div class="hint-content">
        {@html reactionExplanation.replace(/\n/g, '<br/>')}
      </div>
    </details>
  </div>
</div>

<style>
  .step-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 2rem;
    border-radius: 12px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .step-badge {
    background-color: rgba(37, 99, 235, 0.08);
    color: var(--color-primary);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    align-self: flex-start;
  }

  .step-card h2 {
    font-size: 1.4rem;
    color: var(--text-primary);
  }

  .explanation {
    color: var(--text-primary);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .reactions-input-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 0.75rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-group label {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .form-control {
    width: 100%;
  }

  .alert {
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .alert-important {
    background-color: rgba(239, 68, 68, 0.08);
    border-left: 3px solid #ef4444;
    color: var(--color-error, #ef4444);
  }

  .alert-tip {
    background-color: rgba(16, 185, 129, 0.08);
    border-left: 3px solid #10b981;
    color: var(--color-success, #10b981);
  }

  .accordion-hint {
    border-top: 1px solid var(--border-color);
    padding-top: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }

  .accordion-hint summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--color-primary);
    user-select: none;
  }

  .hint-content {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: var(--bg-primary);
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.8rem;
    line-height: 1.4;
    white-space: pre-wrap;
  }

  .w-full {
    width: 100%;
  }

  .mt-3 {
    margin-top: 0.75rem;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
