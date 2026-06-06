<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussModel } from '../../../lib/domain/truss/types';
  import { checkZeroForceSelection } from '../../../lib/domain/truss/guidedWorkflow';
  import type { ZeroForceSelectionFeedback } from '../../../lib/domain/truss/guidedTypes';

  export let truss: TrussModel;
  export let referenceZeroForceIds: string[];
  export let zeroForceSelections: string[]; // bound list of checked member IDs
  export let onNext: (score: number, misconceptions: string[]) => void;

  let showFeedback = false;
  let isCorrect = false;
  let score = 0;
  let feedback: ZeroForceSelectionFeedback | null = null;

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
</style>
