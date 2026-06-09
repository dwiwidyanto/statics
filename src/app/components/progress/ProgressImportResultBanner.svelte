<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import StatusBanner from '../../../lib/ui/StatusBanner.svelte';
  import type { ProgressImportMode } from '../../../lib/services/progressImportPlan';

  export let mode: ProgressImportMode;
  export let schemaVersion: number;
  export let validAttempts: number;
  export let importedAttempts: number;
  export let replacedAttempts: number;
  export let duplicateAttempts: number;
  export let internalDuplicateAttempts: number;
  export let skippedInvalidAttempts: number;
  export let warnings: string[] = [];
</script>

<StatusBanner tone="success" role="status">
  <span>
    {$locale === 'id'
      ? `Impor ${mode === 'merge' ? 'gabung' : 'ganti'} selesai: skema v${schemaVersion}, ${validAttempts} valid, ${importedAttempts} ditambahkan, ${replacedAttempts} diganti, ${duplicateAttempts} duplikat lama, ${internalDuplicateAttempts} duplikat internal, ${skippedInvalidAttempts} tidak valid.`
      : `${mode === 'merge' ? 'Merge' : 'Replace'} import complete: schema v${schemaVersion}, ${validAttempts} valid, ${importedAttempts} added, ${replacedAttempts} replaced, ${duplicateAttempts} existing duplicates, ${internalDuplicateAttempts} internal duplicates, ${skippedInvalidAttempts} invalid.`}
  </span>
  {#if warnings.length > 0}
    <ul>
      {#each warnings as warning}
        <li>{warning}</li>
      {/each}
    </ul>
  {/if}
</StatusBanner>

<style>
  ul {
    margin: 0.5rem 0 0 1rem;
    padding: 0;
    color: var(--text-secondary);
    font-weight: 400;
  }
</style>
