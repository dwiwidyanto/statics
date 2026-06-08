<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
  import { guidedHints, getHintText } from '../../../lib/domain/truss/guidedHints';
  import type { GuidedStepAttempt } from '../../../lib/domain/progress/types';

  export let selectedAttempt: GuidedStepAttempt;

  $: stepHintKeys = ({
    overview: [],
    determinacy: ['reaction_count_error'],
    reactions: ['sign_reversed'],
    zero_members: ['zero_force_missed', 'zero_force_false_positive'],
    joint_sequence: ['wrong_joint_order'],
    member_forces: ['sign_reversed', 'tension_compression_confusion'],
    summary: []
  }[selectedAttempt.stepId] || []);

  $: primaryHintKey = stepHintKeys.find(key => selectedAttempt.misconceptions?.includes(key)) || stepHintKeys[0];
</script>

{#if selectedAttempt.hintLevelUsed > 0 && primaryHintKey && guidedHints[primaryHintKey]}
  <div class="hint-card">
    <span class="hint-badge">💡 {$locale === 'id' ? `Petunjuk Tingkat ${selectedAttempt.hintLevelUsed} Digunakan` : `Hint Level ${selectedAttempt.hintLevelUsed} Unlocked`}</span>
    <p class="hint-text">
      {getHintText(guidedHints[primaryHintKey], selectedAttempt.hintLevelUsed, $locale)}
    </p>
  </div>
{/if}

<style>
  .hint-card {
    background-color: var(--bg-primary);
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b;
    border-radius: 6px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  :global(html.dark) .hint-card {
    border-color: rgba(245, 158, 11, 0.2);
    background-color: rgba(245, 158, 11, 0.05);
  }

  .hint-badge {
    font-size: 0.78rem;
    font-weight: bold;
    color: #d97706;
  }

  .hint-text {
    font-size: 0.8rem;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.4;
  }
</style>
