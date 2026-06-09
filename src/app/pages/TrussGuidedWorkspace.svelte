<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import { trussProblems } from '../../content/problems/truss-problems';
  import { solveTruss } from '../../lib/domain/truss/solver';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import type { GuidedAnswersSnapshot, GuidedStepId } from '../../lib/domain/progress/types';
  import {
    createGuidedAttemptSession,
    recordStepAttempt,
    calculateGuidedScore,
    finalizeGuidedTelemetrySession,
    buildFinalAttemptFromTelemetry
  } from '../../lib/domain/progress/guidedTelemetry';
  import { selectGuidedTrussProblemFromRoute } from '../routing/problemSelection';
  import {
    applyCompletionWarning,
    applyDeterminacyCompleted,
    applyJointSelected,
    applyMemberForcesSolved,
    applyOverviewCompleted,
    applyReactionsCompleted,
    applyScoreAndMisconceptions,
    applyZeroForceCompleted,
    buildGuidedTrussCompletionGuard,
    createInitialGuidedTrussState
  } from '../../lib/domain/truss/guidedStateMachine';

  // Import sub-step components
  import GuidedTrussStepper from '../components/truss-guided/GuidedTrussStepper.svelte';
  import DeterminacyStep from '../components/truss-guided/DeterminacyStep.svelte';
  import ReactionStep from '../components/truss-guided/ReactionStep.svelte';
  import ZeroForceStep from '../components/truss-guided/ZeroForceStep.svelte';
  import JointSelectionStep from '../components/truss-guided/JointSelectionStep.svelte';
  import MemberForceStep from '../components/truss-guided/MemberForceStep.svelte';
  import GuidedTrussSummary from '../components/truss-guided/GuidedTrussSummary.svelte';
  import GuidedTrussBlockedPathCard from '../components/truss-guided/GuidedTrussBlockedPathCard.svelte';
  import GuidedTrussOverviewStep from '../components/truss-guided/GuidedTrussOverviewStep.svelte';
  import TrussRouteNotFound from '../components/truss/TrussRouteNotFound.svelte';

  import TrussCanvas from '../../lib/ui/TrussCanvas.svelte';

  export let problemId: string;
  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();
  let showToast = false;

  // 1. Resolve active problem without falling back on invalid guided routes.
  $: problemSelection = selectGuidedTrussProblemFromRoute(problemId, trussProblems);
  $: activeProblem = problemSelection.kind === 'route'
    ? trussProblems.find(p => p.id === problemSelection.problemId) ?? null
    : null;
  $: solverResult = activeProblem ? solveTruss(activeProblem) : null;

  // 2. State management
  let guidedState = createInitialGuidedTrussState(trussProblems[0]);
  let isSaved = false;
  let telemetrySession = createGuidedAttemptSession(trussProblems[0]);
  let initializedProblemId: string | null = null;

  // Reset states when activeProblem changes
  $: if (activeProblem && activeProblem.id !== initializedProblemId) {
    guidedState = createInitialGuidedTrussState(activeProblem);
    isSaved = false;
    telemetrySession = createGuidedAttemptSession(activeProblem);
    initializedProblemId = activeProblem.id;
  }

  function handleStepAttempt(
    stepId: GuidedStepId,
    attemptData: {
      isCorrect: boolean;
      score: number;
      answersSnapshot: GuidedAnswersSnapshot;
      feedbackMessages: string[];
      misconceptions: string[];
      hintLevelUsed: number;
    }
  ) {
    telemetrySession = recordStepAttempt(telemetrySession, {
      stepId,
      isCorrect: attemptData.isCorrect,
      score: attemptData.score,
      answersSnapshot: attemptData.answersSnapshot,
      feedbackMessages: attemptData.feedbackMessages,
      misconceptions: attemptData.misconceptions,
      hintLevelUsed: attemptData.hintLevelUsed,
      createdAt: new Date().toISOString()
    });

    const scoredResult = calculateGuidedScore(telemetrySession.stepAttempts);
    if (activeProblem) {
      guidedState = applyScoreAndMisconceptions(
        activeProblem,
        guidedState,
        scoredResult.skillBreakdown,
        telemetrySession.stepAttempts.flatMap(a => a.misconceptions)
      );
    }
  }

  // Handle step completion
  function handleCompleteOverview() {
    if (!activeProblem) return;
    guidedState = applyOverviewCompleted(activeProblem, guidedState);
  }

  function handleCompleteDeterminacy(stepScore: number, stepMisconceptions: string[]) {
    if (!activeProblem) return;
    guidedState = applyDeterminacyCompleted(activeProblem, guidedState, stepMisconceptions);
  }

  function handleCompleteReactions(stepScore: number, stepMisconceptions: string[]) {
    if (!activeProblem || !solverResult) return;
    guidedState = applyReactionsCompleted(activeProblem, guidedState, solverResult.reactions, stepMisconceptions);
  }

  function handleCompleteZeroForce(stepScore: number, stepMisconceptions: string[]) {
    if (!activeProblem || !solverResult) return;
    guidedState = applyZeroForceCompleted(activeProblem, guidedState, solverResult.zeroForceMembers, stepMisconceptions);
  }

  function handleSelectJoint(jointId: string, stepMisconceptions: string[]) {
    if (!activeProblem) return;
    guidedState = applyJointSelected(activeProblem, guidedState, jointId, stepMisconceptions);
  }

  function handleSolveJointForces(solvedForces: Record<string, number>, stepScore: number, stepMisconceptions: string[]) {
    if (!activeProblem) return;
    guidedState = applyMemberForcesSolved(activeProblem, guidedState, solvedForces, stepMisconceptions);

    // Check if all members are solved
    if (guidedState.pathStatus === 'all_members_solved') {
      if (saveAttempt()) {
        guidedState = { ...guidedState, currentStep: 'summary' };
      }
    }
  }

  $: scoredResult = calculateGuidedScore(telemetrySession.stepAttempts);
  $: overallScore = scoredResult.totalScore;

  function saveAttempt(): boolean {
    if (isSaved) return true;
    if (!activeProblem) return false;

    const guard = buildGuidedTrussCompletionGuard({ problem: activeProblem, state: guidedState, telemetry: telemetrySession });
    if (!guard.canSave) {
      guidedState = applyCompletionWarning(activeProblem, guidedState, guard.warnings.join(' '));
      return false;
    }

    const flatAnswers: Record<string, number> = {};
    for (const [k, v] of Object.entries(guidedState.reactionAnswers)) {
      if (v !== null) flatAnswers[k] = v;
    }
    for (const [k, v] of Object.entries(guidedState.solvedMemberForces)) {
      flatAnswers[k] = v;
    }

    const finalized = finalizeGuidedTelemetrySession(telemetrySession, flatAnswers, {
      requiredMemberIds: activeProblem.members.map(member => member.id),
      solvedMemberIds: guidedState.solvedMemberIds
    });
    telemetrySession = finalized.session;

    if (finalized.warnings.some(warning => !warning.startsWith('Score '))) {
      guidedState = applyCompletionWarning(activeProblem, guidedState, finalized.warnings.join(' '));
      return false;
    }

    const attempt = buildFinalAttemptFromTelemetry(telemetrySession);

    repo.saveAttempt(attempt);
    isSaved = true;
    showToast = true;
    setTimeout(() => { showToast = false; }, 3000);
    return true;
  }

  function handleFinish() {
    onNavigate('progress');
  }
