<script lang="ts">
  import { staticsTopics } from '../../content/topics/statics-content';
  import { starterProblems } from '../../content/problems/statics-problems';
  import type { ProblemModel } from '../../lib/domain/models/types';
  import { locale, translations } from '../../lib/utils/i18n';

  export let onNavigate: (page: string, params?: any) => void;

  function loadProblem(problem: ProblemModel) {
    onNavigate('practice', { problemId: problem.id });
  }
</script>

<div class="dashboard-container animate-fade-in">
  <header class="dashboard-header">
    <div class="header-text">
      <span class="subheading">{translations[$locale].undergradMechanics}</span>
      <h1>{translations[$locale].learningPortal}</h1>
      <p class="description">
        {translations[$locale].portalDesc}
      </p>
    </div>
    <div class="header-action">
      <button class="btn btn-primary btn-lg" on:click={() => onNavigate('practice')}>
        {translations[$locale].openSandbox}
      </button>
    </div>
  </header>

  <div class="dashboard-grid">
    <!-- Left Column: Core Curriculum -->
    <div class="grid-section">
      <div class="section-header">
        <span class="icon">📘</span>
        <h2>{translations[$locale].conceptModules}</h2>
      </div>
      <p class="section-desc">{translations[$locale].conceptDesc}</p>
      
      <div class="topics-list">
        {#each staticsTopics as topic}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div 
            class="topic-card" 
            on:click={() => onNavigate(`concept/${topic.id}`)}
          >
            <div class="topic-info">
              <h3>{$locale === 'id' ? topic.titleId || topic.title : topic.title}</h3>
              <p>{$locale === 'id' ? topic.summaryId || topic.summary : topic.summary}</p>
            </div>
            <span class="arrow">→</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Right Column: Interactive Practice Presets -->
    <div class="grid-section">
      <div class="section-header">
        <span class="icon">📐</span>
        <h2>{translations[$locale].practiceProblems}</h2>
      </div>
      <p class="section-desc">{translations[$locale].practiceDesc}</p>

      <div class="problems-list">
        {#each starterProblems as problem}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div 
            class="problem-card"
            on:click={() => loadProblem(problem)}
          >
            <div class="problem-badge {problem.expectedDeterminacy}">
              {#if problem.expectedDeterminacy === 'statically_determinate'}
                {translations[$locale].determinate}
              {:else if problem.expectedDeterminacy === 'statically_indeterminate'}
                {translations[$locale].indeterminate}
              {:else}
                {translations[$locale].unstable}
              {/if}
            </div>
            <h3>{$locale === 'id' ? problem.titleId || problem.title : problem.title}</h3>
            <p>{$locale === 'id' ? problem.descriptionId || problem.description : problem.description}</p>
            <div class="problem-meta">
              <span>{translations[$locale].body}: {problem.body.type === 'beam' ? ($locale === 'id' ? 'Balok' : 'Beam') : ($locale === 'id' ? 'Plat' : 'Block')} ({problem.body.width}m)</span>
              <span>•</span>
              <span>{translations[$locale].supports}: {problem.supports.length}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .dashboard-header {
    background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
    color: white;
    padding: 2.5rem;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  :global(html.dark) .dashboard-header {
    background: linear-gradient(135deg, #1e293b 0%, #020617 100%);
    border: 1px solid var(--border-color);
  }

  .header-text {
    max-width: 600px;
  }

  .subheading {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #93c5fd;
  }

  .dashboard-header h1 {
    color: white;
    font-size: 2.25rem;
    margin-top: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .description {
    color: #cbd5e1;
    font-size: 1rem;
    line-height: 1.5;
  }

  .btn-lg {
    padding: 0.85rem 1.75rem;
    font-size: 1rem;
    font-weight: 600;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
    white-space: nowrap;
  }

  .btn-lg:hover {
    background-color: var(--color-primary-hover);
    transform: translateY(-1px);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 850px) {
    .dashboard-grid {
      grid-template-columns: 1.1fr 1fr;
    }
  }

  .grid-section {
    display: flex;
    flex-direction: column;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .section-header h2 {
    font-size: 1.35rem;
    margin-bottom: 0;
  }

  .section-desc {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 1.25rem;
  }

  .topics-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .topic-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s;
  }

  .topic-card:hover {
    border-color: var(--color-primary);
    transform: translateX(4px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  .topic-info h3 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .topic-info p {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .arrow {
    font-size: 1.25rem;
    color: var(--text-secondary);
    transition: color 0.2s;
  }

  .topic-card:hover .arrow {
    color: var(--color-primary);
  }

  .problems-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .problem-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
  }

  .problem-card:hover {
    border-color: var(--color-primary);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  .problem-badge {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .problem-badge.statically_determinate {
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .problem-badge.statically_indeterminate {
    background-color: rgba(245, 158, 11, 0.1);
    color: var(--color-warning);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  .problem-badge.unstable {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .problem-card h3 {
    font-size: 1rem;
    margin-right: 6.5rem;
    margin-bottom: 0.4rem;
  }

  .problem-card p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }

  .problem-meta {
    font-size: 0.75rem;
    color: var(--text-secondary);
    display: flex;
    gap: 0.5rem;
    font-weight: 500;
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
