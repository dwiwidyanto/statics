<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { Attempt } from '../../../lib/domain/progress/types';

  export let attempts: Attempt[];

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

  const skillLabels: Record<string, { en: string; id: string }> = {
    determinacy: { en: 'Determinacy & Stability', id: 'Determinasi & Stabilitas' },
    reactions: { en: 'Support Reactions', id: 'Reaksi Tumpuan' },
    zeroForceMembers: { en: 'Zero-Force Members', id: 'Batang Gaya Nol' },
    jointSelection: { en: 'Joint Solving Sequence', id: 'Urutan Titik Hubung' },
    memberForces: { en: 'Axial Member Forces', id: 'Gaya Batang Aksial' }
  };

  // Derive stats
  $: stats = (() => {
    const counts: Record<string, number> = {};
    const skillSums: Record<string, number> = {
      determinacy: 0,
      reactions: 0,
      zeroForceMembers: 0,
      jointSelection: 0,
      memberForces: 0
    };
    const skillCounts: Record<string, number> = {
      determinacy: 0,
      reactions: 0,
      zeroForceMembers: 0,
      jointSelection: 0,
      memberForces: 0
    };

    let totalMiscCount = 0;

    for (const attempt of attempts) {
      if (attempt.misconceptions) {
        for (const misc of attempt.misconceptions) {
          if (misc in misconceptionDetails) {
            counts[misc] = (counts[misc] || 0) + 1;
            totalMiscCount++;
          }
        }
      }
      if (attempt.skillBreakdown) {
        for (const [skill, val] of Object.entries(attempt.skillBreakdown)) {
          if (skill in skillSums && typeof val === 'number') {
            skillSums[skill] += val;
            skillCounts[skill]++;
          }
        }
      }
    }

    const sortedMisconceptions = Object.entries(counts)
      .map(([key, count]) => ({ key, count, ...misconceptionDetails[key] }))
      .sort((a, b) => b.count - a.count);

    const weakSkills = Object.keys(skillSums)
      .map(skill => {
        const count = skillCounts[skill];
        const avg = count > 0 ? skillSums[skill] / count : 1.0;
        return { skill, avg, label: skillLabels[skill] };
      })
      .filter(s => skillCounts[s.skill] > 0)
      .sort((a, b) => a.avg - b.avg); // weakest first

    return {
      sortedMisconceptions,
      weakSkills,
      totalMiscCount
    };
  })();
</script>

{#if attempts.length > 0}
  <div class="summary-layout">
    <!-- Misconceptions Summary -->
    <div class="summary-card">
      <h3>{$locale === 'id' ? 'Miskonsepsi Paling Sering' : 'Frequent Misconceptions'}</h3>
      {#if stats.sortedMisconceptions.length === 0}
        <p class="empty-msg">
          {$locale === 'id' 
            ? 'Bagus sekali! Tidak ada miskonsepsi yang tercatat dalam latihan Anda.' 
            : 'Excellent! No misconceptions recorded in your practice.'}
        </p>
      {:else}
        <div class="misc-list">
          {#each stats.sortedMisconceptions.slice(0, 3) as misc}
            <div class="misc-item animate-fade-in">
              <div class="misc-item-header">
                <span class="misc-badge">⚠️ {misc.title[$locale === 'id' ? 'id' : 'en']}</span>
                <span class="misc-count">{misc.count} {$locale === 'id' ? 'kali' : 'times'}</span>
              </div>
              <p class="misc-desc">{misc.desc[$locale === 'id' ? 'id' : 'en']}</p>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Weak Skills Summary -->
    <div class="summary-card">
      <h3>{$locale === 'id' ? 'Evaluasi Keterampilan' : 'Skill Proficiency'}</h3>
      {#if stats.weakSkills.length === 0}
        <p class="empty-msg">
          {$locale === 'id' 
            ? 'Kerjakan latihan terpandu untuk melihat analisis keterampilan.' 
            : 'Complete guided attempts to see skill analysis.'}
        </p>
      {:else}
        <div class="skills-list">
          {#each stats.weakSkills as s, index}
            <div class="skill-item animate-fade-in">
              <div class="skill-info">
                <span class="skill-name">{s.label[$locale === 'id' ? 'id' : 'en']}</span>
                <span class="skill-avg">{Math.round(s.avg * 100)}%</span>
              </div>
              <div class="progress-bar-container">
                <div 
                  class="progress-bar {index === 0 && s.avg < 0.7 ? 'weakest' : s.avg >= 0.85 ? 'strong' : 'average'}" 
                  style="width: {s.avg * 100}%"
                ></div>
              </div>
              {#if index === 0 && s.avg < 0.7}
                <span class="recommendation-badge">
                  🎯 {$locale === 'id' ? 'Fokus perbaikan utama' : 'Primary focus area'}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .summary-layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    width: 100%;
  }

  .summary-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .summary-card h3 {
    font-size: 1.1rem;
    margin-top: 0;
    margin-bottom: 1.25rem;
    color: var(--text-primary);
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.5rem;
  }

  .empty-msg {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-style: italic;
    margin: 0;
  }

  .misc-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .misc-item {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .misc-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .misc-badge {
    font-size: 0.8rem;
    font-weight: 700;
    color: #b45309;
  }

  .misc-count {
    font-size: 0.72rem;
    font-weight: 600;
    background-color: var(--border-color);
    color: var(--text-secondary);
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
  }

  .misc-desc {
    font-size: 0.78rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .skills-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .skill-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .skill-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.82rem;
  }

  .skill-name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .skill-avg {
    font-weight: 700;
    color: var(--text-secondary);
  }

  .progress-bar-container {
    height: 8px;
    background-color: var(--border-color);
    border-radius: 4px;
    overflow: hidden;
    width: 100%;
  }

  .progress-bar {
    height: 100%;
    border-radius: 4px;
  }

  .progress-bar.weakest { background-color: #ef4444; }
  .progress-bar.average { background-color: #3b82f6; }
  .progress-bar.strong { background-color: #10b981; }

  .recommendation-badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: #ef4444;
    margin-top: 0.15rem;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
