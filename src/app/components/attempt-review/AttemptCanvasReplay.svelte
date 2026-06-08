<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import TrussCanvas from '../../../lib/ui/TrussCanvas.svelte';
  import type { GuidedStepId } from '../../../lib/domain/progress/types';

  export let activeProblem: any;
  export let stepAttempt: any;
  export let reconstructedState: {
    solvedReactions: Record<string, number>;
    solvedMemberForces: Record<string, number>;
    solvedMemberIds: string[];
    currentSolvingJointId: string | null;
    zeroForceSelections: string[];
    hideMemberForces: boolean;
    isSolved: boolean;
  };

  const stepLabels: Record<GuidedStepId, { en: string; id: string }> = {
    overview: { en: 'Overview', id: 'Tinjauan' },
    determinacy: { en: 'Determinacy', id: 'Determinasi' },
    reactions: { en: 'Reactions', id: 'Reaksi Tumpuan' },
    zero_members: { en: 'Zero-Force Members', id: 'Batang Gaya Nol' },
    joint_sequence: { en: 'Joint Selection', id: 'Pemilihan Titik Hubung' },
    member_forces: { en: 'Member Forces', id: 'Gaya Batang' },
    summary: { en: 'Summary', id: 'Ringkasan' }
  };
</script>

<div class="canvas-card card">
  <div class="canvas-header">
    <h3>{$locale === 'id' ? 'Model Fisik pada Langkah Terpilih' : 'Physical Model at Selected Step'}</h3>
    <span class="selected-step-name">
      {$locale === 'id' ? stepLabels[stepAttempt.stepId as GuidedStepId].id : stepLabels[stepAttempt.stepId as GuidedStepId].en}
      (Attempt #{stepAttempt.attemptNumber})
    </span>
  </div>

  <TrussCanvas
    joints={activeProblem.joints}
    members={activeProblem.members}
    supports={activeProblem.supports}
    loads={activeProblem.loads}
    memberForces={reconstructedState.solvedMemberForces}
    reactions={reconstructedState.solvedReactions}
    isSolved={reconstructedState.isSolved}
    selectedJointId={reconstructedState.currentSolvingJointId}
    solvedMemberIds={reconstructedState.solvedMemberIds}
    highlightZeroForceIds={reconstructedState.zeroForceSelections}
    hideMemberForces={reconstructedState.hideMemberForces}
  />
</div>

<style>
  .card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .canvas-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .canvas-header h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .selected-step-name {
    font-size: 0.8rem;
    font-weight: bold;
    background-color: rgba(37, 99, 235, 0.08);
    color: var(--color-primary);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
  }
</style>
