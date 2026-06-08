<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import { misconceptionsDictionary } from '../../../content/learning/misconceptions';
  import HintReplayCard from './HintReplayCard.svelte';
  import type { GuidedStepAttempt, GuidedStepId } from '../../../lib/domain/progress/types';

  export let selectedAttempt: GuidedStepAttempt;
  export let activeProblem: any;
  export let solverResult: any;
  export let referenceZeroForceIds: string[];

  const stepLabels: Record<GuidedStepId, { en: string; id: string }> = {
    overview: { en: 'Overview', id: 'Tinjauan' },
    determinacy: { en: 'Determinacy', id: 'Determinasi' },
    reactions: { en: 'Reactions', id: 'Reaksi Tumpuan' },
    zero_members: { en: 'Zero-Force Members', id: 'Batang Gaya Nol' },
    joint_sequence: { en: 'Joint Selection', id: 'Pemilihan Titik Hubung' },
    member_forces: { en: 'Member Forces', id: 'Gaya Batang' },
    summary: { en: 'Summary', id: 'Ringkasan' }
  };

  function getJointLabel(jointId: string): string {
    const j = activeProblem.joints.find((jt: any) => jt.id === jointId);
    return j ? j.label : jointId;
  }

  function getMemberLabel(memberId: string): string {
    const m = activeProblem.members.find((mem: any) => mem.id === memberId);
    return m ? m.label : memberId;
  }

  function countTrussUnknowns(truss: any) {
    const m = truss.members.length;
    const r = truss.supports.reduce((acc: number, s: any) => acc + (s.type === 'pin' ? 2 : 1), 0);
    const j = truss.joints.length;
    return { m, r, j };
  }

  function classifyTrussByCount(truss: any): 'statically_determinate' | 'statically_indeterminate' | 'unstable' {
    const { m, r, j } = countTrussUnknowns(truss);
    const LHS = m + r;
    const RHS = 2 * j;
    if (LHS < RHS) return 'unstable';
    if (LHS > RHS) return 'statically_indeterminate';
    return 'statically_determinate';
  }
</script>

