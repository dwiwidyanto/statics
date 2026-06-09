<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussModel } from '../../../lib/domain/truss/types';

  export let problem: TrussModel;
  export let onNavigate: (page: string, params?: any) => void;
</script>

<div class="step-card path-blocked-card" role="status">
  <h3>{$locale === 'id' ? 'Jalur Metode Titik Hubung Tidak Tersedia' : 'Method-of-Joints Path Unavailable'}</h3>
  <p class="desc">
    {$locale === 'id'
      ? 'Tidak ada joint tersisa dengan 1 unknown atau 2 unknown yang tidak segaris. Pada setiap joint, ΣFx = 0 dan ΣFy = 0 hanya memberi maksimal dua persamaan independen.'
      : 'No remaining joint has 1 unknown or 2 non-collinear unknowns. At each joint, ΣFx = 0 and ΣFy = 0 provide at most two independent equations.'}
  </p>
  <p class="desc">
    {$locale === 'id'
      ? 'Dua gaya batang yang segaris bekerja pada garis yang sama, sehingga keduanya tidak dapat diselesaikan bersama dari satu joint. Gaya positif berarti tarik; gaya negatif berarti tekan.'
      : 'Two collinear member forces act along the same line, so they cannot be solved together from one joint. Positive member force means tension; negative means compression.'}
  </p>
  <p class="desc">
    {$locale === 'id'
      ? 'Persamaan simultan joint tetap valid untuk rangka statis tertentu yang sesuai, tetapi itu bukan jalur Metode Titik Hubung terpandu langkah demi langkah.'
      : 'Simultaneous joint equilibrium is still mathematically valid for suitable determinate trusses, but it is not the same as a step-by-step guided method-of-joints path.'}
  </p>
  <div class="actions">
    <button class="btn btn-secondary" on:click={() => onNavigate('dashboard')}>
      {$locale === 'id' ? 'Ke Dashboard' : 'Dashboard'}
    </button>
    <button class="btn btn-primary" on:click={() => onNavigate('trusses', { problemId: problem.id })}>
      {$locale === 'id' ? 'Lihat Latihan Mandiri' : 'View Practice Results'}
    </button>
  </div>
</div>

<style>
  .step-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .path-blocked-card {
    border-left: 4px solid #f59e0b;
  }

  h3 {
    font-size: 1.05rem;
    margin: 0;
  }

  .desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
  }

  .btn {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    transition: background-color 0.15s;
  }

  .btn-primary { background-color: var(--color-primary); color: white; }
  .btn-primary:hover { background-color: var(--color-primary-hover); }
  .btn-secondary { background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); }
  .btn-secondary:hover { background-color: var(--border-color); }
</style>
