<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import ActionRow from '../../../lib/ui/ActionRow.svelte';
  import Button from '../../../lib/ui/Button.svelte';
  import ConfirmPanel from '../../../lib/ui/ConfirmPanel.svelte';

  export let showResetConfirm: boolean;
  export let onContinue: () => void;
  export let onDashboard: () => void;
  export let onTriggerReset: () => void;
  export let onConfirmReset: () => void;
  export let onCancelReset: () => void;
</script>

<ActionRow>
  <Button variant="primary" on:click={onContinue}>
    {$locale === 'id' ? 'Lanjutkan Soal Berikutnya' : 'Continue Next Problem'}
  </Button>
  <Button variant="secondary" on:click={onDashboard}>
    {$locale === 'id' ? 'Lihat Soal Selesai' : 'Review Completed'}
  </Button>

  {#if !showResetConfirm}
    <Button variant="danger" on:click={onTriggerReset}>
      {$locale === 'id' ? 'Reset Progres' : 'Reset Progress'}
    </Button>
  {:else}
    <ConfirmPanel
      danger
      title={$locale === 'id' ? 'Hapus semua progres?' : 'Erase all progress?'}
      message={$locale === 'id' ? 'Tindakan ini menghapus semua progres lokal di browser ini.' : 'This removes all local progress in this browser.'}
      confirmLabel={$locale === 'id' ? 'Ya, Hapus' : 'Yes, Reset'}
      cancelLabel={$locale === 'id' ? 'Batal' : 'Cancel'}
      on:confirm={onConfirmReset}
      on:cancel={onCancelReset}
    />
  {/if}
</ActionRow>
