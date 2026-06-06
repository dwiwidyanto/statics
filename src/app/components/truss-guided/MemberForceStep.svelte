<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussModel } from '../../../lib/domain/truss/types';
  import { buildJointEquationPrompt } from '../../../lib/domain/truss/guidedWorkflow';
  import { checkIndividualAnswer } from '../../../lib/domain/truss/scoring';
  import type { AnswerFeedback } from '../../../lib/domain/truss/scoring';

  export let truss: TrussModel;
  export let jointId: string;
  export let solvedMemberIds: string[];
  export let referenceMemberForces: Record<string, number>;
  export let knownReactions: Record<string, number>;
  export let knownMemberForces: Record<string, number>;
  export let onSubmitAnswers: (solved: Record<string, number>, score: number, misconceptions: string[]) => void;

  let showFeedback = false;
  let isCorrect = false;
  let feedbacks: Record<string, AnswerFeedback> = {};
  let score = 0;

  // Answers entered by student
  let answers: Record<string, string> = {};

  $: prompt = buildJointEquationPrompt(truss, jointId, solvedMemberIds, knownReactions, knownMemberForces);

  $: {
    if (prompt) {
      for (const mId of prompt.unknownMemberIds) {
        if (!(mId in answers)) {
          answers[mId] = '';
        }
      }
    }
  }

  function handleVerify() {
    showFeedback = true;
    let correctCount = 0;
    const localMisconceptions = new Set<string>();
    const opts = { absoluteTolerance: 2, relativeTolerance: 0.01 };

    const unknownIds = prompt.unknownMemberIds;
    for (const mId of unknownIds) {
      const userVal = answers[mId] === '' ? null : parseFloat(answers[mId]);
      const refVal = referenceMemberForces[mId] ?? 0;
      const mObj = truss.members.find(x => x.id === mId)!;
      
      const fb = checkIndividualAnswer(userVal, refVal, mObj.label, opts);
      feedbacks[mId] = fb;

      if (fb.status === 'correct') {
        correctCount++;
      } else {
        if (fb.status === 'sign_reversed') {
          localMisconceptions.add('sign_reversed');
          localMisconceptions.add('tension_compression_confusion');
        } else if (fb.status === 'zero_expected') {
          localMisconceptions.add('zero_force_missed');
        }
      }
    }

    score = unknownIds.length > 0 ? correctCount / unknownIds.length : 1.0;
    isCorrect = score >= 0.99;
  }

  function handleNext() {
    const solvedForces: Record<string, number> = {};
    for (const mId of prompt.unknownMemberIds) {
      solvedForces[mId] = referenceMemberForces[mId] ?? 0;
    }

    const misconceptionsList = Array.from(new Set(Object.values(feedbacks).map(f => {
      if (f.status === 'sign_reversed') return 'sign_reversed';
      if (f.status === 'zero_expected') return 'zero_force_missed';
      return '';
    }).filter(Boolean)));

    onSubmitAnswers(solvedForces, score, misconceptionsList);
  }

  function getFeedbackClass(status: string): string {
    if (status === 'correct') return 'correct';
    if (status === 'missing') return 'missing';
    if (status === 'sign_reversed') return 'sign-reversed';
    if (status === 'zero_expected') return 'zero-expected';
    return 'incorrect';
  }
</script>

<div class="step-card">
  <h3>{$locale === 'id' ? `Menyelesaikan Titik Hubung ${prompt.jointLabel}` : `Solving Joint ${prompt.jointLabel}`}</h3>
  <p class="step-instruction">
    {$locale === 'id'
      ? 'Susun persamaan kesetimbangan ΣFx = 0 dan ΣFy = 0 untuk menghitung gaya batang yang tidak diketahui. Gunakan tanda positif (+) untuk tarik dan negatif (-) untuk tekan.'
      : 'Formulate the ΣFx = 0 and ΣFy = 0 equilibrium equations to solve for the unknown member forces. Use positive (+) for tension and negative (-) for compression.'}
  </p>

  <div class="equations-prompt">
    <h5>{$locale === 'id' ? 'Struktur Persamaan Kesetimbangan:' : 'Equilibrium Equations Structure:'}</h5>
    <div class="eq-line"><strong>ΣFx:</strong> <code>{prompt.eqX}</code></div>
    <div class="eq-line"><strong>ΣFy:</strong> <code>{prompt.eqY}</code></div>
  </div>

  <div class="inputs-grid">
    {#each prompt.unknownMemberIds as mId, idx}
      {@const mLabel = prompt.unknownMemberLabels[idx]}
      <div class="input-field">
        <label for="input-force-{mId}">
          {$locale === 'id' ? `Gaya Batang ${mLabel}` : `Force in Member ${mLabel}`}
        </label>
        <div class="input-wrapper">
          <input
            id="input-force-{mId}"
            type="number"
            step="any"
            bind:value={answers[mId]}
            disabled={isCorrect}
            placeholder="0.0"
          />
          <span class="unit">N</span>
        </div>
        {#if showFeedback && feedbacks[mId]}
          <span class="fb-text {getFeedbackClass(feedbacks[mId].status)}">
            {feedbacks[mId].message}
          </span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="actions">
    {#if !isCorrect}
      <button class="btn btn-primary" on:click={handleVerify}>
        {$locale === 'id' ? 'Verifikasi' : 'Verify Forces'}
      </button>
    {:else}
      <button class="btn btn-success" on:click={handleNext}>
        {$locale === 'id' ? 'Perbarui Rangka Batang' : 'Update Truss State'}
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

  .equations-prompt {
    background-color: var(--bg-primary);
    border: 1px dashed var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
    font-size: 0.8rem;
  }

  .equations-prompt h5 {
    margin: 0 0 0.4rem 0;
    font-weight: bold;
    color: var(--text-primary);
  }

  .eq-line {
    font-family: monospace;
    margin-bottom: 0.25rem;
    color: var(--text-primary);
  }

  .eq-line code {
    background: none;
    padding: 0;
  }

  .inputs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
  .fb-text.zero-expected { color: #3b82f6; }
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
