<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { LearningAnalytics } from '../../../lib/domain/progress/analytics';
  import type { AnyProblem } from '../../../lib/services/progressRepository';
  import { misconceptionsDictionary } from '../../../content/learning/misconceptions';

  export let analytics: LearningAnalytics;
  export let allProblems: AnyProblem[];
  export let onStartProblem: (problem: AnyProblem) => void;

  $: recommendedProblem = analytics.recommendedProblemId
    ? allProblems.find(p => p.id === analytics.recommendedProblemId)
    : null;

  function skillLabel(skill: string | null): string {
    if (!skill) return $locale === 'id' ? 'Tidak ada (Semua Bagus)' : 'None (All proficient)';
    const labels: Record<string, { en: string; id: string }> = {
      determinacy: { en: 'Determinacy', id: 'Determinasi' },
      reactions: { en: 'Reactions', id: 'Reaksi Tumpuan' },
      zeroForceMembers: { en: 'Zero-Force Members', id: 'Batang Gaya Nol' },
      jointSelection: { en: 'Joint Sequence', id: 'Urutan Titik Hubung' },
      memberForces: { en: 'Member Forces', id: 'Persamaan Gaya Batang' }
    };
    return $locale === 'id' ? labels[skill]?.id ?? skill : labels[skill]?.en ?? skill;
  }
</script>

{#if analytics.totalGuidedAttempts > 0}
  <div class="analytics-card card">
    <h2>{$locale === 'id' ? 'Diagnosis Pembelajaran Lanjutan' : 'Advanced Learning Diagnostics'}</h2>
    <div class="diagnostics-grid">
      <div class="diag-item">
        <span class="diag-icon">🎯</span>
        <div class="diag-text">
          <span class="diag-label">{$locale === 'id' ? 'Keterampilan Terlemah' : 'Weakest Skill'}</span>
          <span class="diag-value">{skillLabel(analytics.weakestSkill)}</span>
        </div>
      </div>

      <div class="diag-item">
        <span class="diag-icon">⚠️</span>
        <div class="diag-text">
          <span class="diag-label">{$locale === 'id' ? 'Miskonsepsi Terbanyak' : 'Most Common Misconception'}</span>
          <span class="diag-value">
            {#if analytics.mostFrequentMisconception && misconceptionsDictionary[analytics.mostFrequentMisconception]}
              {$locale === 'id' ? misconceptionsDictionary[analytics.mostFrequentMisconception].title.id : misconceptionsDictionary[analytics.mostFrequentMisconception].title.en}
            {:else}
              {$locale === 'id' ? 'Tidak ada' : 'None'}
            {/if}
          </span>
        </div>
      </div>

      <div class="diag-item">
        <span class="diag-icon">💡</span>
        <div class="diag-text">
          <span class="diag-label">{$locale === 'id' ? 'Ketergantungan Petunjuk' : 'Hint Dependency'}</span>
          <span class="diag-value">{analytics.averageHintsPerGuidedAttempt} {$locale === 'id' ? 'petunjuk / soal' : 'hints / problem'}</span>
        </div>
      </div>

      <div class="diag-item">
        <span class="diag-icon">📈</span>
        <div class="diag-text">
          <span class="diag-label">{$locale === 'id' ? 'Tren Terakhir' : 'Recent Trend'}</span>
          <span class="diag-value {analytics.recentTrend > 0 ? 'trend-up' : analytics.recentTrend < 0 ? 'trend-down' : ''}">
            {analytics.recentTrend > 0 ? `+${Math.round(analytics.recentTrend * 100)}%` : `${Math.round(analytics.recentTrend * 100)}%`}
            <span class="trend-sub">({$locale === 'id' ? '3 Selesai Terakhir' : 'last 3 completed'})</span>
          </span>
        </div>
      </div>
    </div>

    {#if recommendedProblem}
      <div class="recommendation-banner">
        <div class="recommendation-content">
          <span class="recommendation-badge">{$locale === 'id' ? 'Rekomendasi Latihan Selanjutnya' : 'Recommended Next Practice'}</span>
          <h4>{$locale === 'id' ? recommendedProblem.titleId || recommendedProblem.title : recommendedProblem.title}</h4>
          <p class="recommendation-desc">
            {$locale === 'id'
              ? 'Berdasarkan analisis kemajuan belajar, latihan soal ini dapat membantu memperkuat bagian yang masih lemah.'
              : 'Based on your learning analytics, this problem can help strengthen the area that still needs practice.'}
          </p>
        </div>
        <button class="btn btn-primary recommendation-btn" on:click={() => onStartProblem(recommendedProblem)}>
          {$locale === 'id' ? 'Mulai Latihan' : 'Start Practice'}
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.75rem;
  }

  .analytics-card h2 {
    font-size: 1.2rem;
    margin-bottom: 1.25rem;
    color: var(--text-primary);
  }

  .diagnostics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .diag-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 0.75rem 1rem;
    border-radius: 8px;
  }

  .diag-icon { font-size: 1.5rem; }
  .diag-text { display: flex; flex-direction: column; }
  .diag-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: bold;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
  }
  .diag-value {
    font-size: 0.9rem;
    font-weight: bold;
    color: var(--text-primary);
    line-height: 1.2;
  }
  .diag-value.trend-up { color: var(--color-success, #10b981); }
  .diag-value.trend-down { color: var(--color-error, #ef4444); }
  .trend-sub {
    font-size: 0.7rem;
    font-weight: normal;
    color: var(--text-secondary);
  }

  .recommendation-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.04));
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 8px;
    padding: 1.25rem;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  .recommendation-content { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; }
  .recommendation-badge {
    font-size: 0.7rem;
    font-weight: bold;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .recommendation-content h4 { margin: 0; font-size: 1.05rem; color: var(--text-primary); }
  .recommendation-desc { margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; }
  .recommendation-btn { align-self: center; white-space: nowrap; }
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