<div class="details-card card">
  <div class="details-header">
    <h4>
      {$locale === 'id' ? 'Detail Percobaan:' : 'Attempt Details:'}
      <span class="highlight">
        {$locale === 'id' ? stepLabels[selectedAttempt.stepId as GuidedStepId].id : stepLabels[selectedAttempt.stepId as GuidedStepId].en}
      </span>
      ({$locale === 'id' ? `Percobaan #${selectedAttempt.attemptNumber}` : `Attempt #${selectedAttempt.attemptNumber}`})
    </h4>
    <span class="badge {selectedAttempt.isCorrect ? 'correct' : 'incorrect'}">
      {selectedAttempt.isCorrect ? ($locale === 'id' ? 'Benar' : 'Correct') : ($locale === 'id' ? 'Salah' : 'Incorrect')}
    </span>
  </div>

  <div class="details-content">
    <!-- Determinacy Step Details -->
    {#if selectedAttempt.stepId === 'determinacy' && selectedAttempt.answersSnapshot}
      {@const answers = selectedAttempt.answersSnapshot}
      {@const refVal = countTrussUnknowns(activeProblem)}
      {@const refClass = classifyTrussByCount(activeProblem)}
      <div class="answers-comparison">
        <h5>{$locale === 'id' ? 'Jawaban yang Dimasukkan:' : 'Submitted Answers:'}</h5>
        <div class="comparison-grid">
          <div class="comparison-row">
            <span class="label">{$locale === 'id' ? 'Jumlah Batang (m)' : 'Number of Members (m)'}</span>
            <span class="user-val {answers.m === refVal.m ? 'correct' : 'incorrect'}">{answers.m ?? '-'}</span>
            <span class="ref-val">({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal.m})</span>
          </div>
          <div class="comparison-row">
            <span class="label">{$locale === 'id' ? 'Jumlah Reaksi (r)' : 'Number of Reactions (r)'}</span>
            <span class="user-val {answers.r === refVal.r ? 'correct' : 'incorrect'}">{answers.r ?? '-'}</span>
            <span class="ref-val">({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal.r})</span>
          </div>
          <div class="comparison-row">
            <span class="label">{$locale === 'id' ? 'Jumlah Titik Hubung (j)' : 'Number of Joints (j)'}</span>
            <span class="user-val {answers.j === refVal.j ? 'correct' : 'incorrect'}">{answers.j ?? '-'}</span>
            <span class="ref-val">({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal.j})</span>
          </div>
          <div class="comparison-row">
            <span class="label">{$locale === 'id' ? 'Klasifikasi' : 'Classification'}</span>
            <span class="user-val {answers.classification === refClass ? 'correct' : 'incorrect'}">
              {#if answers.classification === 'statically_determinate'}{$locale === 'id' ? 'Statis Tertentu' : 'Statically Determinate'}
              {:else if answers.classification === 'statically_indeterminate'}{$locale === 'id' ? 'Statis Tak Tentu' : 'Statically Indeterminate'}
              {:else if answers.classification === 'unstable'}{$locale === 'id' ? 'Labil (Unstable)' : 'Unstable'}
              {:else}-
              {/if}
            </span>
            <span class="ref-val">
              ({$locale === 'id' ? 'Benar:' : 'Correct:'}
              {refClass === 'statically_determinate' ? ($locale === 'id' ? 'Statis Tertentu' : 'Statically Determinate') : refClass === 'statically_indeterminate' ? ($locale === 'id' ? 'Statis Tak Tentu' : 'Statically Indeterminate') : ($locale === 'id' ? 'Labil' : 'Unstable')})
            </span>
          </div>
        </div>
      </div>

    <!-- Reactions Step Details -->
    {:else if selectedAttempt.stepId === 'reactions' && selectedAttempt.answersSnapshot}
      {@const rxAnswers = selectedAttempt.answersSnapshot.answers}
      <div class="answers-comparison">
        <h5>{$locale === 'id' ? 'Reaksi Tumpuan yang Dimasukkan:' : 'Submitted Support Reactions:'}</h5>
        <div class="comparison-grid">
          {#each Object.keys(solverResult.reactions) as rxKey}
            {@const userVal = rxAnswers[rxKey]}
            {@const refVal = solverResult.reactions[rxKey]}
            {@const diff = userVal !== null && userVal !== undefined ? Math.abs(Number(userVal) - refVal) : 999}
            {@const isRxCorrect = diff <= 2}
            <div class="comparison-row">
              <span class="label font-mono">{rxKey}</span>
              <span class="user-val {isRxCorrect ? 'correct' : 'incorrect'}">
                {userVal !== null && userVal !== undefined ? `${userVal} N` : '-'}
              </span>
              <span class="ref-val">({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal} N)</span>
            </div>
          {/each}
        </div>
      </div>

    <!-- Zero Force Members Details -->
    {:else if selectedAttempt.stepId === 'zero_members' && selectedAttempt.answersSnapshot}
      {@const selections = selectedAttempt.answersSnapshot.selectedMemberIds}
      {@const correctSelections = selections.filter(id => referenceZeroForceIds.includes(id))}
      {@const falsePositives = selections.filter(id => !referenceZeroForceIds.includes(id))}
      {@const missed = referenceZeroForceIds.filter(id => !selections.includes(id))}
      <div class="zero-members-comparison">
        <h5>{$locale === 'id' ? 'Identifikasi Batang Gaya Nol:' : 'Zero-Force Members Identification:'}</h5>
        <div class="zero-feedback-lists">
          <div class="feedback-col">
            <span class="col-title text-success">✓ {$locale === 'id' ? 'Benar Diidentifikasi' : 'Correctly Identified'}</span>
            {#if correctSelections.length > 0}
              <div class="labels-row">
                {#each correctSelections as id}
                  <span class="badge badge-success">{getMemberLabel(id)}</span>
                {/each}
              </div>
            {:else}
              <p class="empty-list-desc">-</p>
            {/if}
          </div>

          <div class="feedback-col">
            <span class="col-title text-error">✗ {$locale === 'id' ? 'Salah Diidentifikasi (Bukan ZFM)' : 'False Positives (Not ZFM)'}</span>
            {#if falsePositives.length > 0}
              <div class="labels-row">
                {#each falsePositives as id}
                  <span class="badge badge-error">{getMemberLabel(id)}</span>
                {/each}
              </div>
            {:else}
              <p class="empty-list-desc">-</p>
            {/if}
          </div>

          <div class="feedback-col">
            <span class="col-title text-warning">⚠️ {$locale === 'id' ? 'Terlewatkan' : 'Missed'}</span>
            {#if missed.length > 0}
              <div class="labels-row">
                {#each missed as id}
                  <span class="badge badge-warning">{getMemberLabel(id)}</span>
                {/each}
              </div>
            {:else}
              <p class="empty-list-desc">-</p>
            {/if}
          </div>
        </div>
      </div>

    <!-- Joint Selection Details -->
    {:else if selectedAttempt.stepId === 'joint_sequence' && selectedAttempt.answersSnapshot}
      {@const jointId = selectedAttempt.answersSnapshot.jointId}
      <div class="joint-select-comparison">
        <h5>{$locale === 'id' ? 'Titik Hubung yang Dipilih:' : 'Selected Joint:'}</h5>
        <p class="selected-joint-text">
          {$locale === 'id' ? 'Titik Hubung' : 'Joint'} <strong>{jointId ? getJointLabel(jointId) : '-'}</strong>
        </p>
      </div>

    <!-- Member Forces Step Details -->
    {:else if selectedAttempt.stepId === 'member_forces' && selectedAttempt.answersSnapshot}
      {@const jointId = selectedAttempt.answersSnapshot.jointId}
      {@const mAnswers = selectedAttempt.answersSnapshot.answers || {}}
      <div class="answers-comparison">
        <h5>
          {$locale === 'id' ? `Perhitungan Gaya Batang pada Titik Hubung ${getJointLabel(jointId)}:` : `Member Force Calculations at Joint ${getJointLabel(jointId)}:`}
        </h5>
        <div class="comparison-grid">
          {#each Object.keys(mAnswers) as mId}
            {@const rawVal = mAnswers[mId]}
            {@const userVal = rawVal === null || rawVal === undefined ? null : rawVal}
            {@const refVal = solverResult.memberForces[mId] ?? 0}
            {@const diff = userVal !== null ? Math.abs(userVal - refVal) : 999}
            {@const isForceCorrect = diff <= 2}
            <div class="comparison-row">
              <span class="label font-mono">{$locale === 'id' ? 'Batang' : 'Member'} {getMemberLabel(mId)}</span>
              <span class="user-val {isForceCorrect ? 'correct' : 'incorrect'}">
                {userVal !== null ? `${userVal} N` : '-'}
                {#if userVal !== null}
                  ({userVal > 0 ? ($locale === 'id' ? 'Tarik' : 'Tension') : userVal < 0 ? ($locale === 'id' ? 'Tekan' : 'Compression') : 'Zero'})
                {/if}
              </span>
              <span class="ref-val">
                ({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal} N
                {refVal > 0 ? ($locale === 'id' ? 'Tarik' : 'Tension') : refVal < 0 ? ($locale === 'id' ? 'Tekan' : 'Compression') : 'Zero'})
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- System Feedback Message callout -->
    {#if selectedAttempt.feedbackMessages && selectedAttempt.feedbackMessages.length > 0}
      <div class="feedback-callout">
        <h5>{$locale === 'id' ? 'Respon Sistem:' : 'System Response:'}</h5>
        <ul>
          {#each selectedAttempt.feedbackMessages as msg}
            <li>{msg}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <!-- Misconception Highlight inside attempt details -->
    {#if selectedAttempt.misconceptions && selectedAttempt.misconceptions.length > 0}
      <div class="misconceptions-callout">
        <h5>{$locale === 'id' ? 'Kesalahan Berpikir Terdeteksi:' : 'Misconception Flagged:'}</h5>
        <div class="tags-group">
          {#each selectedAttempt.misconceptions as misc}
            {#if misconceptionsDictionary[misc]}
              <span class="callout-misc-badge">
                ⚠️ {$locale === 'id' ? misconceptionsDictionary[misc].title.id : misconceptionsDictionary[misc].title.en}
              </span>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- Hint Used Card -->
    <HintReplayCard {selectedAttempt} />
  </div>
</div>

<style>
  .card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .details-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .details-header h4 {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .details-header .highlight {
    color: var(--color-primary);
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }

  .badge.correct {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .badge.incorrect {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .details-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .answers-comparison h5,
  .zero-members-comparison h5,
  .joint-select-comparison h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.82rem;
    font-weight: bold;
    color: var(--text-secondary);
  }

  .comparison-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .comparison-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    font-size: 0.8rem;
    align-items: center;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.35rem;
  }

  .comparison-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .comparison-row .label {
    font-weight: 600;
    color: var(--text-primary);
  }

  .comparison-row .user-val {
    font-weight: 700;
  }

  .comparison-row .user-val.correct {
    color: #10b981;
  }

  .comparison-row .user-val.incorrect {
    color: #ef4444;
  }

  .comparison-row .ref-val {
    color: var(--text-secondary);
    font-style: italic;
    text-align: right;
  }

  .zero-feedback-lists {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .feedback-col {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .col-title {
    font-size: 0.75rem;
    font-weight: bold;
  }

  .text-success { color: #10b981; }
  .text-error { color: #ef4444; }
  .text-warning { color: #f59e0b; }

  .labels-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .badge-success { background-color: rgba(16, 185, 129, 0.15); color: #10b981; }
  .badge-error { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; }
  .badge-warning { background-color: rgba(245, 158, 11, 0.15); color: #d97706; }

  .empty-list-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .selected-joint-text {
    font-size: 0.85rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.5rem;
    display: inline-block;
  }

  .feedback-callout {
    background-color: rgba(37, 99, 235, 0.03);
    border: 1px solid var(--border-color);
    border-left: 3px solid var(--color-primary);
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
  }

  .feedback-callout h5,
  .misconceptions-callout h5 {
    margin: 0 0 0.25rem 0;
    font-size: 0.8rem;
    font-weight: bold;
    color: var(--text-primary);
  }

  .feedback-callout ul {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .misconceptions-callout {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    background-color: rgba(245, 158, 11, 0.03);
    border: 1px solid var(--border-color);
    border-left: 3px solid #f59e0b;
  }

  .tags-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.25rem;
  }

  .callout-misc-badge {
    font-size: 0.75rem;
    font-weight: bold;
    color: #b45309;
    background-color: #fef3c7;
    border: 1px solid #fde68a;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }

  :global(html.dark) .callout-misc-badge {
    color: #fcd34d;
    background-color: rgba(217, 119, 6, 0.15);
    border-color: rgba(217, 119, 6, 0.3);
  }
</style>
