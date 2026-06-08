<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussModel } from '../../../lib/domain/truss/types';
  import { checkZeroForceSelection } from '../../../lib/domain/truss/guidedWorkflow';
  import type { ZeroForceSelectionFeedback } from '../../../lib/domain/truss/guidedTypes';
  import { guidedHints, getHintText } from '../../../lib/domain/truss/guidedHints';
  import type { ZeroForceSnapshot } from '../../../lib/domain/progress/types';

  export let truss: TrussModel;
  export let referenceZeroForceIds: string[];
  export let zeroForceSelections: string[]; // bound list of checked member IDs
  export let onNext: (score: number, misconceptions: string[]) => void;
  export let onStepAttempt: (data: {
    isCorrect: boolean;
    score: number;
    answersSnapshot: ZeroForceSnapshot;
    feedbackMessages: string[];
    misconceptions: string[];
    hintLevelUsed: number;
  }) => void = () => {};

  let showFeedback = false;
  let isCorrect = false;
  let score = 0;
  let feedback: ZeroForceSelectionFeedback | null = null;
  let hintLevel = 0;

  // Decide hint based on user's mistakes if possible, otherwise default to zero_force_missed
  $: hintKey = (feedback && feedback.falsePositiveIds.length > 0)
    ? 'zero_force_false_positive'
    : 'zero_force_missed';

  $: hintText = hintLevel > 0 ? getHintText(guidedHints[hintKey], hintLevel, $locale) : '';

  function handleNeedHint() {
    if (hintLevel < 3) {
      hintLevel++;
      onStepAttempt({
        isCorrect: false,
        score: 0.0,
        answersSnapshot: { kind: 'zero_members', selectedMemberIds: [...zeroForceSelections] },
        feedbackMessages: [$locale === 'id' ? `Meminta petunjuk tingkat ${hintLevel}` : `Requested hint level ${hintLevel}`],
        misconceptions: [],
        hintLevelUsed: hintLevel
      });
    }
  }

  const allMemberIds = truss.members.map(m => m.id);

  function toggleMember(id: string) {
    if (isCorrect) return;
    if (zeroForceSelections.includes(id)) {
      zeroForceSelections = zeroForceSelections.filter(x => x !== id);
    } else {
      zeroForceSelections = [...zeroForceSelections, id];
    }
  }
  function handleVerify() {
    showFeedback = true;
    feedback = checkZeroForceSelection(zeroForceSelections, referenceZeroForceIds, allMemberIds);
    score = feedback.score;
    isCorrect = feedback.missedIds.length === 0 && feedback.falsePositiveIds.length === 0;

    onStepAttempt({
      isCorrect,
      score,
      answersSnapshot: { kind: 'zero_members', selectedMemberIds: [...zeroForceSelections] },
      feedbackMessages: [feedback.message],
      misconceptions: [
        ...(feedback.missedIds.length > 0 ? ['zero_force_missed'] : []),
        ...(feedback.falsePositiveIds.length > 0 ? ['zero_force_false_positive'] : [])
      ],
      hintLevelUsed: hintLevel
    });
  }

  function handleNext() {
    const localMisconceptions: string[] = [];
    if (feedback) {
      if (feedback.missedIds.length > 0) localMisconceptions.push('zero_force_missed');
      if (feedback.falsePositiveIds.length > 0) localMisconceptions.push('zero_force_false_positive');
    }
    onNext(score, localMisconceptions);
  }

  function getMemberStatusClass(id: string): string {
    if (!showFeedback) {
      return zeroForceSelections.includes(id) ? 'selected' : '';
    }
    
    const isReferenceZero = referenceZeroForceIds.includes(id);
    const isUserSelected = zeroForceSelections.includes(id);

    if (isReferenceZero && isUserSelected) return 'correct';
    if (isReferenceZero && !isUserSelected) return 'missed animate-pulse';
    if (!isReferenceZero && isUserSelected) return 'false-positive';
    return '';
  }

  function getMemberStatusText(id: string): string {
    if (!showFeedback) return '';
    const isReferenceZero = referenceZeroForceIds.includes(id);
    const isUserSelected = zeroForceSelections.includes(id);

    if (isReferenceZero && isUserSelected) return $locale === 'id' ? '✓ Benar' : '✓ Correct';
    if (isReferenceZero && !isUserSelected) return $locale === 'id' ? '⚠️ Terlewat (ZFM)' : '⚠️ Missed ZFM';
    if (!isReferenceZero && isUserSelected) return $locale === 'id' ? '✗ Bukan ZFM' : '✗ Not ZFM';
    return '';
  }
