<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import { checkIndividualAnswer } from '../../../lib/domain/truss/scoring';
  import type { AnswerFeedback } from '../../../lib/domain/truss/scoring';

  export let reactionsReference: Record<string, number>;
  export let answers: Record<string, number | null>;
  export let onNext: (score: number, misconceptions: string[]) => void;

  let showFeedback = false;
  let isCorrect = false;
  let feedbacks: Record<string, AnswerFeedback> = {};
  let score = 0;

  const rxKeys = Object.keys(reactionsReference);

  // Initialize answers
  $: {
    for (const key of rxKeys) {
      if (!(key in answers)) {
        answers[key] = null;
      }
    }
  }

  function handleVerify() {
    showFeedback = true;
    let correctCount = 0;
    const localMisconceptions = new Set<string>();
    const opts = { absoluteTolerance: 2, relativeTolerance: 0.01 };

    for (const key of rxKeys) {
      const userVal = answers[key];
      const refVal = reactionsReference[key];
      const fb = checkIndividualAnswer(userVal, refVal, key, opts);
      feedbacks[key] = fb;

      if (fb.status === 'correct') {
        correctCount++;
      } else if (fb.status === 'sign_reversed') {
        localMisconceptions.add('sign_reversed');
      }
    }

    score = rxKeys.length > 0 ? correctCount / rxKeys.length : 1.0;
    isCorrect = score >= 0.99; // requires all correct to proceed
  }

  function handleNext() {
    const list = Array.from(new Set(Object.values(feedbacks).map(f => {
      if (f.status === 'sign_reversed') return 'sign_reversed';
      return '';
    }).filter(Boolean)));
    onNext(score, list);
  }

  function getFeedbackClass(status: string): string {
    if (status === 'correct') return 'correct';
    if (status === 'missing') return 'missing';
    if (status === 'sign_reversed') return 'sign-reversed';
    return 'incorrect';
  }
</script>

<div class="step-card">
  <h3>{$locale === 'id' ? 'Langkah 3: Reaksi Tumpuan' : 'Step 3: Support Reactions'}</h3>
  <p class="step-instruction">
    {$locale === 'id'
      ? 'Hitung gaya reaksi luar pada tumpuan (positif ke kanan/atas, negatif ke kiri/bawah) menggunakan keseimbangan momen dan gaya global.'
      : 'Solve for the external support reaction forces (positive right/up, negative left/down) using global rigid-body equilibrium.'}
  </p>

  <div class="inputs-grid">
    {#each rxKeys as rxKey}
      <div class="input-field">
        <label for="input-{rxKey}">{rxKey}</label>
        <div class="input-wrapper">
          <input 
            id="input-{rxKey}" 
            type="number" 
            step="any"
            bind:value={answers[rxKey]} 
            disabled={isCorrect}
            placeholder="0.0"
          />
          <span class="unit">N</span>
        </div>
        {#if showFeedback && feedbacks[rxKey]}
          <span class="fb-text {getFeedbackClass(feedbacks[rxKey].status)}">
            {feedbacks[rxKey].message}
          </span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="actions">
    {#if !isCorrect}
      <button class="btn btn-primary" on:click={handleVerify}>
        {$locale === 'id' ? 'Verifikasi' : 'Verify Answers'}
      </button>
    {:else}
      <button class="btn btn-success" on:click={handleNext}>
        {$locale === 'id' ? 'Lanjutkan' : 'Next Step'}
      </button>
    {/if}
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

  .step-card h3 {
    font-size: 1.05rem;
    margin: 0;
  }

  .step-instruction {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .inputs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .input-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-field label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-wrapper input {
    width: 100%;
    padding: 0.45rem 1.5rem 0.45rem 0.5rem;
    font-size: 0.88rem;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-radius: 4px;
    font-family: monospace;
    font-weight: bold;
    text-align: right;
  }

  .input-wrapper input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .input-wrapper .unit {
    position: absolute;
    right: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .fb-text {
    font-size: 0.72rem;
    font-weight: 700;
    margin-top: 0.1rem;
  }

  .fb-text.correct { color: #10b981; }
  .fb-text.missing { color: #f59e0b; }
  .fb-text.sign-reversed { color: #ef4444; }
  .fb-text.incorrect { color: #ef4444; }

  .actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  .btn {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
  }

  .btn-primary { background-color: var(--color-primary); color: white; }
  .btn-success { background-color: #10b981; color: white; }
</style>
