<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';

  export let score: number;
  export let scoreBreakdown: {
    determinacy: number;
    reactions: number;
    zeroForceMembers: number;
    jointSelection: number;
    memberForces: number;
  };
  export let misconceptions: string[];
  export let onFinish: () => void;

  const completed = score >= 0.8;

  const skillLabels: Record<string, { id: string; en: string }> = {
    determinacy: { id: 'Determinasi & Stabilitas', en: 'Determinacy & Stability' },
    reactions: { id: 'Reaksi Tumpuan', en: 'Support Reactions' },
    zeroForceMembers: { id: 'Batang Gaya Nol', en: 'Zero-Force Members' },
    jointSelection: { id: 'Urutan Pemilihan Titik', en: 'Joint Solving Order' },
    memberForces: { id: 'Perhitungan Gaya Batang', en: 'Member Force Calculations' }
  };

  const misconceptionDetails: Record<string, { title: { id: string; en: string }; desc: { id: string; en: string } }> = {
    sign_reversed: {
      title: { id: 'Tanda Terbalik (+/-)', en: 'Sign Convention Reversal' },
      desc: { id: 'Ingat bahwa gaya Tarik bernilai Positif (+) dan Tekan bernilai Negatif (-). Periksa kembali persamaan ΣFx dan ΣFy Anda.', en: 'Remember that Tension forces are Positive (+) and Compression are Negative (-). Check your ΣFx and ΣFy sign assignments.' }
    },
    zero_force_missed: {
      title: { id: 'Batang Nol Terlewat', en: 'Missed Zero-Force Member' },
      desc: { id: 'Beberapa batang berdaya nol tidak teridentifikasi. Tinjau kembali Aturan 1 dan Aturan 2 pada titik hubung bebas.', en: 'Some zero-force members were missed. Review Rule 1 and Rule 2 for unloaded, unsupported joints.' }
    },
    zero_force_false_positive: {
      title: { id: 'Salah Menilai Batang Nol', en: 'False Positive Zero-Force Member' },
      desc: { id: 'Batang yang aktif menyalurkan gaya salah diidentifikasi sebagai batang nol.', en: 'Active force-carrying members were incorrectly flagged as zero-force.' }
    },
    wrong_joint_order: {
      title: { id: 'Urutan Penyelesaian Salah', en: 'Incorrect Joint Sequence' },
      desc: { id: 'Memilih titik hubung dengan lebih dari 2 gaya batang yang tidak diketahui. Metode Titik Hubung hanya dapat menyelesaikan maksimal 2 unknowns.', en: 'Selected joints with more than 2 unknowns. The Method of Joints requires solving joints with at most 2 unknowns.' }
    },
    reaction_count_error: {
      title: { id: 'Kesalahan Reaksi Tumpuan', en: 'Support Reaction Counting' },
      desc: { id: 'Salah menghitung derajat kebebasan tumpuan. Sendi = 2, Rol = 1.', en: 'Incorrectly counted support reaction constraints. Pin = 2, Roller = 1.' }
    },
    tension_compression_confusion: {
      title: { id: 'Kebingungan Tarik/Tekan', en: 'Tension/Compression Confusion' },
      desc: { id: 'Kebingungan dalam menginterpretasikan hasil gaya batang.', en: 'Confusion interpreting compression vs tension member states.' }
    }
  };

  function getMisconceptionKeys(list: string[]): string[] {
    return Array.from(new Set(list)).filter(k => k in misconceptionDetails);
  }

  $: activeMisconceptions = getMisconceptionKeys(misconceptions);
</script>

<div class="summary-card">
  <div class="summary-header">
    <span class="badge {completed ? 'pass' : 'partial'}">
      {completed 
        ? ($locale === 'id' ? 'Selesai (Lulus)' : 'Completed (Passed)') 
        : ($locale === 'id' ? 'Selesai (Perlu Ulang)' : 'Incomplete (Needs Retry)')}
    </span>
    <h2>{$locale === 'id' ? 'Hasil Evaluasi Latihan' : 'Practice Evaluation Results'}</h2>
  </div>

  <div class="score-display">
    <span class="score-pct">{Math.round(score * 100)}%</span>
    <span class="score-label">{$locale === 'id' ? 'Skor Keseluruhan' : 'Overall Score'}</span>
  </div>

  <!-- Skill Breakdown -->
  <div class="skills-section">
    <h4>{$locale === 'id' ? 'Detail Penguasaan Materi' : 'Skill Mastery Details'}</h4>
    <div class="skills-list">
      {#each Object.entries(scoreBreakdown) as [skill, val]}
        <div class="skill-row">
          <div class="skill-info">
            <span class="skill-name">{$locale === 'id' ? skillLabels[skill].id : skillLabels[skill].en}</span>
            <span class="skill-val">{Math.round(val * 100)}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: {val * 100}%" class:pass={val >= 0.8} class:fail={val < 0.8}></div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Misconceptions section -->
  {#if activeMisconceptions.length > 0}
    <div class="misconceptions-section">
      <h4>{$locale === 'id' ? 'Topik yang Perlu Diperbaiki' : 'Topics to Focus On'}</h4>
      <div class="misconceptions-list">
        {#each activeMisconceptions as key}
          {@const details = misconceptionDetails[key]}
          <div class="misconception-item">
            <div class="misc-title">
              <span class="bullet">⚠️</span>
              <strong>{$locale === 'id' ? details.title.id : details.title.en}</strong>
            </div>
            <p class="misc-desc">
              {$locale === 'id' ? details.desc.id : details.desc.en}
            </p>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="actions">
    <button class="btn btn-primary" on:click={onFinish}>
      {$locale === 'id' ? 'Kembali ke Dasbor' : 'Back to Dashboard'}
    </button>
  </div>
</div>

<style>
  .summary-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .summary-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }

  .summary-header h2 {
    font-size: 1.25rem;
    margin: 0;
    color: var(--text-primary);
  }

  .badge {
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    text-transform: uppercase;
    color: white;
  }

  .badge.pass { background-color: #10b981; }
  .badge.partial { background-color: #f59e0b; }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .score-pct {
    font-size: 3rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }

  .score-label {
    font-size: 0.82rem;
    color: var(--text-secondary);
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 0.25rem;
  }

  .skills-section h4, .misconceptions-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    font-weight: bold;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.35rem;
  }

  .skills-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .skill-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .skill-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-primary);
  }

  .skill-name {
    font-weight: 600;
  }

  .skill-val {
    font-weight: bold;
  }

  .progress-bar-bg {
    height: 6px;
    background-color: var(--bg-primary);
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: 3px;
  }

  .progress-bar-fill.pass { background-color: #10b981; }
  .progress-bar-fill.fail { background-color: #f59e0b; }

  .misconceptions-section {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .misconceptions-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .misconception-item {
    font-size: 0.78rem;
  }

  .misc-title {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--text-primary);
  }

  .misc-desc {
    margin: 0.15rem 0 0 1.2rem;
    color: var(--text-secondary);
    line-height: 1.35;
  }

  .actions {
    display: flex;
    justify-content: center;
  }

  .btn {
    font-size: 0.88rem;
    font-weight: 700;
    padding: 0.6rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    width: 100%;
  }

  .btn-primary { background-color: var(--color-primary); color: white; }
</style>
