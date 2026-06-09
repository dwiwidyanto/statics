<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { ClassroomReport } from '../../../lib/domain/progress/classroomReport';

  export let report: ClassroomReport;

  function percent(value: number | null): string {
    return value === null ? '-' : `${Math.round(value * 100)}%`;
  }
</script>

<section class="print-report">
  <h2>{$locale === 'id' ? 'Laporan Percobaan Siswa' : 'Student Attempt Report'}</h2>
  <dl>
    <div><dt>{$locale === 'id' ? 'Soal' : 'Problem'}</dt><dd>{$locale === 'id' ? report.titleId || report.title : report.title}</dd></div>
    <div><dt>Topic</dt><dd>{report.topic}</dd></div>
    <div><dt>Difficulty</dt><dd>{report.difficulty || '-'}</dd></div>
    <div><dt>Score</dt><dd>{percent(report.score)}</dd></div>
    <div><dt>Status</dt><dd>{report.completed ? ($locale === 'id' ? 'Selesai' : 'Completed') : ($locale === 'id' ? 'Belum selesai' : 'Incomplete')}</dd></div>
    <div><dt>{$locale === 'id' ? 'Tanggal' : 'Created'}</dt><dd>{report.createdAt}</dd></div>
    <div><dt>{$locale === 'id' ? 'Durasi' : 'Duration'}</dt><dd>{report.durationSeconds === null ? '-' : `${report.durationSeconds}s`}</dd></div>
    <div><dt>{$locale === 'id' ? 'Akurasi Percobaan Pertama' : 'First Attempt Accuracy'}</dt><dd>{percent(report.firstAttemptAccuracy)}</dd></div>
    <div><dt>{$locale === 'id' ? 'Petunjuk' : 'Hints'}</dt><dd>{report.totalHintsUsed}</dd></div>
    <div><dt>{$locale === 'id' ? 'Metode Solver' : 'Solver Method'}</dt><dd>{report.solver.method}</dd></div>
    {#if report.solver.maxResidual !== undefined}
      <div><dt>{$locale === 'id' ? 'Residual Maks' : 'Max Residual'}</dt><dd>{report.solver.maxResidual} N</dd></div>
    {/if}
  </dl>

  <h3>{$locale === 'id' ? 'Keterampilan' : 'Skill Breakdown'}</h3>
  <ul>{#each Object.entries(report.skillBreakdown) as [skill, value]}<li>{skill}: {percent(value)}</li>{/each}</ul>

  <h3>{$locale === 'id' ? 'Miskonsepsi dan Remediasi' : 'Misconceptions and Remediation'}</h3>
  {#if report.misconceptions.length > 0}
    <ul>
      {#each report.misconceptions as item}
        <li><strong>{$locale === 'id' ? item.title.id : item.title.en}</strong>: {$locale === 'id' ? item.remediation.id : item.remediation.en}</li>
      {/each}
    </ul>
  {:else}
    <p>-</p>
  {/if}

  <h3>{$locale === 'id' ? 'Jawaban Akhir' : 'Final Answers'}</h3>
  <ul>{#each Object.entries(report.finalAnswers) as [key, value]}<li>{key}: {value}</li>{/each}</ul>

  <h3>{$locale === 'id' ? 'Jawaban Referensi' : 'Reference Answers'}</h3>
  <ul>{#each Object.entries(report.referenceAnswers) as [key, value]}<li>{key}: {value}</li>{/each}</ul>

  <h3>{$locale === 'id' ? 'Umpan Balik' : 'Feedback'}</h3>
  <ul>{#each report.feedback as message}<li>{message}</li>{/each}</ul>
</section>

<style>
  .print-report {
    display: none;
  }

  @media print {
    .print-report {
      display: block;
      border: 1px solid #d1d5db;
      padding: 1rem;
      color: #111827;
      background: #ffffff;
    }

    h2,
    h3 {
      color: #111827;
      margin-top: 0.75rem;
    }

    dl {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.35rem 1rem;
      margin: 0.5rem 0 1rem;
    }

    div {
      break-inside: avoid;
    }

    dt {
      font-weight: 700;
    }

    dd {
      margin: 0;
    }
  }
</style>