</script>

<div class="guided-workspace animate-fade-in">
  <!-- Toast Notification -->
  {#if showToast}
    <div class="toast-notification" role="alert">
      <span>✅ {$locale === 'id' ? 'Progres belajar disimpan!' : 'Learning progress saved!'}</span>
    </div>
  {/if}

  {#if guidedState.completionWarning}
    <div class="completion-warning" role="alert">
      <strong>{$locale === 'id' ? 'Belum bisa menyimpan ringkasan.' : 'Summary is not ready to save.'}</strong>
      <span>{guidedState.completionWarning}</span>
    </div>
  {/if}

  {#if !activeProblem || !solverResult}
    <TrussRouteNotFound problemId={problemId ?? ''} {onNavigate} />
  {:else}
  <header class="page-header">
    <button class="btn btn-secondary back-btn" on:click={() => onNavigate('trusses', { problemId })}>
      ◀ {$locale === 'id' ? 'Kembali ke Latihan Mandiri' : 'Back to Practice'}
    </button>
    <div class="header-text-group">
      <span class="subheading">{$locale === 'id' ? 'Belajar Terpandu Rangka Batang' : 'Guided Truss Workspace'}</span>
      <h1>{$locale === 'id' ? activeProblem.titleId || activeProblem.title : activeProblem.title}</h1>
    </div>
  </header>

  <!-- Stepper Indicators -->
  <GuidedTrussStepper activeStep={guidedState.currentStep} />

  <div class="workspace-layout">
    <!-- Left Panel: Canvas diagram -->
    <div class="canvas-panel">
      <div class="panel-header-bar">
        <h3>{$locale === 'id' ? 'Diagram & Model Fisik' : 'Physical Model Diagram'}</h3>
      </div>
      
      <TrussCanvas
        joints={activeProblem.joints}
        members={activeProblem.members}
        supports={activeProblem.supports}
        loads={activeProblem.loads}
        memberForces={guidedState.solvedMemberForces}
        reactions={guidedState.solvedReactions}
        isSolved={guidedState.solvedMemberIds.length === activeProblem.members.length}
        selectedJointId={guidedState.currentSolvingJointId}
        solvedMemberIds={guidedState.solvedMemberIds}
        highlightZeroForceIds={guidedState.zeroForceSelections}
        hideMemberForces={guidedState.currentStep === 'overview' || guidedState.currentStep === 'determinacy' || guidedState.currentStep === 'reactions'}
      />
    </div>

    <!-- Right Panel: Step Instructions / Forms -->
    <div class="instructions-panel">
      {#if guidedState.currentStep === 'overview'}
        <GuidedTrussOverviewStep
          problem={activeProblem}
          solverMethod={solverResult.solverMethod}
          equationSystem={solverResult.equationSystem}
          onStart={handleCompleteOverview}
        />
      {:else}
        <!-- Conditional rendering based on active step -->
        {#if guidedState.currentStep === 'determinacy'}
          <DeterminacyStep
            truss={activeProblem}
            answers={guidedState.determinacyAnswers}
            onNext={handleCompleteDeterminacy}
            onStepAttempt={(data) => handleStepAttempt('determinacy', data)}
          />
        {:else if guidedState.currentStep === 'reactions'}
          <ReactionStep
            reactionsReference={solverResult.reactions}
            answers={guidedState.reactionAnswers}
            onNext={handleCompleteReactions}
            onStepAttempt={(data) => handleStepAttempt('reactions', data)}
          />
        {:else if guidedState.currentStep === 'zero_members'}
          <ZeroForceStep
            truss={activeProblem}
            referenceZeroForceIds={solverResult.zeroForceMembers}
            bind:zeroForceSelections={guidedState.zeroForceSelections}
            onNext={handleCompleteZeroForce}
            onStepAttempt={(data) => handleStepAttempt('zero_members', data)}
          />
        {:else if guidedState.currentStep === 'joint_sequence'}
          {#if guidedState.pathStatus === 'blocked_requires_simultaneous_equilibrium'}
            <GuidedTrussBlockedPathCard problem={activeProblem} {onNavigate} />
          {:else if !guidedState.currentSolvingJointId}
            <JointSelectionStep
              truss={activeProblem}
              solvedMemberIds={guidedState.solvedMemberIds}
              onSelectJoint={handleSelectJoint}
              onStepAttempt={(data) => handleStepAttempt('joint_sequence', data)}
            />
          {:else}
            <MemberForceStep
              truss={activeProblem}
              jointId={guidedState.currentSolvingJointId}
              solvedMemberIds={guidedState.solvedMemberIds}
              referenceMemberForces={solverResult.memberForces}
              knownReactions={guidedState.solvedReactions}
              knownMemberForces={guidedState.solvedMemberForces}
              onSubmitAnswers={handleSolveJointForces}
              onStepAttempt={(data) => handleStepAttempt('member_forces', data)}
            />
          {/if}
        {:else if guidedState.currentStep === 'summary'}
          <GuidedTrussSummary
            score={overallScore}
            scoreBreakdown={guidedState.scoreBreakdown}
            misconceptions={guidedState.misconceptions}
            onFinish={handleFinish}
          />
        {/if}
      {/if}
    </div>
  </div>
  {/if}
</div>

<style>
  .guided-workspace {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .toast-notification {
    position: fixed;
    top: 24px;
    right: 24px;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-left: 4px solid #10b981;
    color: var(--text-primary);
    padding: 1rem 1.5rem;
    border-radius: 6px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    font-size: 0.9rem;
    font-weight: 700;
    animation: slideIn 0.3s ease-out;
  }

  .completion-warning {
    background-color: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: var(--text-primary);
    padding: 0.85rem 1rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.86rem;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .back-btn {
    align-self: flex-start;
    font-size: 0.82rem;
    padding: 0.45rem 0.75rem;
  }

  .header-text-group h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-primary);
  }

  .subheading {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-primary, #2563eb);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .workspace-layout {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .workspace-layout {
      grid-template-columns: 1fr;
    }
  }

  .canvas-panel {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
  }

  .panel-header-bar h3 {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    font-weight: bold;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.4rem;
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

  .btn-secondary { background-color: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); }
  .btn-secondary:hover { background-color: var(--border-color); }

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
