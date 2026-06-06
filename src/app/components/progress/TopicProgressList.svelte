<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TopicStats } from '../../../lib/domain/progress/types';

  export let byTopic: Record<string, TopicStats>;

  const topicLabels: Record<string, { en: string; id: string }> = {
    'fbd': { en: 'Free-Body Diagrams', id: 'Diagram Benda Bebas' },
    'equilibrium': { en: 'Equilibrium', id: 'Kesetimbangan' },
    'determinacy': { en: 'Determinacy & Stability', id: 'Determinasi & Stabilitas' },
    'beam-internal-forces': { en: 'Beam Internal Forces', id: 'Gaya Dalam Balok' },
    'trusses': { en: 'Trusses', id: 'Rangka Batang' },
  };

  function topicLabel(key: string): string {
    const t = topicLabels[key];
    return t ? ($locale === 'id' ? t.id : t.en) : key;
  }

  function formatScore(score: number): string {
    return `${Math.round(score * 100)}%`;
  }
</script>

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
    {#each Object.entries(byTopic) as [topic, data]}
      <div class="topic-row">
        <span class="topic-name">{topicLabel(topic)}</span>
        <span>{data.total}</span>
        <span>{data.attempted}</span>
        <span>{data.completed}</span>
        <span class="score-badge">{formatScore(data.averageBestScore)}</span>
      </div>
    {/each}
    {#if Object.keys(byTopic).length === 0}
      <div class="topic-row empty-row">
        <span>{$locale === 'id' ? 'Belum ada data' : 'No data yet'}</span>
      </div>
    {/if}
  </div>
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
</style>
