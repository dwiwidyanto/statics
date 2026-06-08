<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import { beamProblems } from '../../content/problems/beam-problems';
  import { starterProblems } from '../../content/problems/statics-problems';
  import { trussProblems } from '../../content/problems/truss-problems';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import type { ProgressSummary, Attempt } from '../../lib/domain/progress/types';
  import type { AnyProblem } from '../../lib/services/progressRepository';
  import { computeLearningAnalytics } from '../../lib/domain/progress/analytics';
  import { serializeProgressData, validateAndParseImportData } from '../../lib/services/progressExport';
  import { buildLearningRecommendations } from '../../lib/domain/progress/recommendations';
  import { misconceptionsDictionary } from '../../content/learning/misconceptions';

  // Import Sub-components
  import ProgressStatsGrid from '../components/progress/ProgressStatsGrid.svelte';
  import TopicProgressList from '../components/progress/TopicProgressList.svelte';
  import RecentAttemptsList from '../components/progress/RecentAttemptsList.svelte';
  import MisconceptionSummary from '../components/progress/MisconceptionSummary.svelte';

  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();
  const allProblems: AnyProblem[] = [...beamProblems, ...starterProblems, ...trussProblems];

  let summary: ProgressSummary = repo.getSummary(allProblems);
  let recentAttempts: Attempt[] = repo.getAttempts().slice(-10).reverse();
  let showResetConfirm = false;

  // File import state
  let importFileInput: HTMLInputElement;
  let importingAttempts: Attempt[] | null = null;
  let importingPayload: unknown = null;
  let importError: string | null = null;
  let importWarnings: string[] = [];

  function refreshData() {
    summary = repo.getSummary(allProblems);
    recentAttempts = repo.getAttempts().slice(-10).reverse();
  }

  function handleReset() {
    repo.reset();
    showResetConfirm = false;
    refreshData();
  }

  function findNextUnsolved(): AnyProblem | null {
    for (const p of beamProblems) {
      const progress = repo.getProblemProgress(p.id);
      if (!progress.completed) return p;
    }
    for (const p of trussProblems) {
      const progress = repo.getProblemProgress(p.id);
      if (!progress.completed) return p;
    }
    return null;
  }

  function handleContinue() {
    const next = findNextUnsolved();
    if (next) {
      handleStartProblem(next);
    } else {
      onNavigate('dashboard');
    }
  }

  function handleStartProblem(problem: AnyProblem) {
    if (problem.topic === 'trusses') {
      onNavigate('trusses', { problemId: problem.id });
    } else {
      onNavigate(`guided/${problem.id}`);
    }
  }

  function handleRecommendationRoute(targetRoute?: string) {
    if (!targetRoute) return;
    if (targetRoute.startsWith('trusses:')) {
      onNavigate('trusses', { problemId: targetRoute.split(':')[1] });
    } else {
      onNavigate(targetRoute);
    }
  }

  // Reactive calculations for learning analytics
  $: analytics = computeLearningAnalytics(
    repo.getAttempts(),
    allProblems,
    (id) => repo.getProblemProgress(id)
  );
  $: recommendations = buildLearningRecommendations({
    attempts: repo.getAttempts(),
    allProblems,
    maxItems: 3
  });

  // Import / Export Logic
  function handleExport() {
    const dataStr = serializeProgressData(repo.exportProgress().attempts);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'staticslab_progress.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  function triggerImportPicker() {
    importError = null;
    importingAttempts = null;
    importingPayload = null;
    importWarnings = [];
    importFileInput.click();
  }

  function handleFileImport(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const validation = validateAndParseImportData(text);
      if (validation.isValid && validation.attempts) {
        importingAttempts = validation.attempts;
        importingPayload = JSON.parse(text);
        importWarnings = validation.warnings ?? [];
        importError = null;
      } else {
        importError = validation.error || 'Failed to import progress data';
        importingAttempts = null;
        importingPayload = null;
      }
    };
    reader.onerror = () => {
      importError = 'Failed to read import file.';
      importingAttempts = null;
      importingPayload = null;
    };
    reader.readAsText(file);
    target.value = '';
  }

  function handleConfirmMerge() {
    if (!importingPayload) return;
    const result = repo.importProgress(importingPayload, 'merge');
    importWarnings = result.warnings;
    importingAttempts = null;
    importingPayload = null;
    refreshData();
  }

  function handleConfirmReplace() {
    if (!importingPayload) return;
    const result = repo.importProgress(importingPayload, 'replace');
    importWarnings = result.warnings;
    importingAttempts = null;
    importingPayload = null;
    refreshData();
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

  <!-- Summary Stats Grid -->
  <ProgressStatsGrid
    totalProblems={summary.totalProblems}
    attemptedProblems={summary.attemptedProblems}
    completedProblems={summary.completedProblems}
    averageBestScore={summary.averageBestScore}
    firstAttemptAccuracy={analytics.totalGuidedAttempts > 0 ? analytics.firstAttemptAccuracy : null}
    totalHintsUsed={analytics.totalHintsUsed}
  />

  {#if recommendations.length > 0}
    <section class="recommended-next card">
      <div class="section-heading-row">
        <h2>{$locale === 'id' ? 'Rekomendasi Berikutnya' : 'Recommended Next'}</h2>
      </div>
      <div class="recommendation-list">
        {#each recommendations as recommendation}
          <article class="recommendation-item">
            <div>
              <span class="recommendation-priority {recommendation.priority}">{recommendation.priority}</span>
              <h3>{$locale === 'id' ? recommendation.title.id : recommendation.title.en}</h3>
              <p>{$locale === 'id' ? recommendation.description.id : recommendation.description.en}</p>
            </div>
            {#if recommendation.targetRoute}
              <button class="btn btn-secondary" on:click={() => handleRecommendationRoute(recommendation.targetRoute)}>
                {$locale === 'id' ? 'Buka' : 'Open'}
              </button>
            {/if}
          </article>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Import Error Toast -->
  {#if importError}
    <div class="import-error-banner" role="alert">
      <span>⚠️ {importError}</span>
      <button class="btn-close" on:click={() => importError = null}>×</button>
    </div>
  {/if}

  <!-- Import Options Modal -->
  {#if importingAttempts !== null}
    <div class="import-modal-overlay">
      <div class="import-modal-card card">
        <h3>{$locale === 'id' ? 'Konfirmasi Impor Progres' : 'Confirm Progress Import'}</h3>
        <p>
          {$locale === 'id'
            ? `Kami menemukan ${importingAttempts.length} percobaan valid dalam berkas impor. Pilih tindakan impor progres:`
            : `We found ${importingAttempts.length} valid attempts in the file. Choose import action:`}
        </p>

        <div class="import-options">
          {#if importWarnings.length > 0}
            <div class="import-warning-list">
              {#each importWarnings as warning}
                <p>{warning}</p>
              {/each}
            </div>
          {/if}
          <button class="btn btn-primary" on:click={handleConfirmMerge}>
            <strong>{$locale === 'id' ? 'Gabungkan Progres' : 'Merge Progress'}</strong>
            <span>{$locale === 'id' ? 'Menyimpan progres saat ini dan menambahkan data baru' : 'Keep existing attempts and add new ones'}</span>
          </button>
          <button class="btn btn-danger" on:click={handleConfirmReplace}>
            <strong>{$locale === 'id' ? 'Ganti Seluruh Progres' : 'Replace Entire Progress'}</strong>
            <span>{$locale === 'id' ? 'Menghapus progres saat ini terlebih dahulu (tidak bisa dibatalkan)' : 'Erase current progress first (cannot be undone)'}</span>
          </button>
          <button class="btn btn-secondary" on:click={() => importingAttempts = null}>
            {$locale === 'id' ? 'Batal' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Advanced Learning Diagnostics Card -->
  {#if analytics.totalGuidedAttempts > 0}
    <div class="analytics-card card">
      <h2>{$locale === 'id' ? 'Diagnosis Pembelajaran Lanjutan' : 'Advanced Learning Diagnostics'}</h2>
      <div class="diagnostics-grid">
        <div class="diag-item">
          <span class="diag-icon">🎯</span>
          <div class="diag-text">
            <span class="diag-label">{$locale === 'id' ? 'Keterampilan Terlemah' : 'Weakest Skill'}</span>
            <span class="diag-value">
              {#if analytics.weakestSkill}
                {#if analytics.weakestSkill === 'determinacy'}{$locale === 'id' ? 'Determinasi' : 'Determinacy'}
                {:else if analytics.weakestSkill === 'reactions'}{$locale === 'id' ? 'Reaksi Tumpuan' : 'Reactions'}
                {:else if analytics.weakestSkill === 'zeroForceMembers'}{$locale === 'id' ? 'Batang Gaya Nol' : 'Zero-Force Members'}
                {:else if analytics.weakestSkill === 'jointSelection'}{$locale === 'id' ? 'Urutan Titik Hubung' : 'Joint Sequence'}
                {:else if analytics.weakestSkill === 'memberForces'}{$locale === 'id' ? 'Persamaan Gaya Batang' : 'Member Forces'}
                {/if}
              {:else}
                {$locale === 'id' ? 'Tidak ada (Semua Bagus)' : 'None (All proficient)'}
              {/if}
            </span>
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
            <span class="diag-value">
              {analytics.averageHintsPerGuidedAttempt} {$locale === 'id' ? 'petunjuk / soal' : 'hints / problem'}
            </span>
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

      {#if analytics.recommendedProblemId}
        {@const recommendedProblem = allProblems.find(p => p.id === analytics.recommendedProblemId)}
        {#if recommendedProblem}
          <div class="recommendation-banner">
            <div class="recommendation-content">
              <span class="recommendation-badge">🚀 {$locale === 'id' ? 'Rekomendasi Latihan Selanjutnya' : 'Recommended Next Practice'}</span>
              <h4>{$locale === 'id' ? recommendedProblem.titleId || recommendedProblem.title : recommendedProblem.title}</h4>
              <p class="recommendation-desc">
                {#if analytics.weakestSkill}
                  {$locale === 'id'
                    ? `Berdasarkan analisis kemajuan belajar, latihan soal ini dapat membantu melatih bagian ${
                        analytics.weakestSkill === 'zeroForceMembers' ? 'Batang Gaya Nol' :
                        analytics.weakestSkill === 'jointSelection' ? 'Urutan Titik Hubung' :
                        analytics.weakestSkill === 'memberForces' ? 'Gaya Batang' :
                        analytics.weakestSkill === 'reactions' ? 'Reaksi Tumpuan' : 'Determinasi'
                      }.`
                    : `Based on your weak skill analysis, practicing this problem can improve your ${
                        analytics.weakestSkill === 'zeroForceMembers' ? 'Zero-Force Members' :
                        analytics.weakestSkill === 'jointSelection' ? 'Joint Selection' :
                        analytics.weakestSkill === 'memberForces' ? 'Member Forces' :
                        analytics.weakestSkill === 'reactions' ? 'Reactions' : 'Determinacy'
                      }.`}
                {:else}
                  {$locale === 'id' ? 'Anda menunjukkan pemahaman yang baik di semua bidang! Lanjutkan ke soal berikutnya.' : 'You show solid proficiency across all areas! Continue to the next unsolved problem.'}
                {/if}
              </p>
            </div>
            <button class="btn btn-primary recommendation-btn" on:click={() => handleStartProblem(recommendedProblem)}>
              {$locale === 'id' ? 'Mulai Latihan →' : 'Start Practice →'}
            </button>
          </div>
        {/if}
      {/if}
    </div>
  {/if}

  <!-- Topic Breakdown -->
  <TopicProgressList byTopic={summary.byTopic} />

  <!-- Misconceptions and Skill Proficiency Summary -->
  <MisconceptionSummary attempts={recentAttempts} />

  <!-- Recent Attempts List -->
  <RecentAttemptsList
    {recentAttempts}
    {allProblems}
    {onNavigate}
    {handleContinue}
  />

  <!-- Actions -->
  <div class="actions-row">
    <button class="btn btn-primary" on:click={handleContinue}>
      {$locale === 'id' ? 'Lanjutkan Soal Berikutnya' : 'Continue Next Problem'}
    </button>
    <button class="btn btn-secondary" on:click={() => onNavigate('dashboard')}>
      {$locale === 'id' ? 'Lihat Soal Selesai' : 'Review Completed'}
    </button>
    <button class="btn btn-secondary" on:click={handleExport}>
      📥 {$locale === 'id' ? 'Ekspor Progres (JSON)' : 'Export Progress (JSON)'}
    </button>
    <button class="btn btn-secondary" on:click={triggerImportPicker}>
      📤 {$locale === 'id' ? 'Impor Progres' : 'Import Progress'}
    </button>
    <input
      type="file"
      accept=".json"
      style="display: none"
      bind:this={importFileInput}
      on:change={handleFileImport}
    />

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

  .card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
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

  .diag-icon {
    font-size: 1.5rem;
  }

  .diag-text {
    display: flex;
    flex-direction: column;
  }

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

  .diag-value.trend-up {
    color: var(--color-success, #10b981);
  }

  .diag-value.trend-down {
    color: var(--color-error, #ef4444);
  }

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

  .recommendation-content {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
  }

  .recommendation-badge {
    font-size: 0.7rem;
    font-weight: bold;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .recommendation-content h4 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: bold;
    color: var(--text-primary);
  }

  .recommendation-desc {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .recommendation-btn {
    align-self: center;
    white-space: nowrap;
  }

  .recommended-next h2 {
    font-size: 1.15rem;
    margin: 0;
  }

  .section-heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .recommendation-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .recommendation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    border-radius: 8px;
    padding: 0.85rem 1rem;
  }

  .recommendation-item h3 {
    margin: 0.25rem 0;
    font-size: 0.95rem;
  }

  .recommendation-item p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .recommendation-priority {
    text-transform: uppercase;
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .recommendation-priority.high {
    color: #dc2626;
  }

  .recommendation-priority.medium {
    color: #d97706;
  }

  .recommendation-priority.low {
    color: #059669;
  }

  .actions-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
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

  .import-error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #ef4444;
    opacity: 0.7;
    padding: 0 0.5rem;
  }

  .btn-close:hover {
    opacity: 1;
  }

  /* Import Modal Styles */
  .import-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .import-modal-card {
    max-width: 500px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background-color: var(--bg-primary);
  }

  .import-modal-card h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .import-modal-card p {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .import-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .import-warning-list {
    border: 1px solid rgba(245, 158, 11, 0.25);
    background-color: rgba(245, 158, 11, 0.08);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .import-options .btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.85rem 1.25rem;
    text-align: left;
    gap: 0.15rem;
    border-radius: 8px;
  }

  .import-options .btn span {
    font-size: 0.75rem;
    font-weight: normal;
    opacity: 0.8;
  }

  .import-options .btn-secondary {
    align-items: center;
    justify-content: center;
    font-weight: bold;
    padding: 0.6rem;
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
