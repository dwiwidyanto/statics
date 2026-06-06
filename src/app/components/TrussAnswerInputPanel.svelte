<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import type { TrussMember } from '../../lib/domain/truss/types';
  import type { TrussScoreResult, AnswerFeedback } from '../../lib/domain/truss/scoring';

  export let reactionsReference: Record<string, number>;
  export let members: TrussMember[];
  
  export let onCheck: (answers: {
    reactions: Record<string, number | null>;
    memberForces: Record<string, number | null>;
  }) => void;
  export let onSave: () => void;
  export let checkedResult: TrussScoreResult | null = null;
  export let isSaved = false;

  // Internal inputs state
  let reactionAnswers: Record<string, string> = {};
  let memberAnswers: Record<string, string> = {};

  // Initialize input fields based on reference keys
  $: {
    const rxKeys = Object.keys(reactionsReference);
    for (const key of rxKeys) {
      if (!(key in reactionAnswers)) {
        reactionAnswers[key] = '';
      }
    }
    for (const m of members) {
      if (!(m.id in memberAnswers)) {
        memberAnswers[m.id] = '';
      }
    }
  }

  function handleCheck() {
    const parsedReactions: Record<string, number | null> = {};
    const parsedMemberForces: Record<string, number | null> = {};

    for (const key of Object.keys(reactionsReference)) {
      const val = reactionAnswers[key];
      parsedReactions[key] = (val === undefined || val.trim() === '') ? null : parseFloat(val);
    }

    for (const m of members) {
      const val = memberAnswers[m.id];
      parsedMemberForces[m.id] = (val === undefined || val.trim() === '') ? null : parseFloat(val);
    }

    onCheck({
      reactions: parsedReactions,
      memberForces: parsedMemberForces
    });
  }

  function handleReset() {
    reactionAnswers = {};
    memberAnswers = {};
    checkedResult = null;
    isSaved = false;
  }

  function getFeedbackText(feedback: AnswerFeedback | undefined): { text: string; css: string } {
    if (!feedback) return { text: '', css: '' };
    switch (feedback.status) {
      case 'correct':
        return { text: $locale === 'id' ? '✅ Benar' : '✅ Correct', css: 'correct' };
      case 'missing':
        return { text: $locale === 'id' ? '⚠️ Kosong' : '⚠️ Missing', css: 'missing' };
      case 'sign_reversed':
        return { text: $locale === 'id' ? '🔄 Tanda terbalik (+/-)' : '🔄 Sign reversed (+/-)', css: 'sign-reversed' };
      case 'zero_expected':
        return { text: $locale === 'id' ? '⭕ Harusnya batang nol' : '⭕ Expected zero-force', css: 'zero-expected' };
      case 'nonzero_expected':
        return { text: $locale === 'id' ? '❌ Harusnya ada gaya' : '❌ Expected non-zero force', css: 'incorrect' };
      case 'incorrect':
      default:
        return { text: $locale === 'id' ? '❌ Salah' : '❌ Incorrect', css: 'incorrect' };
    }
  }
</script>

