<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import type { ProblemModel, Reaction, SolverResult } from '../../../lib/domain/models/types';
  import FbdCanvas from '../../../lib/ui/FbdCanvas.svelte';
  import SfdBmdCanvas from '../../../lib/ui/SfdBmdCanvas.svelte';

  export let activeStep: number;
  export let problem: ProblemModel;
  export let solverResult: SolverResult;
  export let canvasReactions: Reaction[];
</script>

<div class="diagram-section">
  {#if activeStep <= 3 || activeStep === 6}
    <div class="panel-header">
      <h3>{$locale === 'id' ? 'Diagram Benda Bebas (FBD)' : 'Free-Body Diagram (FBD)'}</h3>
    </div>
    <FbdCanvas
      body={problem.body}
      supports={activeStep === 1 ? problem.supports : []}
      loads={problem.loads}
      reactions={canvasReactions}
      showLabels={true}
      showReactions={activeStep >= 2}
      momentPivot={activeStep === 3 ? solverResult.momentPivot : null}
    />
    <div class="legend-box">
      <span class="legend-item"><span class="color-dot force"></span> {$locale === 'id' ? 'Beban Luar' : 'Applied Load'}</span>
      {#if activeStep >= 2}
        <span class="legend-item"><span class="color-dot reaction"></span> {$locale === 'id' ? 'Gaya Reaksi' : 'Reaction Force'}</span>
      {/if}
    </div>
  {:else if activeStep === 4}
    <SfdBmdCanvas
      body={problem.body}
      supports={problem.supports}
      loads={problem.loads}
      reactions={solverResult.reactions}
      type="SFD"
    />
  {:else if activeStep === 5}
    <SfdBmdCanvas
      body={problem.body}
      supports={problem.supports}
      loads={problem.loads}
      reactions={solverResult.reactions}
      type="BMD"
    />
  {/if}
</div>

<style>
  .diagram-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: center;
  }

  .panel-header h3 {
    font-size: 1.1rem;
    color: var(--text-primary);
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .legend-box {
    display: flex;
    gap: 1.5rem;
    font-size: 0.8rem;
    justify-content: center;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .color-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .color-dot.force {
    background-color: var(--color-force);
  }

  .color-dot.reaction {
    background-color: var(--color-reaction);
  }
</style>
