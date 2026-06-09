<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { TrussEquationSystem, TrussSolverMethod } from '../../../lib/domain/truss/types';

  export let solverMethod: TrussSolverMethod | undefined = 'method_of_joints';
  export let equationSystem: TrussEquationSystem | undefined = undefined;
</script>

<section class="solver-method-panel">
  <h3>{$locale === 'id' ? 'Cara Penyelesaian Solver' : 'How This Was Solved'}</h3>
  {#if solverMethod === 'simultaneous_joint_equilibrium_fallback'}
    <p><strong>{$locale === 'id' ? 'Fallback persamaan simultan joint.' : 'Solved by simultaneous joint equilibrium fallback.'}</strong></p>
    <p>
      {$locale === 'id'
        ? 'Rangka ini statis tertentu, tetapi langkah joint-by-joint tidak dapat lanjut karena tidak ada joint dengan dua atau lebih sedikit gaya tak diketahui pada tahap itu. Aplikasi merakit semua persamaan ΣFx dan ΣFy lalu menyelesaikannya bersama.'
        : 'The truss is statically determinate, but the greedy joint-by-joint path could not continue because no joint had two or fewer unresolved unknowns at that step. The app assembled all ΣFx and ΣFy equations and solved them together.'}
    </p>
    <p>{$locale === 'id' ? 'Gaya batang positif berarti tarik; negatif berarti tekan.' : 'Positive member force means tension; negative means compression.'}</p>
    {#if equationSystem}
      <div class="method-metrics">
        <span>m + r: <strong>{equationSystem.unknownCount}</strong></span>
        <span>2j: <strong>{equationSystem.equationCount}</strong></span>
        <span>{$locale === 'id' ? 'Residual maks' : 'Max residual'}: <strong>{equationSystem.residuals.maxAbs.toFixed(2)} N</strong></span>
      </div>
    {/if}
  {:else}
    <p><strong>{$locale === 'id' ? 'Diselesaikan dengan metode titik hubung langkah demi langkah.' : 'Solved by step-by-step method of joints.'}</strong></p>
    <p>{$locale === 'id' ? 'Urutan persamaan joint tersedia pada panel persamaan ketika jawaban diperiksa.' : 'The joint equation sequence is available in the equation panel after answers are checked.'}</p>
  {/if}
</section>

<style>
  .solver-method-panel {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  h3 {
    margin: 0;
    font-size: 0.95rem;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .method-metrics {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
</style>
