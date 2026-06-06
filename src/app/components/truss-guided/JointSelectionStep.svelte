<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussModel } from '../../../lib/domain/truss/types';
  import { checkJointCanBeSolved, getRecommendedNextJoints, getUnknownMembersAtJoint } from '../../../lib/domain/truss/guidedWorkflow';
  import type { JointSelectionFeedback } from '../../../lib/domain/truss/guidedTypes';
  import { guidedHints, getHintText } from '../../../lib/domain/truss/guidedHints';

  export let truss: TrussModel;
  export let solvedMemberIds: string[];
  export let onSelectJoint: (jointId: string, misconceptions: string[]) => void;
  export let onStepAttempt: (data: {
    isCorrect: boolean;
    score: number;
    answersSnapshot: any;
    feedbackMessages: string[];
    misconceptions: string[];
    hintLevelUsed: number;
  }) => void = () => {};

  let selectedJointId: string | null = null;
  let feedback: JointSelectionFeedback | null = null;
  let showFeedback = false;
  let hintLevel = 0;

  $: hintText = hintLevel > 0 ? getHintText(guidedHints.wrong_joint_order, hintLevel, $locale) : '';

  function handleNeedHint() {
    if (hintLevel < 3) {
      hintLevel++;
      onStepAttempt({
        isCorrect: false,
        score: 0.0,
        answersSnapshot: { jointId: selectedJointId, solvedMemberIds },
        feedbackMessages: [$locale === 'id' ? `Meminta petunjuk tingkat ${hintLevel}` : `Requested hint level ${hintLevel}`],
        misconceptions: [],
        hintLevelUsed: hintLevel
      });
    }
  }

  const recommendedJoints = getRecommendedNextJoints(truss, solvedMemberIds);

  function selectJoint(id: string) {
    selectedJointId = id;
    showFeedback = true;
    feedback = checkJointCanBeSolved(truss, id, solvedMemberIds);

    const localMisconceptions: string[] = [];
    if (!feedback.isValid && feedback.unknownsCount > 2) {
      localMisconceptions.push('wrong_joint_order');
    }
    onStepAttempt({
      isCorrect: feedback.isValid,
      score: feedback.isValid ? 1.0 : 0.0,
      answersSnapshot: { jointId: id, solvedMemberIds },
      feedbackMessages: [feedback.message],
      misconceptions: localMisconceptions,
      hintLevelUsed: hintLevel
    });
  }

  function handleConfirm() {
    if (!selectedJointId || !feedback) return;
    const localMisconceptions: string[] = [];
    if (!feedback.isValid && feedback.unknownsCount > 2) {
      localMisconceptions.push('wrong_joint_order');
    }
    onSelectJoint(selectedJointId, localMisconceptions);
  }

  function getJointStatusClass(id: string): string {
    const isSelected = selectedJointId === id;
    if (isSelected) {
      if (showFeedback && feedback) {
        return feedback.isValid ? 'correct' : 'incorrect';
      }
      return 'selected';
    }

    // Determine if it is fully solved (0 unknowns)
    const unknowns = getUnknownMembersAtJoint(truss, id, solvedMemberIds);
    if (unknowns.length === 0) return 'solved';

    // Highlight recommended
    if (recommendedJoints.includes(id)) return 'recommended';

    return '';
  }
</script>

<div class="step-card">
  <h3>{$locale === 'id' ? 'Langkah 5: Pemilihan Titik Hubung' : 'Step 5: Select Next Joint'}</h3>
  <p class="step-instruction">
    {$locale === 'id'
      ? 'Pilih titik hubung berikutnya untuk dianalisis. Aturan: pilih titik hubung yang memiliki maksimal 2 gaya batang yang tidak diketahui agar dapat diselesaikan dengan persamaan ΣFx = 0 dan ΣFy = 0.'
      : 'Select the next joint to analyze. Rule: select a joint with at most 2 unknown member forces so it can be solved with ΣFx = 0 and ΣFy = 0.'}
  </p>

  <div class="joints-picker-grid">
    {#each truss.joints as j}
      {@const statusClass = getJointStatusClass(j.id)}
      {@const unknowns = getUnknownMembersAtJoint(truss, j.id, solvedMemberIds)}
      <button 
        type="button"
        class="joint-btn {statusClass}"
        on:click={() => selectJoint(j.id)}
      >
        <span class="joint-label">{j.label}</span>
        <span class="unknown-count-sub">
          {unknowns.length} {$locale === 'id' ? 'tidak diketahui' : 'unknown'}
        </span>
      </button>
    {/each}
  </div>

  {#if showFeedback && feedback}
    <div class="feedback-box {feedback.isValid ? 'correct' : 'incorrect'}">
      <p>{feedback.message}</p>
    </div>
  {/if}

  <div class="actions">
    <button 
      class="btn btn-success" 
      disabled={!selectedJointId || !feedback || !feedback.isValid}
      on:click={handleConfirm}
    >
      {$locale === 'id' ? 'Mulai Selesaikan Titik Hubung' : 'Analyze Selected Joint'}
    </button>
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

  .joints-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.6rem;
  }

  .joint-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.65rem;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }

  .joint-btn:hover {
    border-color: var(--color-primary);
  }

  .joint-btn.selected {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.05);
    font-weight: 700;
  }

  .joint-btn.recommended {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.08);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .joint-btn.correct {
    border-color: #10b981;
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
    font-weight: 700;
  }

  .joint-btn.incorrect {
    border-color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .joint-btn.solved {
    opacity: 0.55;
    background-color: var(--border-color);
    cursor: not-allowed;
  }

  .joint-label {
    font-size: 1rem;
    font-weight: bold;
  }

  .unknown-count-sub {
    font-size: 0.65rem;
    color: var(--text-secondary);
    margin-top: 0.15rem;
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

  .btn-success { background-color: #10b981; color: white; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
