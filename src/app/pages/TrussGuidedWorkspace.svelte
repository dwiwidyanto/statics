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
  import type { GuidedTrussStep, GuidedTrussState, DeterminacyAnswers } from '../../lib/domain/truss/guidedTypes';
  import { selectGuidedTrussProblemFromRoute } from '../routing/problemSelection';

  // Import sub-step components
  import GuidedTrussStepper from '../components/truss-guided/GuidedTrussStepper.svelte';
  import DeterminacyStep from '../components/truss-guided/DeterminacyStep.svelte';
  import ReactionStep from '../components/truss-guided/ReactionStep.svelte';
  import ZeroForceStep from '../components/truss-guided/ZeroForceStep.svelte';
  import JointSelectionStep from '../components/truss-guided/JointSelectionStep.svelte';
  import MemberForceStep from '../components/truss-guided/MemberForceStep.svelte';
  import GuidedTrussSummary from '../components/truss-guided/GuidedTrussSummary.svelte';
  import TrussRouteNotFound from '../components/truss/TrussRouteNotFound.svelte';
  import SolverMethodPanel from '../components/truss/SolverMethodPanel.svelte';

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
  let currentStep: GuidedTrussStep = 'overview';
  
  let determinacyAnswers: DeterminacyAnswers = {
    m: null,
    r: null,
    j: null,
    classification: null
  };

  let reactionAnswers: Record<string, number | null> = {};
  let zeroForceSelections: string[] = [];

  let solvedMemberForces: Record<string, number> = {};
  let solvedReactions: Record<string, number> = {};
  let solvedMemberIds: string[] = [];
  let solvedJointIds: string[] = [];
  let jointSequence: string[] = [];

  let currentSolvingJointId: string | null = null;
  let currentJointAnswers: Record<string, number | null> = {};

  let scoreBreakdown = {
    determinacy: 0,
    reactions: 0,
    zeroForceMembers: 0,
    jointSelection: 0,
    memberForces: 0
  };

  let misconceptions: string[] = [];
  let isSaved = false;
  let completionWarning: string | null = null;
  let telemetrySession = createGuidedAttemptSession(trussProblems[0]);

  // Reset states when activeProblem changes
  $: if (activeProblem) {
    currentStep = 'overview';
    determinacyAnswers = { m: null, r: null, j: null, classification: null };
    reactionAnswers = {};
    zeroForceSelections = [];
    solvedMemberForces = {};
    solvedReactions = {};
    solvedMemberIds = [];
    solvedJointIds = [];
    jointSequence = [];
    currentSolvingJointId = null;
    currentJointAnswers = {};
    scoreBreakdown = { determinacy: 0, reactions: 0, zeroForceMembers: 0, jointSelection: 0, memberForces: 0 };
    misconceptions = [];
    isSaved = false;
    completionWarning = null;
    telemetrySession = createGuidedAttemptSession(activeProblem);
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
    scoreBreakdown = { ...scoredResult.skillBreakdown };
    misconceptions = Array.from(new Set(telemetrySession.stepAttempts.flatMap(a => a.misconceptions)));
  }

  // Handle step completion
  function handleCompleteOverview() {
    currentStep = 'determinacy';
  }

  function handleCompleteDeterminacy(stepScore: number, stepMisconceptions: string[]) {
    misconceptions = [...misconceptions, ...stepMisconceptions];
    currentStep = 'reactions';
  }

  function handleCompleteReactions(stepScore: number, stepMisconceptions: string[]) {
    if (!solverResult) return;
    misconceptions = [...misconceptions, ...stepMisconceptions];
    // Copy reference reactions to solved reactions to show them on canvas/next steps
    solvedReactions = { ...solverResult.reactions };
    currentStep = 'zero_members';
  }

  function handleCompleteZeroForce(stepScore: number, stepMisconceptions: string[]) {
    if (!solverResult) return;
    misconceptions = [...misconceptions, ...stepMisconceptions];
    
    // Add correct zero-force members immediately to solved list
    const correctZeros = zeroForceSelections.filter(id => solverResult.zeroForceMembers.includes(id));
    for (const zId of correctZeros) {
      solvedMemberForces[zId] = 0;
      solvedMemberIds.push(zId);
    }
    solvedMemberIds = [...new Set(solvedMemberIds)];

    currentStep = 'joint_sequence';
  }

  function handleSelectJoint(jointId: string, stepMisconceptions: string[]) {
    misconceptions = [...misconceptions, ...stepMisconceptions];
    currentSolvingJointId = jointId;
  }

  function handleSolveJointForces(solvedForces: Record<string, number>, stepScore: number, stepMisconceptions: string[]) {
    if (!activeProblem) return;
    misconceptions = [...misconceptions, ...stepMisconceptions];

    // Accumulate solved forces
    for (const [mId, force] of Object.entries(solvedForces)) {
      solvedMemberForces[mId] = force;
      solvedMemberIds.push(mId);
    }
    solvedMemberIds = [...new Set(solvedMemberIds)];

    if (currentSolvingJointId) {
      solvedJointIds = [...solvedJointIds, currentSolvingJointId];
      jointSequence = [...jointSequence, currentSolvingJointId];
    }

    currentSolvingJointId = null;

    // Check if all members are solved
    if (solvedMemberIds.length >= activeProblem.members.length) {
      if (saveAttempt()) {
        currentStep = 'summary';
      }
    }
  }

  $: scoredResult = calculateGuidedScore(telemetrySession.stepAttempts);
  $: overallScore = scoredResult.totalScore;
  $: scoreBreakdown = { ...scoredResult.skillBreakdown };

  function saveAttempt(): boolean {
    if (isSaved) return true;
    if (!activeProblem) return false;

    const flatAnswers: Record<string, number> = {};
    for (const [k, v] of Object.entries(reactionAnswers)) {
      if (v !== null) flatAnswers[k] = v;
    }
    for (const [k, v] of Object.entries(solvedMemberForces)) {
      flatAnswers[k] = v;
    }

    const finalized = finalizeGuidedTelemetrySession(telemetrySession, flatAnswers, {
      requiredMemberIds: activeProblem.members.map(member => member.id),
      solvedMemberIds
    });
    telemetrySession = finalized.session;

    if (finalized.warnings.some(warning => !warning.startsWith('Score '))) {
      completionWarning = finalized.warnings.join(' ');
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

  {#if completionWarning}
    <div class="completion-warning" role="alert">
      <strong>{$locale === 'id' ? 'Belum bisa menyimpan ringkasan.' : 'Summary is not ready to save.'}</strong>
      <span>{completionWarning}</span>
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
  <GuidedTrussStepper activeStep={currentStep} />

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
        memberForces={solvedMemberForces}
        reactions={solvedReactions}
        isSolved={solvedMemberIds.length === activeProblem.members.length}
        selectedJointId={currentSolvingJointId}
        solvedMemberIds={solvedMemberIds}
        highlightZeroForceIds={zeroForceSelections}
        hideMemberForces={currentStep === 'overview' || currentStep === 'determinacy' || currentStep === 'reactions'}
      />
    </div>

    <!-- Right Panel: Step Instructions / Forms -->
    <div class="instructions-panel">
      {#if currentStep === 'overview'}
        <div class="step-card">
          <h3>{$locale === 'id' ? 'Langkah 1: Tinjauan Soal' : 'Step 1: Problem Overview'}</h3>
          <p class="desc">
            {$locale === 'id' ? activeProblem.descriptionId || activeProblem.description : activeProblem.description}
          </p>

          <div class="objectives-box">
            <h4>{$locale === 'id' ? 'Tujuan Pembelajaran:' : 'Learning Objectives:'}</h4>
            <ul>
              {#each activeProblem.learningObjectives as obj}
                <li>{obj}</li>
              {/each}
            </ul>
          </div>

          <SolverMethodPanel solverMethod={solverResult.solverMethod} equationSystem={solverResult.equationSystem} />

          <div class="actions">
            <button class="btn btn-primary" on:click={handleCompleteOverview}>
              {$locale === 'id' ? 'Mulai Belajar Terpandu' : 'Start Guided Analysis'}
            </button>
          </div>
        </div>

      {:else}
        <!-- Conditional rendering based on active step -->
        {#if currentStep === 'determinacy'}
          <DeterminacyStep
            truss={activeProblem}
            answers={determinacyAnswers}
            onNext={handleCompleteDeterminacy}
            onStepAttempt={(data) => handleStepAttempt('determinacy', data)}
          />
        {:else if currentStep === 'reactions'}
          <ReactionStep
            reactionsReference={solverResult.reactions}
            answers={reactionAnswers}
            onNext={handleCompleteReactions}
            onStepAttempt={(data) => handleStepAttempt('reactions', data)}
          />
        {:else if currentStep === 'zero_members'}
          <ZeroForceStep
            truss={activeProblem}
            referenceZeroForceIds={solverResult.zeroForceMembers}
            bind:zeroForceSelections={zeroForceSelections}
            onNext={handleCompleteZeroForce}
            onStepAttempt={(data) => handleStepAttempt('zero_members', data)}
          />
        {:else if currentStep === 'joint_sequence'}
          {#if !currentSolvingJointId}
            <JointSelectionStep
              truss={activeProblem}
              solvedMemberIds={solvedMemberIds}
              onSelectJoint={handleSelectJoint}
              onStepAttempt={(data) => handleStepAttempt('joint_sequence', data)}
            />
          {:else}
            <MemberForceStep
              truss={activeProblem}
              jointId={currentSolvingJointId}
              solvedMemberIds={solvedMemberIds}
              referenceMemberForces={solverResult.memberForces}
              knownReactions={solvedReactions}
              knownMemberForces={solvedMemberForces}
              onSubmitAnswers={handleSolveJointForces}
              onStepAttempt={(data) => handleStepAttempt('member_forces', data)}
            />
          {/if}
        {:else if currentStep === 'summary'}
          <GuidedTrussSummary
            score={overallScore}
            scoreBreakdown={scoreBreakdown}
            misconceptions={misconceptions}
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

  .step-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .step-card h3 {
    font-size: 1.05rem;
    margin: 0;
  }

  .step-card .desc {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  .objectives-box {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .objectives-box h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.85rem;
    font-weight: bold;
    color: var(--text-primary);
  }

  .objectives-box ul {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
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

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
