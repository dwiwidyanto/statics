<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import { misconceptionsDictionary } from '../../../content/learning/misconceptions';

  export let misconceptions: string[] = [];

  $: uniqueMisconceptions = Array.from(new Set(misconceptions));
</script>

<div class="card panel-card">
  <h3>{$locale === 'id' ? 'Miskonsepsi yang Terdeteksi' : 'Detected Misconceptions'}</h3>
  {#if uniqueMisconceptions.length > 0}
    <div class="misconceptions-list">
      {#each uniqueMisconceptions as misc}
        {#if misconceptionsDictionary[misc]}
          <div class="misconception-card">
            <span class="misc-badge">⚠️ {$locale === 'id' ? misconceptionsDictionary[misc].title.id : misconceptionsDictionary[misc].title.en}</span>
            <p class="misc-desc">
              {$locale === 'id' ? misconceptionsDictionary[misc].explanation.id : misconceptionsDictionary[misc].explanation.en}
            </p>
          </div>
        {/if}
      {/each}
    </div>
  {:else}
    <p class="no-misconceptions">
      🎉 {$locale === 'id' ? 'Luar biasa! Tidak ada miskonsepsi yang terdeteksi.' : 'Excellent! No misconceptions detected.'}
    </p>
  {/if}
</div>

<style>
  .card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .panel-card {
    margin-bottom: 1.25rem;
  }

  .panel-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .misconceptions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .misconception-card {
    padding: 0.6rem;
    border-radius: 6px;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-left: 3px solid #f59e0b;
  }

  .misc-badge {
    font-size: 0.75rem;
    font-weight: bold;
    color: #d97706;
  }

  .misc-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 0.25rem 0 0 0;
    line-height: 1.35;
  }

  .no-misconceptions {
    font-size: 0.82rem;
    color: var(--text-secondary);
    margin: 0;
  }
</style>