<div class="input-panel-card">
  <div class="panel-header">
    <h3>{$locale === 'id' ? 'Masukkan Jawaban Anda' : 'Enter Your Answers'}</h3>
    <span class="convention-badge">
      {$locale === 'id' ? 'Konvensi: Tarik (+), Tekan (-)' : 'Convention: Tension (+), Compression (-)'}
    </span>
  </div>

  <div class="convention-desc">
    <p>
      {$locale === 'id' 
        ? 'Tentukan reaksi tumpuan (positif ke kanan/atas, negatif ke kiri/bawah) dan gaya dalam batang (positif untuk tarik, negatif untuk tekan, atau 0).' 
        : 'Determine support reactions (positive right/up, negative left/down) and member axial forces (positive for tension, negative for compression, or 0).'}
    </p>
  </div>

  <form on:submit|preventDefault={handleCheck}>
    <!-- Section 1: Support Reactions -->
    <div class="form-section">
      <h4>{$locale === 'id' ? '1. Reaksi Tumpuan' : '1. Support Reactions'}</h4>
      <div class="inputs-grid reactions-grid">
        {#each Object.keys(reactionsReference) as rxKey}
          {@const fb = checkedResult?.perReactionFeedback[rxKey]}
          {@const fbInfo = getFeedbackText(fb)}
          <div class="input-group">
            <label for="input-{rxKey}">
              {rxKey}
            </label>
            <div class="input-wrapper">
              <input
                id="input-{rxKey}"
                type="number"
                step="any"
                placeholder="0.0"
                bind:value={reactionAnswers[rxKey]}
                disabled={isSaved}
              />
              <span class="unit">N</span>
            </div>
            {#if fbInfo.text}
              <span class="feedback-label {fbInfo.css}">{fbInfo.text}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Section 2: Member Axial Forces -->
    <div class="form-section">
      <h4>{$locale === 'id' ? '2. Gaya Axial Batang' : '2. Member Axial Forces'}</h4>
      <div class="inputs-grid members-grid">
        {#each members as m}
          {@const fb = checkedResult?.perMemberFeedback[m.id]}
          {@const fbInfo = getFeedbackText(fb)}
          <div class="input-group">
            <label for="input-mem-{m.id}">
              {$locale === 'id' ? `Batang ${m.label}` : `Member ${m.label}`}
            </label>
            <div class="input-wrapper">
              <input
                id="input-mem-{m.id}"
                type="number"
                step="any"
                placeholder="0.0"
                bind:value={memberAnswers[m.id]}
                disabled={isSaved}
              />
              <span class="unit">N</span>
            </div>
            {#if fbInfo.text}
              <span class="feedback-label {fbInfo.css}">{fbInfo.text}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Actions Row -->
    <div class="actions-row">
      <button 
        type="submit" 
        class="btn btn-primary check-btn"
        disabled={isSaved}
      >
        {$locale === 'id' ? 'Periksa Jawaban' : 'Check Answers'}
      </button>

      <button 
        type="button" 
        class="btn btn-success save-btn"
        disabled={!checkedResult || isSaved}
        on:click={onSave}
      >
        {isSaved 
          ? ($locale === 'id' ? 'Tersimpan' : 'Saved') 
          : ($locale === 'id' ? 'Simpan Progres' : 'Save Attempt')}
      </button>

      <button 
        type="button" 
        class="btn btn-secondary reset-btn"
        on:click={handleReset}
      >
        {$locale === 'id' ? 'Atur Ulang' : 'Reset Inputs'}
      </button>
    </div>
  </form>

  {#if checkedResult}
    <div class="score-summary-box {checkedResult.completed ? 'completed' : 'partial'}">
      <div class="score-header">
        <span class="score-title">{$locale === 'id' ? 'Skor Hasil Latihan:' : 'Practice Attempt Score:'}</span>
        <span class="score-val">{Math.round(checkedResult.score * 100)}%</span>
      </div>
      <div class="score-badge-indicator {checkedResult.completed ? 'completed' : 'partial'}">
        {checkedResult.completed 
          ? ($locale === 'id' ? 'Selesai (Lulus)' : 'Completed (Passed)') 
          : ($locale === 'id' ? 'Belum Selesai (Skor < 80%)' : 'Incomplete (Score < 80%)')}
      </div>
      {#if checkedResult.summaryMessages.length > 0}
        <ul class="summary-messages-list">
          {#each checkedResult.summaryMessages.slice(0, 5) as msg}
            <li>{msg}</li>
          {/each}
          {#if checkedResult.summaryMessages.length > 5}
            <li class="more-messages">
              {$locale === 'id' 
                ? `...dan ${checkedResult.summaryMessages.length - 5} kesalahan lainnya. Periksa detail di atas.` 
                : `...and ${checkedResult.summaryMessages.length - 5} more errors. Check individual feedback above.`}
            </li>
          {/if}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  .input-panel-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .panel-header h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }

  .convention-badge {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    color: var(--text-secondary);
  }

  .convention-desc {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .form-section {
    border-top: 1px dashed var(--border-color);
    padding-top: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .form-section h4 {
    font-size: 0.88rem;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
  }

  .inputs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.75rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .input-group label {
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
    padding: 0.4rem 1.5rem 0.4rem 0.5rem;
    font-size: 0.88rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
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
    pointer-events: none;
  }

  .feedback-label {
    font-size: 0.72rem;
    font-weight: 700;
    margin-top: 0.1rem;
  }

  .feedback-label.correct { color: #10b981; }
  .feedback-label.missing { color: #f59e0b; }
  .feedback-label.sign-reversed { color: #ef4444; }
  .feedback-label.zero-expected { color: #3b82f6; }
  .feedback-label.incorrect { color: #ef4444; }

  .actions-row {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .btn {
    font-size: 0.82rem;
    font-weight: 700;
    padding: 0.5rem 0.85rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    transition: background-color 0.15s, transform 0.1s;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .check-btn {
    background-color: var(--color-primary, #2563eb);
    color: white;
  }
  .check-btn:hover { background-color: var(--color-primary-hover, #1d4ed8); }

  .save-btn {
    background-color: #10b981;
    color: white;
  }
  .save-btn:hover { background-color: #0d9488; }

  .reset-btn {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }
  .reset-btn:hover { background-color: var(--border-color); }

  /* Score Summary */
  .score-summary-box {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
  }

  .score-summary-box.completed {
    background-color: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .score-summary-box.partial {
    background-color: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.3);
  }

  .score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .score-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .score-val {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .score-badge-indicator {
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 0.5rem;
  }

  .score-badge-indicator.completed {
    background-color: #10b981;
    color: white;
  }

  .score-badge-indicator.partial {
    background-color: #f59e0b;
    color: white;
  }

  .summary-messages-list {
    margin: 0;
    padding-left: 1rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .summary-messages-list li {
    margin-bottom: 0.2rem;
  }

  .more-messages {
    list-style: none;
    font-style: italic;
    color: var(--text-secondary);
  }
</style>
