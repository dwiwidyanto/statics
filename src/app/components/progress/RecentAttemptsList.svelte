<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { Attempt } from '../../../lib/domain/progress/types';
  import { getRouteForAttempt } from '../../../app/routing/router';

  export let recentAttempts: Attempt[];
  export let allProblems: any[];
  export let onNavigate: (page: string, params?: any) => void;
  export let handleContinue: () => void;

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

  function getProblemTitle(problemId: string): string {
    const p = allProblems.find(pr => pr.id === problemId);
    if (!p) return problemId;
    return $locale === 'id' ? (p.titleId || p.title) : p.title;
  }

  function formatScore(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString($locale === 'id' ? 'id-ID' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  }

  function handleAttemptClick(attempt: Attempt) {
    const route = getRouteForAttempt(attempt.problemId, allProblems);
    
    // Check if it is a guided attempt by checking misconceptions, skillBreakdown, or guidedTelemetry
    const isGuided = attempt.guidedTelemetry !== undefined || attempt.misconceptions !== undefined || attempt.skillBreakdown !== undefined;
    
    if (isGuided && attempt.guidedTelemetry) {
      onNavigate(`progress/attempt/${attempt.id}`);
    } else if (route.page === 'trusses') {
      if (isGuided) {
        onNavigate(`trusses/${route.problemId}/guided`);
      } else {
        onNavigate('trusses', { problemId: route.problemId });
      }
    } else if (route.page === 'guided') {
      onNavigate(`guided/${route.problemId}`);
    } else {
      const pId = ('problemId' in route && route.problemId) ? route.problemId : attempt.problemId;
      onNavigate('practice', { problemId: pId });
    }
  }
</script>

<div class="section-card">
  <h2>{$locale === 'id' ? 'Percobaan Terakhir' : 'Recent Attempts'}</h2>
  {#if recentAttempts.length === 0}
    <div class="empty-state">
      <span class="empty-icon">📋</span>
      <p>{$locale === 'id' 
        ? 'Belum ada percobaan. Mulai dengan menyelesaikan soal terpandu!' 
        : 'No attempts yet. Start by completing a guided problem!'}</p>
      <button class="btn btn-primary" on:click={handleContinue}>
        {$locale === 'id' ? 'Mulai Belajar' : 'Start Learning'}
      </button>
    </div>
  {:else}
    <div class="attempts-list">
      {#each recentAttempts as attempt}
        <div class="attempt-item">
          <button 
            type="button"
            class="attempt-card"
            on:click={() => handleAttemptClick(attempt)}
          >
            <div class="attempt-info">
              <span class="attempt-title">
                {getProblemTitle(attempt.problemId)}
                {#if attempt.guidedTelemetry !== undefined}
                  <span class="guided-badge">🎓 {$locale === 'id' ? 'Terpandu' : 'Guided'}</span>
                {/if}
              </span>
              <span class="attempt-date">{formatDate(attempt.createdAt)}</span>
              {#if attempt.misconceptions && attempt.misconceptions.length > 0}
                <div class="misconception-tags">
                  {#each Array.from(new Set(attempt.misconceptions)) as misc}
                    {#if misconceptionDetails[misc]}
                      <span class="misc-tag" title={$locale === 'id' ? misconceptionDetails[misc].desc.id : misconceptionDetails[misc].desc.en}>
                        ⚠️ {$locale === 'id' ? misconceptionDetails[misc].title.id : misconceptionDetails[misc].title.en}
                      </span>
                    {/if}
                  {/each}
                </div>
              {/if}
            </div>
            <div class="attempt-right">
              <div class="attempt-score {attempt.completed ? 'completed' : 'partial'}">
                {formatScore(attempt.score)}
                {#if attempt.completed}
                  <span class="checkmark">✅</span>
                {/if}
              </div>
              {#if attempt.guidedTelemetry !== undefined}
                <span class="btn-review-link">
                  {$locale === 'id' ? 'Tinjau →' : 'Review →'}
                </span>
              {/if}
            </div>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .section-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .section-card h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    text-align: center;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: 2.5rem;
  }

  .attempts-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .attempt-item {
    width: 100%;
  }

  .attempt-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    cursor: pointer;
    transition: all 0.15s;
    width: 100%;
    font-family: inherit;
    text-align: left;
  }

  .attempt-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  .attempt-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .attempt-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .guided-badge {
    font-size: 0.65rem;
    background-color: rgba(37, 99, 235, 0.1);
    color: var(--color-primary);
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
    font-weight: 700;
  }

  .attempt-date {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .misconception-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.25rem;
  }

  .misc-tag {
    font-size: 0.7rem;
    font-weight: 700;
    color: #b45309;
    background-color: #fef3c7;
    border: 1px solid #fde68a;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }

  :global(html.dark) .misc-tag {
    color: #fcd34d;
    background-color: rgba(217, 119, 6, 0.15);
    border-color: rgba(217, 119, 6, 0.3);
  }

  .attempt-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .attempt-score {
    font-weight: 800;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .attempt-score.completed {
    color: var(--color-success);
  }

  .attempt-score.partial {
    color: var(--color-warning);
  }

  .btn-review-link {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: underline;
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
</style>
