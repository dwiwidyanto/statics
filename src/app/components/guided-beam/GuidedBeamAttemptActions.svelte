<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import ActionRow from '../../../lib/ui/ActionRow.svelte';
  import Button from '../../../lib/ui/Button.svelte';

  export let activeStep: number;
  export let totalSteps: number;
  export let showReactionsSolved: boolean;
  export let onPrevious: () => void;
  export let onNext: () => void;
  export let onVerify: () => void;
  export let onFinish: () => void;
</script>

<div class="stepper-footer">
  <ActionRow align="between">
    <Button variant="secondary" on:click={onPrevious} disabled={activeStep === 1}>
      ← {$locale === 'id' ? 'Sebelumnya' : 'Previous'}
    </Button>

    {#if activeStep === 3 && !showReactionsSolved}
      <Button variant="primary" on:click={onVerify}>
        {$locale === 'id' ? 'Periksa Jawaban' : 'Verify Reactions'}
      </Button>
    {:else if activeStep < totalSteps}
      <Button variant="primary" on:click={onNext}>
        {$locale === 'id' ? 'Selanjutnya' : 'Next'} →
      </Button>
    {:else}
      <Button variant="primary" on:click={onFinish}>
        {$locale === 'id' ? 'Selesai & Keluar' : 'Finish & Exit'}
      </Button>
    {/if}
  </ActionRow>
</div>

<style>
  .stepper-footer {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
</style>
