<!-- src/app/pages/GuidedWorkspace.svelte -->
<script lang="ts">
  import { beamProblems } from '../../content/problems/beam-problems';
  import { solveEquilibrium } from '../../lib/domain/solvers/equilibrium';
  import { checkFbdModel } from '../../lib/domain/validation/checker';
  import { locale } from '../../lib/utils/i18n';
  import type { Reaction, Support } from '../../lib/domain/models/types';
  import { getReactionsForSupport } from '../../lib/domain/supports/support';
  import StepperBar from '../components/StepperBar.svelte';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import { scoreReactionAnswers, isBlankReactionInput } from '../../lib/domain/progress/scoring';
  import type { Attempt } from '../../lib/domain/progress/types';
  import { selectGuidedBeamProblemFromRoute } from '../routing/problemSelection';
  import GuidedBeamDiagramSection from '../components/guided-beam/GuidedBeamDiagramSection.svelte';
  import GuidedBeamStepPanel from '../components/guided-beam/GuidedBeamStepPanel.svelte';
  import GuidedBeamAttemptActions from '../components/guided-beam/GuidedBeamAttemptActions.svelte';

  const repo = getProgressRepository();
  let showToast = false;

  export let problemId: string;
  export let onNavigate: (page: string, params?: any) => void;

  // 1. Load active problem
  $: problemSelection = selectGuidedBeamProblemFromRoute(problemId, beamProblems);
  $: problem = problemSelection.kind === 'route'
    ? beamProblems.find(p => p.id === problemSelection.problemId)
    : undefined;

  // 2. Solve problem reactions
  $: solverResult = problem ? solveEquilibrium(problem.body, problem.supports, problem.loads) : null;
  $: validationResult = problem ? checkFbdModel(problem.body, problem.supports, problem.loads, $locale) : null;

  // 3. Stepper State
  let activeStep = 1;
  const totalSteps = 6;

  // Student reaction solving states (interactive check)
  let userReactionsInput: Record<string, string | number> = {};
  let showReactionsSolved = false;
  let reactionInputError = '';

  // Reset user inputs when problem changes
  $: if (problem) {
    userReactionsInput = {};
    showReactionsSolved = false;
    reactionInputError = '';
    activeStep = 1;
  }

  // Support reactions keys helper
  $: reactionKeys = (() => {
    if (!problem) return [];
    const keys: string[] = [];
    for (const s of problem.supports) {
      const rxList = getReactionsForSupport(s);
      rxList.forEach(rx => keys.push(rx.symbol));
    }
    return keys;
  })();

  function handleVerifyReactions() {
    if (!solverResult || !problem) return;
    
    // Check if user has entered all reactions
    let allFilled = true;
    for (const key of reactionKeys) {
      if (isBlankReactionInput(userReactionsInput[key])) {
        allFilled = false;
        break;
      }
    }

    if (!allFilled) {
      reactionInputError = $locale === 'id' 
        ? 'Harap isi semua nilai reaksi tumpuan sebelum memeriksa!' 
        : 'Please fill in all support reaction values before verifying!';
      return;
    }

    // Convert inputs to numbers robustly
    const answers: Record<string, number> = {};
    for (const key of reactionKeys) {
      const raw = userReactionsInput[key];
      answers[key] = typeof raw === 'number' ? raw : parseFloat(String(raw));
    }

    // Score reactions
    const scoring = scoreReactionAnswers(answers, solverResult.reactions);
    
    // Save attempt
    const attempt: Attempt = {
      id: Math.random().toString(36).substring(2, 9),
      problemId: problem.id,
      problemVersion: problem.version,
      createdAt: new Date().toISOString(),
      answers,
      score: scoring.score,
      feedback: scoring.feedback,
      completed: scoring.score >= 0.999
    };
    repo.saveAttempt(attempt);

    if (attempt.completed) {
      showReactionsSolved = true;
      reactionInputError = '';
      showToast = true;
      setTimeout(() => { showToast = false; }, 3000);
      activeStep = 4; // Auto advance to SFD once solved
    } else {
      reactionInputError = scoring.feedback
        .filter(f => !f.includes('is correct'))
        .join('\n') || 
        ($locale === 'id'
          ? 'Beberapa nilai reaksi salah. Periksa kembali persamaan kesetimbangan Anda.'
          : 'Some reaction values are incorrect. Double-check your equilibrium equations.');
    }
  }

  // Get mapped reactions array for canvas
  $: canvasReactions = (() => {
    if (!problem || !solverResult) return [];
    const reactions: Reaction[] = [];
    for (const s of problem.supports) {
      const rxList = getReactionsForSupport(s);
      rxList.forEach(rx => {
        // If student verified reactions, show solved values. Otherwise show 0.
        rx.magnitude = showReactionsSolved ? (solverResult.reactions[rx.symbol] ?? 0) : 0;
        reactions.push(rx);
      });
    }
    return reactions;
  })();

  function nextStep() {
    if (activeStep === 3 && !showReactionsSolved) {
      // Must solve reactions first
      handleVerifyReactions();
      return;
    }
    if (activeStep < totalSteps) activeStep++;
  }

  function prevStep() {
    if (activeStep > 1) activeStep--;
  }

  // Generate dynamic text explanation of reactions solving
  $: reactionExplanation = (() => {
    if (!problem || !solverResult) return '';
    const isFixed = problem.supports.some(s => s.type === 'fixed');
    
    if (isFixed) {
      const fixedSupp = problem.supports.find(s => s.type === 'fixed') as Support;
      const label = fixedSupp.label;
      const rx = solverResult.reactions[`R_${label}x`] ?? 0;
      const ry = solverResult.reactions[`R_${label}y`] ?? 0;
      const m = solverResult.reactions[`M_${label}`] ?? 0;

      if ($locale === 'id') {
        return `
          Tumpuan jepit di ${label} menahan translasi X, Y, dan rotasi. Kita selesaikan reaksinya secara langsung:
          1. **Gaya Horizontal (ΣFx = 0):** R_${label}x = ${rx.toFixed(0)} N.
          2. **Gaya Vertikal (ΣFy = 0):** R_${label}y = ${ry.toFixed(0)} N.
          3. **Momen Tumpuan (ΣM_${label} = 0):** M_${label} = ${m.toFixed(0)} N·m (bernilai positif jika berlawanan arah jarum jam).
        `;
      } else {
        return `
          The fixed support at ${label} restrains X, Y, and rotation. We solve reactions directly:
          1. **Horizontal Force (ΣFx = 0):** R_${label}x = ${rx.toFixed(0)} N.
          2. **Vertical Force (ΣFy = 0):** R_${label}y = ${ry.toFixed(0)} N.
          3. **Reaction Moment (ΣM_${label} = 0):** M_${label} = ${m.toFixed(0)} N·m (positive is counter-clockwise).
        `;
      }
    } else {
      // Pin + Roller
      const pinSupp = problem.supports.find(s => s.type === 'pin');
      const rollerSupp = problem.supports.find(s => s.type === 'roller');
      if (!pinSupp || !rollerSupp) return '';

      const pLabel = pinSupp.label;
      const rLabel = rollerSupp.label;
      
      const rx = solverResult.reactions[`R_${pLabel}x`] ?? 0;
      const ry = solverResult.reactions[`R_${pLabel}y`] ?? 0;
      const r_roller = solverResult.reactions[`R_${rLabel}y`] ?? solverResult.reactions[`R_${rLabel}`] ?? 0;

      if ($locale === 'id') {
        return `
          Gunakan 3 persamaan kesetimbangan untuk menghitung reaksi di tumpuan sendi ${pLabel} dan rol ${rLabel}:
          1. **Jumlah Momen di sekitar ${pLabel} (ΣM_${pLabel} = 0):** Mengeliminasi reaksi R_${pLabel}y dan R_${pLabel}x, menyisakan R_${rLabel}y untuk dihitung langsung:
             $$${solverResult.equations.moment.split('=>')[0].trim()}$$
             Menghasilkan reaksi vertikal rol: **R_${rLabel}y = ${r_roller.toFixed(0)} N**.
          2. **Jumlah Gaya Vertikal (ΣFy = 0):** Gunakan nilai R_${rLabel}y untuk menghitung R_${pLabel}y:
             $$${solverResult.equations.fy.split('=>')[0].trim()}$$
             Menghasilkan reaksi vertikal sendi: **R_${pLabel}y = ${ry.toFixed(0)} N**.
          3. **Jumlah Gaya Horizontal (ΣFx = 0):**
             $$R_{${pLabel}x} = ${rx.toFixed(0)} N$$.
        `;
      } else {
        return `
          Use the 3 equilibrium equations to solve reactions at Pin ${pLabel} and Roller ${rLabel}:
          1. **Sum of Moments about ${pLabel} (ΣM_${pLabel} = 0):** Eliminates R_${pLabel}y and R_${pLabel}x, leaving R_${rLabel}y to be solved directly:
             $$${solverResult.equations.moment.split('=>')[0].trim()}$$
             Yields the vertical roller reaction: **R_${rLabel}y = ${r_roller.toFixed(0)} N**.
          2. **Sum of Vertical Forces (ΣFy = 0):** Use R_${rLabel}y to solve for R_${pLabel}y:
             $$${solverResult.equations.fy.split('=>')[0].trim()}$$
             Yields the vertical pin reaction: **R_${pLabel}y = ${ry.toFixed(0)} N**.
          3. **Sum of Horizontal Forces (ΣFx = 0):**
             $$R_{${pLabel}x} = ${rx.toFixed(0)} N$$.
        `;
      }
    }
  })();
