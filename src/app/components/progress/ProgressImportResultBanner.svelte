<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { ProgressImportMode } from '../../../lib/services/progressImportPlan';

  export let mode: ProgressImportMode;
  export let schemaVersion: number;
  export let validAttempts: number;
  export let importedAttempts: number;
  export let replacedAttempts: number;
  export let duplicateAttempts: number;
  export let skippedInvalidAttempts: number;
  export let warnings: string[] = [];
</script>

<div class="import-result-banner" role="status">
  <span>
    {$locale === 'id'
      ? `Impor ${mode === 'merge' ? 'gabung' : 'ganti'} selesai: skema v${schemaVersion}, ${validAttempts} valid, ${importedAttempts} ditambahkan, ${replacedAttempts} diganti, ${duplicateAttempts} duplikat, ${skippedInvalidAttempts} tidak valid.`
      : `${mode === 'merge' ? 'Merge' : 'Replace'} import complete: schema v${schemaVersion}, ${validAttempts} valid, ${importedAttempts} added, ${replacedAttempts} replaced, ${duplicateAttempts} duplicates, ${skippedInvalidAttempts} invalid.`}
  </span>
  {#if warnings.length > 0}
    <ul>
      {#each warnings as warning}
        <li>{warning}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .import-result-banner {
    background-color: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
    color: var(--text-primary);
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .import-result-banner ul {
    margin: 0.5rem 0 0 1rem;
    padding: 0;
    color: var(--text-secondary);
    font-weight: 400;
  }
</style>
