<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import { getProgressRepository } from '../../../lib/services/localProgressRepository';
  import { createProgressImportPlan, type ProgressImportMode, type ProgressImportPlan } from '../../../lib/services/progressImportPlan';
  import ActionRow from '../../../lib/ui/ActionRow.svelte';
  import Button from '../../../lib/ui/Button.svelte';
  import StatusBanner from '../../../lib/ui/StatusBanner.svelte';
  import ProgressImportModal from './ProgressImportModal.svelte';
  import ProgressImportResultBanner from './ProgressImportResultBanner.svelte';

  export let onImported: () => void;

  const repo = getProgressRepository();

  let importFileInput: HTMLInputElement;
  let importPlan: ProgressImportPlan | null = null;
  let importingPayload: unknown = null;
  let importError: string | null = null;
  let importResult: {
    mode: ProgressImportMode;
    schemaVersion: number;
    validAttempts: number;
    importedAttempts: number;
    replacedAttempts: number;
    duplicateAttempts: number;
    internalDuplicateAttempts: number;
    skippedInvalidAttempts: number;
    warnings: string[];
  } | null = null;

  function triggerImportPicker() {
    importFileInput.click();
  }

  function clearPendingImport() {
    importError = null;
    importPlan = null;
    importingPayload = null;
  }

  function handleFileImport(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        importPlan = createProgressImportPlan(parsed, repo.getAttempts());
        importingPayload = parsed;
        importResult = null;
        importError = null;
      } catch {
        importError = 'Failed to parse JSON text. File may be corrupted.';
        importPlan = null;
        importingPayload = null;
      }
    };
    reader.onerror = () => {
      importError = 'Failed to read import file.';
      importPlan = null;
      importingPayload = null;
    };
    reader.readAsText(file);
    target.value = '';
  }

  function applyImport(mode: ProgressImportMode, allowDangerousEmptyReplace = false) {
    if (!importingPayload || !importPlan) return;
    const result = repo.importProgress(importingPayload, mode, { allowDangerousEmptyReplace });
    importResult = {
      mode,
      schemaVersion: result.schemaVersion,
      validAttempts: result.validAttempts,
      importedAttempts: result.importedAttempts,
      replacedAttempts: result.replacedAttempts,
      duplicateAttempts: result.duplicateAttempts,
      internalDuplicateAttempts: result.internalDuplicateAttempts,
      skippedInvalidAttempts: importPlan.skippedInvalidCount,
      warnings: result.warnings
    };
    importPlan = null;
    importingPayload = null;
    onImported();
  }
</script>

<div class="import-controller">
  <ActionRow>
    <Button variant="secondary" on:click={triggerImportPicker}>
      {$locale === 'id' ? 'Impor Progres' : 'Import Progress'}
    </Button>
  </ActionRow>
  <input
    type="file"
    accept=".json"
    class="file-input"
    bind:this={importFileInput}
    on:change={handleFileImport}
  />

  {#if importError}
    <StatusBanner tone="danger" role="alert">
      <div class="error-content">
        <span>{importError}</span>
        <Button variant="secondary" size="sm" on:click={() => importError = null}>
          {$locale === 'id' ? 'Tutup' : 'Dismiss'}
        </Button>
      </div>
    </StatusBanner>
  {/if}

  {#if importResult}
    <ProgressImportResultBanner
      mode={importResult.mode}
      schemaVersion={importResult.schemaVersion}
      validAttempts={importResult.validAttempts}
      importedAttempts={importResult.importedAttempts}
      replacedAttempts={importResult.replacedAttempts}
      duplicateAttempts={importResult.duplicateAttempts}
      internalDuplicateAttempts={importResult.internalDuplicateAttempts}
      skippedInvalidAttempts={importResult.skippedInvalidAttempts}
      warnings={importResult.warnings}
    />
  {/if}

  {#if importPlan}
    <ProgressImportModal
      plan={importPlan}
      onMerge={() => applyImport('merge')}
      onReplace={() => applyImport('replace', false)}
      onDangerousEmptyReplace={() => applyImport('replace', true)}
      onCancel={clearPendingImport}
    />
  {/if}
</div>

<style>
  .import-controller {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .file-input {
    display: none;
  }

  .error-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .error-content {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>
