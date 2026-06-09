<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { ProgressImportPlan } from '../../../lib/services/progressImportPlan';

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
      <div class="import-warning-list" role="alert">
        {#each plan.warnings as warning}
          <p>{warning}</p>
        {/each}
      </div>
    {/if}

    <div class="import-options">
      <button class="btn btn-primary" disabled={!plan.canMerge} on:click={onMerge}>
        <strong>{$locale === 'id' ? 'Gabungkan Progres' : 'Merge Progress'}</strong>
        <span>{$locale === 'id' ? 'Menyimpan progres saat ini dan menambahkan data baru' : 'Keep existing attempts and add new ones'}</span>
      </button>

      {#if plan.canReplaceSafely}
        <button class="btn btn-danger" on:click={onReplace}>
          <strong>{$locale === 'id' ? 'Ganti Seluruh Progres' : 'Replace Entire Progress'}</strong>
          <span>{$locale === 'id' ? 'Menghapus progres saat ini terlebih dahulu' : 'Erase current progress first'}</span>
        </button>
      {:else if plan.requiresDangerousEmptyReplaceConfirmation}
        <div class="danger-zone">
          <p>
            {$locale === 'id'
              ? 'Berkas ini tidak memiliki percobaan valid. Mengganti progres akan menghapus semua progres lokal.'
              : 'This file has zero valid attempts. Replacing progress will erase all local progress.'}
          </p>
          <button class="btn btn-danger danger-confirm" on:click={onDangerousEmptyReplace}>
            {$locale === 'id' ? 'Ya, hapus semua progres dan impor berkas kosong' : 'Yes, erase all progress and import empty file'}
          </button>
        </div>
      {/if}

      <button class="btn btn-secondary" on:click={onCancel}>
        {$locale === 'id' ? 'Batal' : 'Cancel'}
      </button>
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

  .import-warning-list,
  .danger-zone {
    border: 1px solid rgba(245, 158, 11, 0.25);
    background-color: rgba(245, 158, 11, 0.08);
    border-radius: 8px;
    padding: 0.75rem;
  }

  .danger-zone {
    border-color: rgba(239, 68, 68, 0.35);
    background-color: rgba(239, 68, 68, 0.08);
  }

  .btn {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.6rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    border: none;
  }

  .import-options .btn:not(.danger-confirm) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 0.15rem;
  }

  .import-options .btn span {
    font-size: 0.75rem;
    font-weight: normal;
    opacity: 0.8;
  }

  .btn-primary { background-color: var(--color-primary); color: white; }
  .btn-secondary { background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); }
  .btn-danger { background-color: #ef4444; color: white; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
