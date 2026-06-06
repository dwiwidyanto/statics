<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussModel } from '../../../lib/domain/truss/types';
  import type { DeterminacyAnswers } from '../../../lib/domain/truss/guidedTypes';
  import { countTrussUnknowns, classifyTrussByCount } from '../../../lib/domain/truss/guidedWorkflow';

  export let truss: TrussModel;
  export let answers: DeterminacyAnswers;
  export let onNext: (score: number, misconceptions: string[]) => void;

  let showFeedback = false;
  let isCorrect = false;
  let feedbackMessage = '';

  const ref = countTrussUnknowns(truss);
  const refClass = classifyTrussByCount(truss);

  function handleVerify() {
    showFeedback = true;
    const errors: string[] = [];
    const localMisconceptions: string[] = [];

    // Validate inputs
    const mVal = answers.m;
    const rVal = answers.r;
    const jVal = answers.j;
    const classVal = answers.classification;

    if (mVal !== ref.m) {
      errors.push($locale === 'id' ? `Jumlah batang (m) salah.` : `Number of members (m) is incorrect.`);
    }
    if (rVal !== ref.r) {
      errors.push($locale === 'id' ? `Jumlah reaksi tumpuan (r) salah.` : `Number of support reactions (r) is incorrect.`);
      localMisconceptions.push('reaction_count_error');
    }
    if (jVal !== ref.j) {
      errors.push($locale === 'id' ? `Jumlah titik hubung (j) salah.` : `Number of joints (j) is incorrect.`);
    }
    if (classVal !== refClass) {
      errors.push($locale === 'id' 
        ? `Klasifikasi determinasi salah.` 
        : `Determinacy classification is incorrect.`);
    }

    if (errors.length === 0) {
      isCorrect = true;
      const formulaStr = `${ref.m} + ${ref.r} = 2 * ${ref.j} (${ref.m + ref.r} = ${2 * ref.j})`;
      if (refClass === 'statically_determinate') {
        feedbackMessage = $locale === 'id'
          ? `Sempurna! Rangka batang ini statis tertentu karena m + r = 2j (${formulaStr}) dan susunan geometrisnya stabil.`
          : `Perfect! The truss is statically determinate because m + r = 2j (${formulaStr}) and it is geometrically stable.`;
      } else if (refClass === 'statically_indeterminate') {
        feedbackMessage = $locale === 'id'
          ? `Benar! Rangka batang ini statis tak tentu karena m + r > 2j (${formulaStr}).`
          : `Correct! The truss is statically indeterminate because m + r > 2j (${formulaStr}).`;
      } else {
        feedbackMessage = $locale === 'id'
          ? `Benar! Rangka batang ini tidak stabil karena m + r < 2j (${formulaStr}).`
          : `Correct! The truss is unstable because m + r < 2j (${formulaStr}).`;
      }
    } else {
      isCorrect = false;
      feedbackMessage = errors.join(' ');
    }
  }

  function handleNext() {
    // Score is 1.0 if correct on verification, or partial if they struggled
    onNext(isCorrect ? 1.0 : 0.0, isCorrect ? [] : ['reaction_count_error']);
  }
</script>

<div class="step-card">
  <h3>{$locale === 'id' ? 'Langkah 2: Stabilitas & Determinasi' : 'Step 2: Stability & Determinacy'}</h3>
  <p class="step-instruction">
    {$locale === 'id'
      ? 'Hitung jumlah batang (m), reaksi tumpuan (r), dan titik hubung (j). Tentukan apakah struktur tersebut statis tertentu, tak tentu, atau tidak stabil menggunakan hubungan m + r = 2j.'
      : 'Count the members (m), reactions (r), and joints (j). Determine if the structure is statically determinate, indeterminate, or unstable using the relation m + r = 2j.'}
  </p>

  <div class="inputs-row">
    <div class="input-field">
      <label for="input-m">{$locale === 'id' ? 'Batang (m)' : 'Members (m)'}</label>
      <input 
        id="input-m" 
        type="number" 
        bind:value={answers.m} 
        disabled={isCorrect}
        placeholder="0"
      />
    </div>

    <div class="input-field">
      <label for="input-r">{$locale === 'id' ? 'Reaksi (r)' : 'Reactions (r)'}</label>
      <input 
        id="input-r" 
        type="number" 
        bind:value={answers.r} 
        disabled={isCorrect}
        placeholder="0"
      />
    </div>

    <div class="input-field">
      <label for="input-j">{$locale === 'id' ? 'Titik Hubung (j)' : 'Joints (j)'}</label>
      <input 
        id="input-j" 
        type="number" 
        bind:value={answers.j} 
        disabled={isCorrect}
        placeholder="0"
      />
    </div>
  </div>

  <div class="select-field">
    <label for="select-classification">{$locale === 'id' ? 'Klasifikasi Rangka Batang' : 'Truss Classification'}</label>
    <select id="select-classification" bind:value={answers.classification} disabled={isCorrect}>
      <option value={null}>-- {$locale === 'id' ? 'Pilih opsi' : 'Select option'} --</option>
      <option value="statically_determinate">{$locale === 'id' ? 'Statis Tertentu (Statically Determinate)' : 'Statically Determinate'}</option>
      <option value="statically_indeterminate">{$locale === 'id' ? 'Statis Tak Tentu (Statically Indeterminate)' : 'Statically Indeterminate'}</option>
      <option value="unstable">{$locale === 'id' ? 'Tidak Stabil (Unstable)' : 'Unstable'}</option>
    </select>
  </div>

  {#if showFeedback}
    <div class="feedback-box {isCorrect ? 'correct' : 'incorrect'}">
      <p>{feedbackMessage}</p>
    </div>
  {/if}

  <div class="actions">
    {#if !isCorrect}
      <button 
        class="btn btn-primary" 
        on:click={handleVerify}
        disabled={answers.m === null || answers.r === null || answers.j === null || !answers.classification}
      >
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

  .inputs-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .input-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-field label, .select-field label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .input-field input {
    padding: 0.45rem;
    font-size: 0.88rem;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-radius: 4px;
    text-align: center;
  }

  .select-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .select-field select {
    padding: 0.45rem;
    font-size: 0.88rem;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-radius: 4px;
  }

  .feedback-box {
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .feedback-box.correct {
    background-color: rgba(16, 185, 129, 0.1);
    border-left: 4px solid #10b981;
    color: var(--text-primary);
  }

  .feedback-box.incorrect {
    background-color: rgba(239, 68, 68, 0.1);
    border-left: 4px solid #ef4444;
    color: var(--text-primary);
  }

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
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
