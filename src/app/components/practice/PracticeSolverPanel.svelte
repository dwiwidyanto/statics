<script lang="ts">
  import type { Support, SolverResult, DeterminacyClassification, StabilityClassification } from '../../../lib/domain/models/types';
  import type { ValidationFeedback } from '../../../lib/domain/validation/checker';
  import FeedbackPanel from '../../../lib/ui/FeedbackPanel.svelte';
  import EquationsView from '../../../lib/ui/EquationsView.svelte';

  export let feedbacks: ValidationFeedback[];
  export let determinacy: DeterminacyClassification;
  export let stability: StabilityClassification;
  export let solverResult: SolverResult;
  export let supports: Support[];
  export let showReactions: boolean;
</script>

<div class="calculations-panel">
  <div class="card panel-card">
    <FeedbackPanel
      {feedbacks}
      {determinacy}
      {stability}
    />
  </div>

  <div class="card panel-card">
    <EquationsView
      {solverResult}
      {supports}
      {showReactions}
    />
  </div>
</div>

<style>
  .calculations-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .panel-card {
    padding: 1.25rem;
    margin-bottom: 0;
  }
</style>
