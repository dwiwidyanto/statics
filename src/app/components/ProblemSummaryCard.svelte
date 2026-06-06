<script lang="ts">
  import type { ProblemModel } from '../../lib/domain/models/types';
  import { locale, translations } from '../../lib/utils/i18n';

  export let problem: ProblemModel;
  export let completed = false;
  export let onClick: () => void;

  $: title = $locale === 'id' ? problem.titleId || problem.title : problem.title;
  $: description = $locale === 'id' ? problem.descriptionId || problem.description : problem.description;

  const topicLabels: Record<string, { en: string; id: string }> = {
    'fbd': { en: 'FBD', id: 'DBB' },
    'equilibrium': { en: 'Equilibrium', id: 'Kesetimbangan' },
    'determinacy': { en: 'Determinacy', id: 'Determinasi' },
    'beam-internal-forces': { en: 'Internal Forces', id: 'Gaya Dalam' },
  };

  const difficultyLabels: Record<string, { en: string; id: string }> = {
    'easy': { en: 'Easy', id: 'Mudah' },
    'medium': { en: 'Medium', id: 'Sedang' },
    'hard': { en: 'Hard', id: 'Sulit' },
  };
</script>

<button 
  class="problem-card-premium {completed ? 'is-completed' : ''}" 
  on:click={onClick}
>
  <div class="card-glow"></div>
  
  <div class="card-header">
    <div class="badges-row">
      <span class="badge topic-badge topic-{problem.topic}">
        {$locale === 'id' ? topicLabels[problem.topic].id : topicLabels[problem.topic].en}
      </span>
      <span class="badge difficulty-badge diff-{problem.difficulty}">
        {$locale === 'id' ? difficultyLabels[problem.difficulty].id : difficultyLabels[problem.difficulty].en}
      </span>
    </div>
    {#if completed}
      <span class="completion-badge" title={$locale === 'id' ? 'Selesai' : 'Completed'}>
        <span class="check-icon">✓</span>
      </span>
    {/if}
  </div>

  <div class="card-body">
    <h3>{title}</h3>
    <p class="desc-text">{description}</p>
  </div>

  <div class="card-footer">
    <div class="meta-item">
      <span class="meta-icon">📐</span>
      <span>{problem.body.width}m</span>
    </div>
    <div class="meta-separator">•</div>
    <div class="meta-item">
      <span class="meta-icon">⚙️</span>
      <span>{problem.supports.length} {translations[$locale].supports}</span>
    </div>
    <div class="meta-separator">•</div>
    <div class="meta-item">
      <span class="meta-icon">⚡</span>
      <span>{problem.loads.length} {$locale === 'id' ? 'Beban' : 'Loads'}</span>
    </div>
  </div>
</button>

<style>
  .problem-card-premium {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 16px;
    padding: 1.25rem;
    min-height: 180px;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 24px -6px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    width: 100%;
  }

  :global(html.dark) .problem-card-premium {
    background: rgba(30, 41, 59, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 24px -6px rgba(0, 0, 0, 0.3);
  }

  .problem-card-premium:hover {
    transform: translateY(-4px);
    border-color: rgba(37, 99, 235, 0.4);
    box-shadow: 0 12px 30px -8px rgba(37, 99, 235, 0.12);
  }

  :global(html.dark) .problem-card-premium:hover {
    border-color: rgba(96, 165, 250, 0.4);
    box-shadow: 0 12px 30px -8px rgba(96, 165, 250, 0.2);
  }

  /* Success State Glow */
  .problem-card-premium.is-completed {
    border-color: rgba(16, 185, 129, 0.3);
  }
  .problem-card-premium.is-completed:hover {
    border-color: rgba(16, 185, 129, 0.6);
    box-shadow: 0 12px 30px -8px rgba(16, 185, 129, 0.15);
  }

  /* Decorative Hover Glow Effect */
  .card-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(800px circle at var(--x, 50%) var(--y, 50%), rgba(255, 255, 255, 0.06), transparent 40%);
    opacity: 0;
    transition: opacity 0.5s;
    pointer-events: none;
    z-index: 1;
  }

  .problem-card-premium:hover .card-glow {
    opacity: 1;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    z-index: 2;
  }

  .badges-row {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.55rem;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Topic Badges */
  .topic-badge.topic-fbd {
    background-color: rgba(59, 130, 246, 0.1);
    color: #2563eb;
  }
  :global(html.dark) .topic-badge.topic-fbd {
    background-color: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  .topic-badge.topic-equilibrium {
    background-color: rgba(139, 92, 246, 0.1);
    color: #7c3aed;
  }
  :global(html.dark) .topic-badge.topic-equilibrium {
    background-color: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
  }

  .topic-badge.topic-determinacy {
    background-color: rgba(14, 116, 144, 0.1);
    color: #0e7490;
  }
  :global(html.dark) .topic-badge.topic-determinacy {
    background-color: rgba(14, 116, 144, 0.15);
    color: #22d3ee;
  }

  .topic-badge.topic-beam-internal-forces {
    background-color: rgba(124, 58, 237, 0.1);
    color: #6d28d9;
  }
  :global(html.dark) .topic-badge.topic-beam-internal-forces {
    background-color: rgba(124, 58, 237, 0.15);
    color: #c084fc;
  }

  /* Difficulty Badges */
  .difficulty-badge.diff-easy {
    background-color: rgba(16, 185, 129, 0.1);
    color: #059669;
  }
  :global(html.dark) .difficulty-badge.diff-easy {
    background-color: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }

  .difficulty-badge.diff-medium {
    background-color: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }
  :global(html.dark) .difficulty-badge.diff-medium {
    background-color: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
  }

  .difficulty-badge.diff-hard {
    background-color: rgba(244, 63, 94, 0.1);
    color: #e11d48;
  }
  :global(html.dark) .difficulty-badge.diff-hard {
    background-color: rgba(244, 63, 94, 0.15);
    color: #fb7185;
  }

  /* Completion Badge */
  .completion-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background-color: #10b981;
    color: white;
    border-radius: 50%;
    font-size: 0.75rem;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
  }

  .card-body {
    flex-grow: 1;
    margin-bottom: 0.75rem;
    z-index: 2;
  }

  .card-body h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 0.35rem;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .desc-text {
    font-size: 0.825rem;
    color: var(--text-secondary);
    line-height: 1.42;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-footer {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 600;
    padding-top: 0.6rem;
    border-top: 1px dashed var(--border-color);
    z-index: 2;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .meta-icon {
    font-size: 0.85rem;
  }

  .meta-separator {
    color: var(--border-color);
    margin: 0 0.15rem;
  }
</style>
