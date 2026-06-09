<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { Attempt } from '../../../lib/domain/progress/types';
  import { serializeProgressData } from '../../../lib/services/progressExport';
  import { serializeAttemptsCsv } from '../../../lib/services/progressCsvExport';
  import { buildInstructorCsvFilename, buildProgressExportFilename, downloadTextFile } from '../../../lib/services/progressDownload';
  import ActionRow from '../../../lib/ui/ActionRow.svelte';
  import Button from '../../../lib/ui/Button.svelte';

  export let attempts: Attempt[];

  function handleExportJson() {
    downloadTextFile(
      buildProgressExportFilename(),
      'application/json',
      serializeProgressData(attempts)
    );
  }

  function handleExportCsv() {
    downloadTextFile(
      buildInstructorCsvFilename(),
      'text/csv',
      serializeAttemptsCsv(attempts)
    );
  }
</script>

<ActionRow>
  <Button variant="secondary" on:click={handleExportJson}>
    {$locale === 'id' ? 'Ekspor Progres (JSON)' : 'Export Progress (JSON)'}
  </Button>
  <Button variant="secondary" on:click={handleExportCsv}>
    {$locale === 'id' ? 'Ekspor Instruktur (CSV)' : 'Instructor Export (CSV)'}
  </Button>
</ActionRow>
