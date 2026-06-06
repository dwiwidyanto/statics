<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussModel } from '../../../lib/domain/truss/types';
  import { buildJointEquationPrompt } from '../../../lib/domain/truss/guidedWorkflow';
  import { checkIndividualAnswer } from '../../../lib/domain/truss/scoring';
  import type { AnswerFeedback } from '../../../lib/domain/truss/scoring';
  import { guidedHints, getHintText } from '../../../lib/domain/truss/guidedHints';

  export let truss: TrussModel;
  export let jointId: string;
  export let solvedMemberIds: string[];
  export let referenceMemberForces: Record<string, number>;
  export let knownReactions: Record<string, number>;
  export let knownMemberForces: Record<string, number>;
  export let onSubmitAnswers: (solved: Record<string, number>, score: number, misconceptions: string[]) => void;
  export let onStepAttempt: (data: {
    isCorrect: boolean;
    score: number;
    answersSnapshot: any;
    feedbackMessages: string[];
    misconceptions: string[];
    hintLevelUsed: number;
  }) => void = () => {};

  let showFeedback = false;
  let isCorrect = false;
  let feedbacks: Record<string, AnswerFeedback> = {};
  let score = 0;
  let hintLevel = 0;

  // Decide hint based on whether they reversed signs, otherwise default to tension_compression_confusion
  $: hasSignError = Object.values(feedbacks).some(f => f.status === 'sign_reversed');
  $: hintKey = hasSignError ? 'sign_reversed' : 'tension_compression_confusion';
  $: hintText = hintLevel > 0 ? getHintText(guidedHints[hintKey], hintLevel, $locale) : '';

  function handleNeedHint() {
    if (hintLevel < 3) {
      hintLevel++;
      onStepAttempt({
        isCorrect: false,
        score: 0.0,
        answersSnapshot: { jointId, answers },
        feedbackMessages: [$locale === 'id' ? `Meminta petunjuk tingkat ${hintLevel}` : `Requested hint level ${hintLevel}`],
        misconceptions: [],
        hintLevelUsed: hintLevel
      });
    }
  }

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

    onStepAttempt({
      isCorrect,
      score,
      answersSnapshot: { jointId, answers: { ...answers } },
      feedbackMessages: Object.values(feedbacks).map(f => f.message),
      misconceptions: Array.from(localMisconceptions),
      hintLevelUsed: hintLevel
    });
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

  <!-- Hint Section -->
  <div class="hint-section">
    {#if hintLevel === 0}
      <button type="button" class="btn btn-hint" on:click={handleNeedHint}>
        💡 {$locale === 'id' ? 'Butuh Petunjuk?' : 'Need a Hint?'}
      </button>
    {:else}
      <div class="hint-box animate-fade-in">
        <div class="hint-header">
          <span>💡 {$locale === 'id' ? `Petunjuk Tingkat ${hintLevel}` : `Hint Level ${hintLevel}`}</span>
          {#if hintLevel < 3}
            <button type="button" class="btn btn-hint-more" on:click={handleNeedHint}>
              {$locale === 'id' ? 'Petunjuk Lebih Detil' : 'More Detailed Hint'}
            </button>
          {/if}
        </div>
        <p class="hint-text">{hintText}</p>
        <span class="hint-warning">
          ⚠️ {$locale === 'id' 
            ? 'Penggunaan petunjuk dapat sedikit mengurangi skor maksimal langkah ini.' 
            : 'Using hints may slightly reduce the maximum score for this step.'}
        </span>
      </div>
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

  .hint-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--border-color);
  }

  .btn-hint {
    background-color: transparent;
    border: 1px solid var(--color-primary);
    color: var(--color-primary);
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    align-self: flex-start;
  }

  .btn-hint:hover {
    background-color: rgba(37, 99, 235, 0.05);
  }

  .hint-box {
    background-color: var(--bg-primary);
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b;
    border-radius: 6px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
  }

  :global(html.dark) .hint-box {
    border-color: rgba(245, 158, 11, 0.2);
    background-color: rgba(245, 158, 11, 0.05);
  }

  .hint-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    font-weight: 700;
    color: #d97706;
  }

  .btn-hint-more {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }

  .hint-text {
    font-size: 0.82rem;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.45;
  }

  .hint-warning {
    font-size: 0.68rem;
    color: var(--text-secondary);
    font-style: italic;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
