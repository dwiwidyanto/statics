<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { LearningRecommendation, LearningRecommendationTarget } from '../../../lib/domain/progress/recommendations';
  import Card from '../../../lib/ui/Card.svelte';
  import Button from '../../../lib/ui/Button.svelte';

  export let recommendations: LearningRecommendation[];
  export let onOpen: (targetRoute?: string | LearningRecommendationTarget) => void;
</script>

{#if recommendations.length > 0}
  <Card>
    <div class="recommended-next">
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
            {#if recommendation.target || recommendation.targetRoute}
              <Button variant="secondary" on:click={() => onOpen(recommendation.target ?? recommendation.targetRoute)}>
                {$locale === 'id' ? 'Buka' : 'Open'}
              </Button>
            {/if}
          </article>
        {/each}
      </div>
    </div>
  </Card>
{/if}

<style>
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

  .recommendation-priority.high { color: #dc2626; }
  .recommendation-priority.medium { color: #d97706; }
  .recommendation-priority.low { color: #059669; }
</style>
