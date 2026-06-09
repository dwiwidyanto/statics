<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { ProgressImportPlan } from '../../../lib/services/progressImportPlan';
  import Button from '../../../lib/ui/Button.svelte';
  import ConfirmPanel from '../../../lib/ui/ConfirmPanel.svelte';
  import StatusBanner from '../../../lib/ui/StatusBanner.svelte';

  export let plan: ProgressImportPlan;
  export let onMerge: () => void;
  export let onReplace: () => void;
  export let onDangerousEmptyReplace: () => void;
  export let onCancel: () => void;
</script>

<div class="import-modal-overlay">
  <div
    class="import-modal-card card"
    role="dialog"
    aria-modal="true"
    aria-labelledby="progress-import-title"
  >
    <h3 id="progress-import-title">{$locale === 'id' ? 'Konfirmasi Impor Progres' : 'Confirm Progress Import'}</h3>
    <p>{$locale === 'id' ? plan.summaryMessage.id : plan.summaryMessage.en}</p>
    <p class="schema-note">
      {$locale === 'id'
        ? `Versi skema impor: ${plan.schemaVersion}. Total kandidat: ${plan.importedCandidateCount}.`
        : `Imported schema version: ${plan.schemaVersion}. Candidate records: ${plan.importedCandidateCount}.`}
    </p>

    {#if plan.warnings.length > 0}
      <StatusBanner tone="warning" role="alert">
        {#each plan.warnings as warning}
          <p>{warning}</p>
        {/each}
      </StatusBanner>
    {/if}

    <div class="import-options">
      <Button variant="primary" fullWidth disabled={!plan.canMerge} on:click={onMerge}>
        <strong>{$locale === 'id' ? 'Gabungkan Progres' : 'Merge Progress'}</strong>
        <span>{$locale === 'id' ? 'Menyimpan progres saat ini dan menambahkan data baru' : 'Keep existing attempts and add new ones'}</span>
      </Button>

      {#if plan.canReplaceSafely}
        <Button variant="danger" fullWidth on:click={onReplace}>
          <strong>{$locale === 'id' ? 'Ganti Seluruh Progres' : 'Replace Entire Progress'}</strong>
          <span>{$locale === 'id' ? 'Menghapus progres saat ini terlebih dahulu' : 'Erase current progress first'}</span>
        </Button>
      {:else if plan.requiresDangerousEmptyReplaceConfirmation}
        <ConfirmPanel
          danger
          title={$locale === 'id' ? 'Berkas impor kosong' : 'Empty import file'}
          message={$locale === 'id'
            ? 'Berkas ini tidak memiliki percobaan valid. Mengganti progres akan menghapus semua progres lokal.'
            : 'This file has zero valid attempts. Replacing progress will erase all local progress.'}
          confirmLabel={$locale === 'id' ? 'Ya, hapus semua progres' : 'Yes, erase progress'}
          cancelLabel={$locale === 'id' ? 'Batal' : 'Cancel'}
          on:confirm={onDangerousEmptyReplace}
          on:cancel={onCancel}
        />
      {/if}

      <Button variant="secondary" fullWidth on:click={onCancel}>
        {$locale === 'id' ? 'Batal' : 'Cancel'}
      </Button>
    </div>
  </div>
</div>

<style>
  .card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1.75rem;
  }

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
    max-width: 520px;
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

  .schema-note {
    font-size: 0.8rem;
  }

  .import-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .import-options :global(button) {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 0.15rem;
  }

  .import-options :global(button span) {
    font-size: 0.75rem;
    font-weight: normal;
    opacity: 0.8;
  }
</style>
