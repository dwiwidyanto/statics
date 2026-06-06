<script lang="ts">
  import { staticsTopics } from '../../content/topics/statics-content';
  import { starterProblems } from '../../content/problems/statics-problems';
  import { beamProblems } from '../../content/problems/beam-problems';
  import type { ProblemModel } from '../../lib/domain/models/types';
  import { locale, translations } from '../../lib/utils/i18n';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import ProblemSummaryCard from '../components/ProblemSummaryCard.svelte';

  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();

  function loadProblem(problem: ProblemModel) {
    onNavigate('practice', { problemId: problem.id });
  }

  function loadGuidedProblem(problem: ProblemModel) {
    onNavigate(`guided/${problem.id}`);
  }

  function isCompleted(problemId: string): boolean {
    return repo.getProblemProgress(problemId).completed;
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
          <button 
            class="topic-card" 
            on:click={() => onNavigate(`concept/${topic.id}`)}
          >
            <div class="topic-info">
              <h3>{$locale === 'id' ? topic.titleId || topic.title : topic.title}</h3>
              <p>{$locale === 'id' ? topic.summaryId || topic.summary : topic.summary}</p>
            </div>
            <span class="arrow">→</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Middle Column: Guided Beam Problems -->
    <div class="grid-section">
      <div class="section-header">
        <span class="icon">📝</span>
        <h2>{translations[$locale].guidedWorkspace}</h2>
      </div>
      <p class="section-desc">{translations[$locale].guidedDesc}</p>

      <div class="problems-list">
        {#each beamProblems as problem}
          <ProblemSummaryCard
            {problem}
            completed={isCompleted(problem.id)}
            onClick={() => loadGuidedProblem(problem)}
          />
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
          <ProblemSummaryCard
            {problem}
            completed={isCompleted(problem.id)}
            onClick={() => loadProblem(problem)}
          />
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    max-width: 1200px;
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

  @media (min-width: 960px) {
    .dashboard-grid {
      grid-template-columns: 1fr 1.2fr 1fr;
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
    width: 100%;
    font-family: inherit;
    text-align: left;
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
