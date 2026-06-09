<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { AttemptReviewModel } from '../../../lib/domain/progress/attemptReviewModel';
  import ActionRow from '../../../lib/ui/ActionRow.svelte';
  import Button from '../../../lib/ui/Button.svelte';
  import Card from '../../../lib/ui/Card.svelte';

  export let reviewModel: AttemptReviewModel;
  export let onNavigate: (page: string, params?: any) => void;

  $: attempt = reviewModel.mode === 'not_found' ? null : reviewModel.attempt;
  $: storedScore = attempt ? `${Math.round(attempt.score * 100)}%` : '';

  function getTitle(): string {
    if (reviewModel.mode === 'not_found') {
      return $locale === 'id' ? 'Percobaan tidak ditemukan' : 'Attempt not found';
    }
    if (reviewModel.mode === 'missing_problem') {
      return $locale === 'id' ? 'Model soal tidak tersedia' : 'Problem model unavailable';
    }
    if (reviewModel.mode === 'summary_only' && reviewModel.reason === 'unsupported_topic') {
      return $locale === 'id' ? 'Ringkasan tersedia' : 'Summary available';
    }
    return $locale === 'id' ? 'Replay belum tersedia' : 'Replay unavailable';
  }

  function getMessage(): string {
    if (reviewModel.mode === 'not_found') {
      return $locale === 'id'
        ? 'Percobaan ini tidak ada di progres lokal browser ini.'
        : 'This attempt is not present in this browser local progress.';
    }
    if (reviewModel.mode === 'missing_problem') {
      return $locale === 'id'
        ? `Model rangka batang untuk percobaan ini tidak ditemukan: ${reviewModel.problemId}.`
        : `The truss model for this attempt could not be found: ${reviewModel.problemId}.`;
    }
    if (reviewModel.mode === 'summary_only' && reviewModel.reason === 'unsupported_topic') {
      return $locale === 'id'
        ? 'Data percobaan tersimpan, tetapi replay visual untuk topik ini belum didukung.'
        : 'The attempt data is saved, but visual replay for this topic is not supported yet.';
    }
    if (reviewModel.mode === 'summary_only' && reviewModel.reason === 'legacy_or_malformed') {
      return $locale === 'id'
        ? 'Percobaan ini memakai data telemetry lama atau tidak lengkap, jadi replay langkah demi langkah tidak dapat dibuat.'
        : 'This attempt uses legacy or incomplete telemetry, so a step-by-step replay cannot be reconstructed.';
    }
    return $locale === 'id'
      ? 'Percobaan ini belum memiliki data telemetry terpandu untuk replay visual.'
      : 'This attempt does not include guided telemetry for visual replay.';
  }

  function startRelatedProblem() {
    if (!attempt) return;
    const topic = attempt.topic ?? (reviewModel.mode === 'summary_only' ? reviewModel.telemetry?.topic : undefined);
    if (topic === 'trusses') {
      onNavigate(`trusses/${attempt.problemId}/guided`);
    } else if (topic === 'beam-internal-forces') {
      onNavigate(`guided/${attempt.problemId}`);
    } else {
      onNavigate('practice', { problemId: attempt.problemId });
    }
  }
</script>

<Card>
  <div class="empty-state">
    <h2>{getTitle()}</h2>
    <p>{getMessage()}</p>
    {#if attempt}
      <p class="score-line">
        {$locale === 'id' ? `Skor tersimpan: ${storedScore}` : `Stored score: ${storedScore}`}
      </p>
    {/if}
    <ActionRow>
      <Button variant="primary" on:click={() => onNavigate('progress')}>
        {$locale === 'id' ? 'Kembali ke Progres' : 'Back to Progress'}
      </Button>
      {#if attempt}
        <Button variant="secondary" on:click={startRelatedProblem}>
          {$locale === 'id' ? 'Coba Soal Lagi' : 'Start Problem Again'}
        </Button>
      {/if}
      <Button variant="secondary" on:click={() => onNavigate('dashboard')}>
        {$locale === 'id' ? 'Dashboard' : 'Go Dashboard'}
      </Button>
    </ActionRow>
  </div>
</Card>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    text-align: left;
  }

  h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .score-line {
    color: var(--text-primary);
    font-weight: 700;
  }
</style>
