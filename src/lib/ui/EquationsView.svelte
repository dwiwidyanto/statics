<script lang="ts">
  import type { SolverResult, Support } from '../models/types';

  export let solverResult: SolverResult;
  export let supports: Support[];
  export let showReactions: boolean;

  $: hasUnknowns = Object.keys(solverResult.reactions).length > 0;
</script>

<div class="equations-view">
  <h3 class="panel-title">Equilibrium Helper</h3>
  
  <div class="pivot-info">
    Moment pivot point is chosen at <strong>({solverResult.momentPivot.x.toFixed(1)}m, {solverResult.momentPivot.y.toFixed(1)}m)</strong> 
    {#if supports.length > 0}
      (Support {supports[0].label}).
    {:else}
      (Body center).
    {/if}
  </div>

  <div class="equations-box">
    <div class="equation-item">
      <div class="eq-header">
        <span class="eq-symbol">ΣFx = 0</span>
        <span class="eq-desc">Sum of horizontal forces must be zero</span>
      </div>
      <div class="eq-string monospace">
        {solverResult.equations.fx}
      </div>
    </div>

    <div class="equation-item">
      <div class="eq-header">
        <span class="eq-symbol">ΣFy = 0</span>
        <span class="eq-desc">Sum of vertical forces must be zero</span>
      </div>
      <div class="eq-string monospace">
        {solverResult.equations.fy}
      </div>
    </div>

    <div class="equation-item">
      <div class="eq-header">
        <span class="eq-symbol">ΣM_pivot = 0</span>
        <span class="eq-desc">Sum of moments about pivot point must be zero</span>
      </div>
      <div class="eq-string monospace">
        {solverResult.equations.moment}
      </div>
      <div class="moment-explanation">
        Moment is calculated as: <code>M = F_y * Δx - F_x * Δy</code>, where <code>Δx = x_force - x_pivot</code> and <code>Δy = y_force - y_pivot</code>. Counter-clockwise is positive (↺).
      </div>
    </div>
  </div>

  <h3 class="panel-title" style="margin-top: 1rem;">Calculated Reactions</h3>
  
  {#if solverResult.isSolved && showReactions}
    <div class="reactions-grid">
      {#each Object.entries(solverResult.reactions) as [symbol, value]}
        <div class="reaction-item-box">
          <span class="reaction-symbol">{symbol}</span>
          <span class="reaction-value {value < -0.01 ? 'negative' : 'positive'}">
            {value.toFixed(2)} {symbol.startsWith('M') ? 'N·m' : 'N'}
          </span>
          <span class="reaction-direction">
            {#if symbol.startsWith('M')}
              {value >= 0 ? 'Counter-clockwise (↺)' : 'Clockwise (↻)'}
            {:else if symbol.endsWith('x')}
              {value >= 0 ? 'Right (→)' : 'Left (←)'}
            {:else}
              {value >= 0 ? 'Up (↑)' : 'Down (↓)'}
            {/if}
          </span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="unsolved-box">
      {#if solverResult.determinacy === 'statically_indeterminate'}
        <p class="text-warning font-semibold">Statically Indeterminate System</p>
        <p class="text-sm text-secondary">
          There are {Object.keys(solverResult.reactions).length || 4} unknown reactions, but only 3 equilibrium equations in 2D. 
          To solve this, you must apply deformation conditions and material properties (Mechanics of Materials).
        </p>
      {:else if solverResult.determinacy === 'unstable'}
        <p class="text-danger font-semibold">Unstable System</p>
        <p class="text-sm text-secondary">
          The system cannot be solved because it is structurally unstable (either too few supports, or supports are arranged in a way that allows motion). 
          Review the diagnostics warnings in the Feedback Panel to stabilize the system.
        </p>
      {:else}
        <p class="text-secondary">Waiting for a stable support layout to solve reactions...</p>
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
    white-space: pre;
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