</script>

<div class="step-card">
  <h3>{$locale === 'id' ? 'Langkah 4: Batang Gaya Nol (Zero-Force)' : 'Step 4: Zero-Force Members'}</h3>
  <p class="step-instruction">
    {$locale === 'id'
      ? 'Identifikasi semua batang berdaya nol (ZFM) dengan inspeksi visual. Terapkan Aturan 1 (2 batang non-kolinear di titik hubung bebas tanpa beban) dan Aturan 2 (3 batang di titik hubung bebas di mana 2 di antaranya kolinear).'
      : 'Identify all zero-force members (ZFMs) by visual inspection. Apply Rule 1 (2 non-collinear members at an unsupported, unloaded joint) and Rule 2 (3 members at unsupported, unloaded joint where 2 are collinear).'}
  </p>

  <div class="members-selector-grid">
    {#each truss.members as m}
      {@const statusClass = getMemberStatusClass(m.id)}
      {@const statusText = getMemberStatusText(m.id)}
      <button 
        type="button"
        class="member-btn {statusClass}"
        on:click={() => toggleMember(m.id)}
        disabled={isCorrect}
      >
        <span class="member-label">{m.label}</span>
        {#if statusText}
          <span class="status-indicator">{statusText}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if showFeedback && feedback}
    <div class="feedback-box {isCorrect ? 'correct' : 'incorrect'}">
      <p>{feedback.message}</p>
      
      <div class="rules-explanation">
        <h5>{$locale === 'id' ? 'Pengingat Aturan Batang Gaya Nol:' : 'Zero-Force Member Rules Reminder:'}</h5>
        <ul>
          <li>
            <strong>{$locale === 'id' ? 'Aturan 1:' : 'Rule 1:'}</strong>
            {$locale === 'id'
              ? '2 batang non-kolinear bertemu di titik hubung tanpa tumpuan dan tanpa beban luar -> kedua batang berdaya nol.'
              : '2 non-collinear members meet at an unloaded, unsupported joint -> both carry zero force.'}
          </li>
          <li>
            <strong>{$locale === 'id' ? 'Aturan 2:' : 'Rule 2:'}</strong>
            {$locale === 'id'
              ? '3 batang bertemu di titik hubung tanpa tumpuan dan tanpa beban luar di mana 2 di antaranya kolinear -> batang ketiga (non-kolinear) berdaya nol.'
              : '3 members meet at an unloaded, unsupported joint where 2 are collinear -> the third (non-collinear) member carries zero force.'}
          </li>
        </ul>
      </div>
    </div>
  {/if}

  <div class="actions">
    {#if !isCorrect}
      <button class="btn btn-primary" on:click={handleVerify}>
        {$locale === 'id' ? 'Verifikasi' : 'Verify Selections'}
      </button>
    {:else}
      <button class="btn btn-success" on:click={handleNext}>
        {$locale === 'id' ? 'Lanjutkan' : 'Next Step'}
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

  .members-selector-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.6rem;
  }

  .member-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }

  .member-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.05);
  }

  .member-btn.selected {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.1);
    font-weight: 700;
  }

  .member-btn.correct {
    border-color: #10b981;
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
    font-weight: 700;
  }

  .member-btn.missed {
    border-color: #f59e0b;
    background-color: rgba(245, 158, 11, 0.1);
    color: #d97706;
    font-weight: 700;
  }

  .member-btn.false-positive {
    border-color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    font-weight: 700;
  }

  .member-label {
    font-size: 0.9rem;
    font-weight: bold;
  }

  .status-indicator {
    font-size: 0.68rem;
    margin-top: 0.2rem;
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
  }

  .feedback-box.incorrect {
    background-color: rgba(239, 68, 68, 0.06);
    border-left: 4px solid #f59e0b;
  }

  .rules-explanation {
    margin-top: 0.6rem;
    padding-top: 0.6rem;
    border-top: 1px dashed var(--border-color);
  }

  .rules-explanation h5 {
    margin: 0 0 0.35rem 0;
    font-size: 0.8rem;
    font-weight: bold;
    color: var(--text-primary);
  }

  .rules-explanation ul {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.76rem;
  }

  .rules-explanation li {
    margin-bottom: 0.25rem;
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