</script>

<div class="guided-container">
  {#if showToast}
    <div class="toast animate-fade-in" role="status" aria-live="polite">
      {$locale === 'id' ? '✅ Progres berhasil disimpan!' : '✅ Saved to progress!'}
    </div>
  {/if}

  <!-- Stepper Indicator -->
  <StepperBar
    {activeStep}
    {totalSteps}
    {showReactionsSolved}
    onStepClick={(step) => activeStep = step}
  />

  {#if problem && solverResult}
    <!-- Main Workspace Split Grid -->
    <div class="workspace-grid">
      <GuidedBeamDiagramSection
        {activeStep}
        {problem}
        {solverResult}
        {canvasReactions}
      />

      <GuidedBeamStepPanel
        {activeStep}
        {problem}
        {solverResult}
        {validationResult}
        {reactionKeys}
        bind:userReactionsInput
        {showReactionsSolved}
        {reactionInputError}
        {reactionExplanation}
        onVerify={handleVerifyReactions}
        {onNavigate}
      />
    </div>

    <!-- Stepper Navigation footer -->
    <GuidedBeamAttemptActions
      {activeStep}
      {totalSteps}
      {showReactionsSolved}
      onPrevious={prevStep}
      onNext={nextStep}
      onVerify={handleVerifyReactions}
      onFinish={() => onNavigate('dashboard')}
    />
  {:else}
    <div class="card error-card">
      <h2>{$locale === 'id' ? 'Soal Tidak Ditemukan' : 'Problem Not Found'}</h2>
      <p>{$locale === 'id' ? 'Maaf, soal terpandu yang Anda minta tidak terdaftar.' : 'Sorry, the requested guided problem could not be found.'}</p>
      <button class="btn btn-primary" on:click={() => onNavigate('dashboard')}>
        {$locale === 'id' ? 'Kembali ke Dasbor' : 'Return to Dashboard'}
      </button>
    </div>
  {/if}
</div>

<style>
  .guided-container {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  /* Workspace Grid */
  .workspace-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 1.5rem;
    min-height: 480px;
  }

  @media (max-width: 900px) {
    .workspace-grid {
      grid-template-columns: 1fr;
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #10b981;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    z-index: 100;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .error-card {
    text-align: center;
    padding: 3rem;
  }
</style>
