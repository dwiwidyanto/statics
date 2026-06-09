<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';

  export let showResetConfirm: boolean;
  export let onContinue: () => void;
  export let onDashboard: () => void;
  export let onExportJson: () => void;
  export let onExportCsv: () => void;
  export let onImportFile: (event: Event) => void;
  export let onTriggerReset: () => void;
  export let onConfirmReset: () => void;
  export let onCancelReset: () => void;

  let importFileInput: HTMLInputElement;

  function triggerImportPicker() {
    importFileInput.click();
  }
</script>

<div class="actions-row">
  <button class="btn btn-primary" on:click={onContinue}>
    {$locale === 'id' ? 'Lanjutkan Soal Berikutnya' : 'Continue Next Problem'}
  </button>
  <button class="btn btn-secondary" on:click={onDashboard}>
    {$locale === 'id' ? 'Lihat Soal Selesai' : 'Review Completed'}
  </button>
  <button class="btn btn-secondary" on:click={onExportJson}>
    {$locale === 'id' ? 'Ekspor Progres (JSON)' : 'Export Progress (JSON)'}
  </button>
  <button class="btn btn-secondary" on:click={onExportCsv}>
    {$locale === 'id' ? 'Ekspor Instruktur (CSV)' : 'Instructor Export (CSV)'}
  </button>
  <button class="btn btn-secondary" on:click={triggerImportPicker}>
    {$locale === 'id' ? 'Impor Progres' : 'Import Progress'}
  </button>
  <input
    type="file"
    accept=".json"
    class="file-input"
    bind:this={importFileInput}
    on:change={onImportFile}
  />

  {#if !showResetConfirm}
    <button class="btn btn-danger" on:click={onTriggerReset}>
      {$locale === 'id' ? 'Reset Progres' : 'Reset Progress'}
    </button>
  {:else}
    <div class="reset-confirm">
      <span>{$locale === 'id' ? 'Yakin ingin menghapus semua progres?' : 'Are you sure? This will erase all progress.'}</span>
      <button class="btn btn-danger" on:click={onConfirmReset}>
        {$locale === 'id' ? 'Ya, Hapus' : 'Yes, Reset'}
      </button>
      <button class="btn btn-secondary" on:click={onCancelReset}>
        {$locale === 'id' ? 'Batal' : 'Cancel'}
      </button>
    </div>
  {/if}
</div>

<style>
  .actions-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .file-input {
    display: none;
  }

  .btn {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.55rem 1.1rem;
    border-radius: 6px;
    cursor: pointer;
    border: none;
  }

  .btn-primary { background-color: var(--color-primary); color: white; }
  .btn-secondary { background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); }
  .btn-danger { background-color: #ef4444; color: white; }

  .reset-confirm {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    color: var(--color-error);
    font-weight: 600;
  }
</style>
