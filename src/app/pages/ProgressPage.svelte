<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import { beamProblems } from '../../content/problems/beam-problems';
  import { starterProblems } from '../../content/problems/statics-problems';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import type { ProgressSummary, Attempt } from '../../lib/domain/progress/types';
  import type { ProblemModel } from '../../lib/domain/models/types';

  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();
  const allProblems: ProblemModel[] = [...beamProblems, ...starterProblems];

  let summary: ProgressSummary = repo.getSummary(allProblems);
  let recentAttempts: Attempt[] = repo.getAttempts().slice(-10).reverse();
  let showResetConfirm = false;

  function refreshData() {
    summary = repo.getSummary(allProblems);
    recentAttempts = repo.getAttempts().slice(-10).reverse();
  }

  function handleReset() {
    repo.reset();
    showResetConfirm = false;
    refreshData();
  }

  function findNextUnsolved(): string | null {
    for (const p of beamProblems) {
      const progress = repo.getProblemProgress(p.id);
      if (!progress.completed) return p.id;
    }
    return null;
  }

  function handleContinue() {
    const nextId = findNextUnsolved();
    if (nextId) {
      onNavigate(`guided/${nextId}`);
    } else {
      onNavigate('dashboard');
    }
  }

  function getProblemTitle(problemId: string): string {
    const p = allProblems.find(pr => pr.id === problemId);
    if (!p) return problemId;
    return $locale === 'id' ? (p.titleId || p.title) : p.title;
  }

  // Topic display names
  const topicLabels: Record<string, { en: string; id: string }> = {
    'fbd': { en: 'Free-Body Diagrams', id: 'Diagram Benda Bebas' },
    'equilibrium': { en: 'Equilibrium', id: 'Kesetimbangan' },
    'determinacy': { en: 'Determinacy & Stability', id: 'Determinasi & Stabilitas' },
    'beam-internal-forces': { en: 'Beam Internal Forces', id: 'Gaya Dalam Balok' },
  };

  function topicLabel(key: string): string {
    const t = topicLabels[key];
    return t ? ($locale === 'id' ? t.id : t.en) : key;
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
</script>

<div class="progress-container animate-fade-in">
  <header class="progress-header">
    <div class="header-text">
      <span class="subheading">{$locale === 'id' ? 'Pelacakan Kemajuan' : 'Progress Tracking'}</span>
      <h1>{$locale === 'id' ? 'Progres Belajar Anda' : 'Your Learning Progress'}</h1>
      <p class="description">
        {$locale === 'id' 
          ? 'Pantau kemajuan Anda dalam menyelesaikan soal-soal statika. Data disimpan secara lokal di browser Anda.'
          : 'Track your progress through the statics problem sets. Data is stored locally in your browser.'}
      </p>
    </div>
  </header>

  <!-- Summary Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-value">{summary.totalProblems}</span>
      <span class="stat-label">{$locale === 'id' ? 'Total Soal' : 'Total Problems'}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{summary.attemptedProblems}</span>
      <span class="stat-label">{$locale === 'id' ? 'Sudah Dicoba' : 'Attempted'}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{summary.completedProblems}</span>
      <span class="stat-label">{$locale === 'id' ? 'Selesai' : 'Completed'}</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{formatScore(summary.averageBestScore)}</span>
      <span class="stat-label">{$locale === 'id' ? 'Rata-Rata Skor' : 'Avg. Best Score'}</span>
    </div>
  </div>

  <!-- Topic Breakdown -->
  <div class="section-card">
    <h2>{$locale === 'id' ? 'Progres per Topik' : 'Progress by Topic'}</h2>
    <div class="topic-table">
      <div class="topic-row topic-header-row">
        <span>{$locale === 'id' ? 'Topik' : 'Topic'}</span>
        <span>{$locale === 'id' ? 'Total' : 'Total'}</span>
        <span>{$locale === 'id' ? 'Dicoba' : 'Attempted'}</span>
        <span>{$locale === 'id' ? 'Selesai' : 'Completed'}</span>
        <span>{$locale === 'id' ? 'Skor' : 'Score'}</span>
      </div>
      {#each Object.entries(summary.byTopic) as [topic, data]}
        <div class="topic-row">
          <span class="topic-name">{topicLabel(topic)}</span>
          <span>{data.total}</span>
          <span>{data.attempted}</span>
          <span>{data.completed}</span>
          <span class="score-badge">{formatScore(data.averageBestScore)}</span>
        </div>
      {/each}
      {#if Object.keys(summary.byTopic).length === 0}
        <div class="topic-row empty-row">
          <span>{$locale === 'id' ? 'Belum ada data' : 'No data yet'}</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Recent Attempts -->
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
          <button 
            class="attempt-card"
            on:click={() => onNavigate(`guided/${attempt.problemId}`)}
          >
            <div class="attempt-info">
              <span class="attempt-title">{getProblemTitle(attempt.problemId)}</span>
              <span class="attempt-date">{formatDate(attempt.createdAt)}</span>
            </div>
            <div class="attempt-score {attempt.completed ? 'completed' : 'partial'}">
              {formatScore(attempt.score)}
              {#if attempt.completed}
                <span class="checkmark">✅</span>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Actions -->
  <div class="actions-row">
    <button class="btn btn-primary" on:click={handleContinue}>
      {$locale === 'id' ? 'Lanjutkan Soal Berikutnya' : 'Continue Next Problem'}
    </button>
    <button class="btn btn-secondary" on:click={() => onNavigate('dashboard')}>
      {$locale === 'id' ? 'Lihat Soal Selesai' : 'Review Completed'}
    </button>
    {#if !showResetConfirm}
      <button class="btn btn-danger" on:click={() => showResetConfirm = true}>
        {$locale === 'id' ? 'Reset Progres' : 'Reset Progress'}
      </button>
    {:else}
      <div class="reset-confirm">
        <span>{$locale === 'id' ? 'Yakin ingin menghapus semua progres?' : 'Are you sure? This will erase all progress.'}</span>
        <button class="btn btn-danger" on:click={handleReset}>
          {$locale === 'id' ? 'Ya, Hapus' : 'Yes, Reset'}
        </button>
        <button class="btn btn-secondary" on:click={() => showResetConfirm = false}>
          {$locale === 'id' ? 'Batal' : 'Cancel'}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .progress-container {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .progress-header {
    background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
    color: white;
    padding: 2rem 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  :global(html.dark) .progress-header {
    background: linear-gradient(135deg, #115e59 0%, #042f2e 100%);
    border: 1px solid var(--border-color);
  }

  .subheading {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #99f6e4;
  }

  .progress-header h1 {
    color: white;
    font-size: 2rem;
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .description {
    color: #ccfbf1;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  @media (max-width: 600px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .stat-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

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

  .topic-table {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .topic-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
    border-radius: 6px;
    align-items: center;
  }

  .topic-header-row {
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .topic-row:not(.topic-header-row):hover {
    background-color: var(--bg-primary);
  }

  .topic-name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .score-badge {
    font-weight: 700;
    color: var(--color-primary);
  }

  .empty-row {
    color: var(--text-secondary);
    font-style: italic;
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
  }

  .attempt-date {
    font-size: 0.75rem;
    color: var(--text-secondary);
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

  .actions-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .btn-danger {
    background-color: #ef4444;
    color: white;
    border: none;
    padding: 0.55rem 1.1rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .btn-danger:hover {
    background-color: #dc2626;
  }

  .reset-confirm {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--color-error);
    font-weight: 600;
  }

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
