<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';

  export let skillBreakdown: Record<string, number> | undefined = undefined;
</script>

{#if skillBreakdown}
  <div class="card panel-card">
    <h3>{$locale === 'id' ? 'Penguasaan Keterampilan' : 'Skill Mastery'}</h3>
    <div class="skills-grid">
      {#each Object.entries(skillBreakdown) as [skill, val]}
        <div class="skill-row">
          <span class="skill-name">
            {#if skill === 'determinacy'}{$locale === 'id' ? 'Determinasi' : 'Determinacy'}
            {:else if skill === 'reactions'}{$locale === 'id' ? 'Reaksi Tumpuan' : 'Reactions'}
            {:else if skill === 'zeroForceMembers'}{$locale === 'id' ? 'Batang Gaya Nol' : 'Zero-Force Members'}
            {:else if skill === 'jointSelection'}{$locale === 'id' ? 'Urutan Titik Hubung' : 'Joint Sequence'}
            {:else if skill === 'memberForces'}{$locale === 'id' ? 'Persamaan Gaya Batang' : 'Member Forces'}
            {/if}
          </span>
          <div class="skill-bar-wrapper">
            <div class="skill-bar" style="width: {val * 100}%"></div>
            <span class="skill-percent">{Math.round(val * 100)}%</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

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

  .skills-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .skill-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .skill-name {
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--text-secondary);
  }

  .skill-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--bg-primary);
    border-radius: 4px;
    padding: 0.2rem;
    border: 1px solid var(--border-color);
  }

  .skill-bar {
    height: 6px;
    background-color: var(--color-primary);
    border-radius: 3px;
  }

  .skill-percent {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-primary);
  }
</style>
