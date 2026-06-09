<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { ClassroomReport } from '../../../lib/domain/progress/classroomReport';
  import {
    buildAttemptReportFilename,
    serializeClassroomReportCsv,
    serializeClassroomReportJson
  } from '../../../lib/domain/progress/classroomReport';
  import { downloadTextFile } from '../../../lib/services/progressDownload';
  import ActionRow from '../../../lib/ui/ActionRow.svelte';
  import Button from '../../../lib/ui/Button.svelte';

  export let report: ClassroomReport;
  export let onPrint: () => void;

  function exportJson() {
    downloadTextFile(buildAttemptReportFilename(report, 'json'), 'application/json', serializeClassroomReportJson(report));
  }

  function exportCsv() {
    downloadTextFile(buildAttemptReportFilename(report, 'csv'), 'text/csv', serializeClassroomReportCsv(report));
  }
</script>

<div class="report-actions no-print">
  <ActionRow>
    <Button variant="secondary" size="sm" on:click={onPrint}>
      {$locale === 'id' ? 'Cetak / Simpan PDF' : 'Print / Save PDF'}
    </Button>
    <Button variant="secondary" size="sm" on:click={exportJson}>
      {$locale === 'id' ? 'Ekspor JSON' : 'Export JSON'}
    </Button>
    <Button variant="secondary" size="sm" on:click={exportCsv}>
      {$locale === 'id' ? 'Ekspor CSV' : 'Export CSV'}
    </Button>
  </ActionRow>
</div>

<style>
  @media print {
    .no-print {
      display: none !important;
    }
  }
</style>
