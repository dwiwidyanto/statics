<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import ActionRow from '../../../lib/ui/ActionRow.svelte';
  import Button from '../../../lib/ui/Button.svelte';
  import Card from '../../../lib/ui/Card.svelte';

  export let problemId: string;
  export let onNavigate: (page: string, params?: any) => void;
</script>

<Card>
  <div class="not-found-state">
    <span class="eyebrow">{$locale === 'id' ? 'Soal tidak ditemukan' : 'Problem not found'}</span>
    <h1>{$locale === 'id' ? 'Model rangka batang tidak tersedia' : 'Truss model unavailable'}</h1>
    <p>
      {$locale === 'id'
        ? `ID soal "${problemId || '(kosong)'}" tidak cocok dengan daftar rangka batang lokal. Tidak ada penyelesaian atau progres yang disimpan untuk rute ini.`
        : `Problem id "${problemId || '(empty)'}" does not match the local truss problem list. No solve or progress save was attempted for this route.`}
    </p>
    <ActionRow>
      <Button variant="primary" on:click={() => onNavigate('trusses')}>
        {$locale === 'id' ? 'Ke Latihan Rangka' : 'Truss Practice'}
      </Button>
      <Button variant="secondary" on:click={() => onNavigate('dashboard')}>
        {$locale === 'id' ? 'Dashboard' : 'Dashboard'}
      </Button>
    </ActionRow>
  </div>
</Card>

<style>
  .not-found-state {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .eyebrow {
    color: var(--color-error);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: 1.45rem;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>
