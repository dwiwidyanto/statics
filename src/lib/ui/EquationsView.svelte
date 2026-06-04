<script lang="ts">
  import type { SolverResult, Support } from '../domain/models/types';
  import { locale, translations } from '../../lib/utils/i18n';

  export let solverResult: SolverResult;
  export let supports: Support[];
  export let showReactions: boolean;

  $: hasUnknowns = Object.keys(solverResult.reactions).length > 0;

  // Format equations to render nice subscripts and operators in HTML
  function formatEquationHtml(eq: string): string {
    if (!eq) return '';
    // Replace R_Ax with R<sub>Ax</sub>, M_A with M<sub>A</sub>, F1_x with F1<sub>x</sub>, etc.
    let res = eq.replace(/([RMFw])_([a-zA-Z0-9]+)/g, '$1<sub>$2</sub>');
    // Replace * with ·
    res = res.replace(/\s*\*\s*/g, ' · ');
    return res;
  }

  // Format reaction symbols in HTML
  function formatReactionSymbol(sym: string): string {
    if (!sym) return '';
    return sym.replace(/([RMF])_([a-zA-Z0-9]+)/g, '$1<sub>$2</sub>');
  }
</script>

<div class="equations-view">
  <h3 class="panel-title">{translations[$locale].equilibriumHelper}</h3>
  
  <div class="pivot-info">
    {translations[$locale].momentPivotChosen} <strong>({solverResult.momentPivot.x.toFixed(1)}m, {solverResult.momentPivot.y.toFixed(1)}m)</strong> 
    {#if supports.length > 0}
      ({translations[$locale].support} {supports[0].label}).
    {:else}
      ({translations[$locale].bodyCenter}).
    {/if}
  </div>

  <div class="equations-box">
    <div class="equation-item">
      <div class="eq-header">
        <span class="eq-symbol">Σ F<sub>x</sub> = 0</span>
        <span class="eq-desc">{translations[$locale].sumHorizontalDesc}</span>
      </div>
      <div class="eq-string monospace">
        {@html formatEquationHtml(solverResult.equations.fx)}
      </div>
    </div>

    <div class="equation-item">
      <div class="eq-header">
        <span class="eq-symbol">Σ F<sub>y</sub> = 0</span>
        <span class="eq-desc">{translations[$locale].sumVerticalDesc}</span>
      </div>
      <div class="eq-string monospace">
        {@html formatEquationHtml(solverResult.equations.fy)}
      </div>
    </div>

    <div class="equation-item">
      <div class="eq-header">
        <span class="eq-symbol">Σ M<sub>P</sub> = 0</span>
        <span class="eq-desc">{translations[$locale].sumMomentDesc}</span>
      </div>
      <div class="eq-string monospace">
        {@html formatEquationHtml(solverResult.equations.moment)}
      </div>
      <div class="moment-explanation">
        {#if $locale === 'id'}
          Momen dihitung sebagai: <code>M = F<sub>y</sub> · Δx - F<sub>x</sub> · Δy</code>, di mana <code>Δx = x<sub>gaya</sub> - x<sub>pusat</sub></code> dan <code>Δy = y<sub>gaya</sub> - y<sub>pusat</sub></code>. Putaran berlawanan jarum jam bernilai positif (↺).
        {:else}
          Moment is calculated as: <code>M = F<sub>y</sub> · Δx - F<sub>x</sub> · Δy</code>, where <code>Δx = x<sub>force</sub> - x<sub>pivot</sub></code> and <code>Δy = y<sub>force</sub> - y<sub>pivot</sub></code>. Counter-clockwise is positive (↺).
        {/if}
      </div>
    </div>
  </div>

  <h3 class="panel-title" style="margin-top: 1rem;">{translations[$locale].calculatedReactions}</h3>
  
  {#if solverResult.isSolved && showReactions}
    <div class="reactions-grid">
      {#each Object.entries(solverResult.reactions) as [symbol, value]}
        <div class="reaction-item-box">
          <span class="reaction-symbol">{@html formatReactionSymbol(symbol)}</span>
          <span class="reaction-value {value < -0.01 ? 'negative' : 'positive'}">
            {value.toFixed(2)} {symbol.startsWith('M') ? 'N·m' : 'N'}
          </span>
          <span class="reaction-direction">
            {#if symbol.startsWith('M')}
              {value >= 0 ? translations[$locale].ccw : translations[$locale].cw}
            {:else if symbol.endsWith('x')}
              {value >= 0 ? translations[$locale].right : translations[$locale].left}
            {:else}
              {value >= 0 ? translations[$locale].up : translations[$locale].down}
            {/if}
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="unsolved-box">
      {#if solverResult.determinacy === 'statically_indeterminate'}
        <p class="text-warning font-semibold">{translations[$locale].staticallyIndeterminateText}</p>
        <p class="text-sm text-secondary">
          {#if $locale === 'id'}
            Terdapat {Object.keys(solverResult.reactions).length || 4} reaksi yang tidak diketahui, tetapi hanya tersedia 3 persamaan kesetimbangan dalam 2D.
            Untuk menyelesaikannya, Anda harus menerapkan kondisi deformasi dan properti bahan (Mekanika Bahan).
          {:else}
            There are {Object.keys(solverResult.reactions).length || 4} unknown reactions, but only 3 equilibrium equations in 2D. 
            To solve this, you must apply deformation conditions and material properties (Mechanics of Materials).
          {/if}
        </p>
      {:else if solverResult.determinacy === 'unstable'}
        <p class="text-danger font-semibold">{$locale === 'id' ? 'Sistem Labil (Unstable)' : 'Unstable System'}</p>
        <p class="text-sm text-secondary">
          {#if $locale === 'id'}
            Sistem tidak dapat diselesaikan karena tidak stabil secara struktural (tumpuan terlalu sedikit, atau susunannya memungkinkan gerakan).
            Tinjau peringatan diagnostik di Panel Umpan Balik untuk menstabilkan sistem.
          {:else}
            The system cannot be solved because it is structurally unstable (either too few supports, or supports are arranged in a way that allows motion). 
            Review the diagnostics warnings in the Feedback Panel to stabilize the system.
          {/if}
        </p>
      {:else}
        <p class="text-secondary">
          {$locale === 'id' ? 'Menunggu susunan tumpuan yang stabil untuk menghitung reaksi...' : 'Waiting for a stable support layout to solve reactions...'}
        </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .equations-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .panel-title {
    font-size: 1.1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .pivot-info {
    font-size: 0.8rem;
    color: var(--text-secondary);
    background-color: var(--bg-primary);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
  }

  .equations-box {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .equation-item {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .eq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.25rem;
  }

  .eq-symbol {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--color-primary);
  }

  .eq-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .eq-string {
    font-size: 0.85rem;
    padding: 0.4rem;
    background-color: var(--bg-primary);
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    color: var(--text-primary);
  }

  .monospace {
    font-family: 'Courier New', Courier, monospace;
  }

  .moment-explanation {
    margin-top: 0.4rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.3;
  }

  .reactions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  .reaction-item-box {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .reaction-symbol {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .reaction-value {
    font-size: 1rem;
    font-weight: 800;
    margin: 0.15rem 0;
  }

  .reaction-value.positive {
    color: var(--color-reaction);
  }

  .reaction-value.negative {
    color: var(--color-error);
  }

  .reaction-direction {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .unsolved-box {
    padding: 1rem;
    background-color: var(--bg-primary);
    border-radius: 6px;
    border: 1px dashed var(--border-color);
    text-align: center;
  }
  
  .text-warning {
    color: var(--color-warning);
  }

  .text-danger {
    color: var(--color-error);
  }

  .text-sm {
    font-size: 0.8rem;
  }

  .font-semibold {
    font-weight: 600;
  }

  .text-secondary {
    color: var(--text-secondary);
  }
</style>
