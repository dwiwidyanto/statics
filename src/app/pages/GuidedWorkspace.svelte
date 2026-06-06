<!-- src/app/pages/GuidedWorkspace.svelte -->
<script lang="ts">
  import { beamProblems } from '../../content/problems/beam-problems';
  import { solveEquilibrium } from '../../lib/domain/solvers/equilibrium';
  import { checkFbdModel } from '../../lib/domain/validation/checker';
  import FbdCanvas from '../../lib/ui/FbdCanvas.svelte';
  import SfdBmdCanvas from '../../lib/ui/SfdBmdCanvas.svelte';
  import { locale, translations } from '../../lib/utils/i18n';
  import type { Reaction, Support } from '../../lib/domain/models/types';
  import { getReactionsForSupport } from '../../lib/domain/supports/support';
  import StepperBar from '../components/StepperBar.svelte';
  import ReactionInputPanel from '../components/ReactionInputPanel.svelte';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import { scoreReactionAnswers } from '../../lib/domain/progress/scoring';
  import type { Attempt } from '../../lib/domain/progress/types';

  const repo = getProgressRepository();
  let showToast = false;

  export let problemId: string;
  export let onNavigate: (page: string, params?: any) => void;

  // 1. Load active problem
  $: problem = beamProblems.find(p => p.id === problemId);

  // 2. Solve problem reactions
  $: solverResult = problem ? solveEquilibrium(problem.body, problem.supports, problem.loads) : null;
  $: validationResult = problem ? checkFbdModel(problem.body, problem.supports, problem.loads, $locale) : null;

  // 3. Stepper State
  let activeStep = 1;
  const totalSteps = 6;

  // Student reaction solving states (interactive check)
  let userReactionsInput: Record<string, string> = {};
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
      if (!userReactionsInput[key] || userReactionsInput[key].trim() === '') {
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

    // Convert inputs to numbers
    const answers: Record<string, number> = {};
    for (const key of reactionKeys) {
      answers[key] = parseFloat(userReactionsInput[key]);
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
      <!-- Left Column: Visual Diagram / Canvas -->
      <div class="diagram-section">
        {#if activeStep <= 3 || activeStep === 6}
          <div class="panel-header">
            <h3>{$locale === 'id' ? 'Diagram Benda Bebas (FBD)' : 'Free-Body Diagram (FBD)'}</h3>
          </div>
          <FbdCanvas 
            body={problem.body}
            supports={activeStep === 1 ? problem.supports : []} // In FBD steps, supports are removed/replaced by reaction arrows
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

      <!-- Right Column: Step Instructions & Solver Panel -->
      <div class="solver-section">
        <!-- STEP 1: PROBLEM STATEMENT -->
        {#if activeStep === 1}
          <div class="step-card animate-fade-in">
            <span class="step-badge">{$locale === 'id' ? 'Langkah 1' : 'Step 1'}: {$locale === 'id' ? 'Pahami Soal' : 'Understand Problem'}</span>
            <h2>{$locale === 'id' ? problem.titleId || problem.title : problem.title}</h2>
            <p class="description">{$locale === 'id' ? problem.descriptionId || problem.description : problem.description}</p>
            
            <div class="specs-table">
              <h4>{$locale === 'id' ? 'Parameter Struktur' : 'Structural Parameters'}</h4>
              <div class="spec-row">
                <span>{$locale === 'id' ? 'Panjang balok (L)' : 'Beam length (L)'}</span>
                <strong>{problem.body.width} m</strong>
              </div>
              <div class="spec-row">
                <span>{$locale === 'id' ? 'Jumlah tumpuan' : 'Number of supports'}</span>
                <strong>{problem.supports.length} ({problem.supports.map(s => s.type === 'pin' ? ($locale === 'id' ? 'Sendi' : 'Pin') : (s.type === 'roller' ? ($locale === 'id' ? 'Rol' : 'Roller') : ($locale === 'id' ? 'Jepit' : 'Fixed'))).join(', ')})</strong>
              </div>
              <div class="spec-row">
                <span>{$locale === 'id' ? 'Beban luar yang bekerja' : 'Applied external loads'}</span>
                <strong>{problem.loads.length}</strong>
              </div>
            </div>

            <div class="instruction-box">
              <span class="icon">💡</span>
              <p>
                {$locale === 'id' 
                  ? 'Perhatikan bentuk balok dan beban yang bekerja. Di langkah berikutnya, kita akan membuat Diagram Benda Bebas (FBD) dengan melepaskan tumpuan dan menggantinya dengan gaya reaksi.' 
                  : 'Examine the beam shape and the loads acting on it. In the next step, we will draw the Free-Body Diagram (FBD) by removing the physical supports and replacing them with reaction forces.'}
              </p>
            </div>
          </div>

        <!-- STEP 2: FBD ANALYSIS -->
        {:else if activeStep === 2}
          <div class="step-card animate-fade-in">
            <span class="step-badge">{$locale === 'id' ? 'Langkah 2' : 'Step 2'}: {$locale === 'id' ? 'Diagram Benda Bebas' : 'Free-Body Diagram'}</span>
            <h2>{$locale === 'id' ? 'Ganti Tumpuan dengan Gaya Reaksi' : 'Replace Supports with Reactions'}</h2>
            
            <p class="explanation">
              {$locale === 'id'
                ? 'Untuk menganalisis benda tegar, kita harus melepaskannya dari lingkungan sekitarnya. Tumpuan dilepas dan digantikan dengan gaya reaksi yang menahan gerakan balok:'
                : 'To analyze a rigid body, we isolate it from its supports. The supports are removed and replaced by reaction forces that prevent motion:'}
            </p>

            <ul class="support-list">
              {#each problem.supports as s}
                <li>
                  <strong>{s.type.toUpperCase()} ({translations[$locale].support} {s.label})</strong> pada x={s.position.x}m:
                  {#if s.type === 'pin'}
                    {$locale === 'id' ? 'Menahan gerakan horizontal & vertikal (R_x, R_y).' : 'Restrains horizontal & vertical translation (R_x, R_y).'}
                  {:else if s.type === 'roller'}
                    {$locale === 'id' ? 'Menahan gerakan tegak lurus permukaan (R_y).' : 'Restrains translation normal to surface (R_y).'}
                  {:else}
                    {$locale === 'id' ? 'Menahan gerakan horizontal, vertikal, dan rotasi (R_x, R_y, M).' : 'Restrains horizontal, vertical, and rotational motion (R_x, R_y, M).'}
                  {/if}
                </li>
              {/each}
            </ul>

            {#if validationResult}
              <div class="validation-box {validationResult.determinacy}">
                <h4>{$locale === 'id' ? 'Analisis Struktur:' : 'Structural Analysis:'}</h4>
                <div class="spec-row">
                  <span>{$locale === 'id' ? 'Jumlah Reaksi Reaktif (r)' : 'Number of unknown reactions (r)'}</span>
                  <strong>{validationResult.reactionsCount}</strong>
                </div>
                <div class="spec-row">
                  <span>{$locale === 'id' ? 'Persamaan Kesetimbangan (n)' : 'Equilibrium equations (n)'}</span>
                  <strong>3</strong>
                </div>
                <p class="status-badge">
                  {#if validationResult.determinacy === 'statically_determinate'}
                    ✅ {$locale === 'id' ? 'Statis Tertentu & Stabil' : 'Statically Determinate & Stable'} (r = n = 3)
                  {:else if validationResult.determinacy === 'statically_indeterminate'}
                    ⚠️ {$locale === 'id' ? 'Statis Tak Tentu' : 'Statically Indeterminate'} (r > 3)
                  {:else}
                    ❌ {$locale === 'id' ? 'Struktur Labil (Unstable)' : 'Statically Unstable'} (r &lt; 3)
                  {/if}
                </p>
              </div>
            {/if}
          </div>

        <!-- STEP 3: REACTIONS SOLVER -->
        {:else if activeStep === 3}
          <ReactionInputPanel
            {reactionKeys}
            bind:userReactionsInput
            {showReactionsSolved}
            {reactionInputError}
            {reactionExplanation}
            onVerify={handleVerifyReactions}
          />

        <!-- STEP 4: SHEAR FORCE DIAGRAM -->
        {:else if activeStep === 4}
          <div class="step-card animate-fade-in">
            <span class="step-badge">{$locale === 'id' ? 'Langkah 4' : 'Step 4'}: {$locale === 'id' ? 'Gaya Lintang' : 'Shear Force'}</span>
            <h2>{$locale === 'id' ? 'Diagram Gaya Lintang (SFD)' : 'Shear Force Diagram (SFD)'}</h2>
            
            <p class="explanation">
              {$locale === 'id'
                ? 'Gaya lintang V(x) adalah jumlah semua gaya vertikal di sebelah kiri potongan x. Perhatikan bagaimana nilai gaya lintang melompat ke atas/bawah pada titik gaya terpusat:'
                : 'The shear force V(x) is the sum of all vertical external forces acting to the left of position x. Notice how the shear value jumps up or down at point load and support positions:'}
            </p>

            <div class="learning-tips">
              <h5>{$locale === 'id' ? 'Aturan Penting Gaya Lintang:' : 'Key Shear Force Rules:'}</h5>
              <ul>
                <li>{$locale === 'id' ? 'Reaksi tumpuan vertikal ke atas (↑) menaikkan diagram secara vertikal.' : 'An upward vertical support reaction (↑) causes an upward step in the diagram.'}</li>
                <li>{$locale === 'id' ? 'Beban terpusat ke bawah (↓) menurunkan diagram secara vertikal.' : 'A downward concentrated load (↓) causes a downward step in the diagram.'}</li>
                <li>{$locale === 'id' ? 'Beban merata (UDL) menyebabkan garis lintang miring ke bawah.' : 'A uniformly distributed load (UDL) causes a linearly sloping shear line.'}</li>
              </ul>
            </div>

            <div class="interaction-hint">
              <span class="icon">🖱️</span>
              <p>{translations[$locale].inspectionTool}</p>
            </div>
          </div>

        <!-- STEP 5: BENDING MOMENT DIAGRAM -->
        {:else if activeStep === 5}
          <div class="step-card animate-fade-in">
            <span class="step-badge">{$locale === 'id' ? 'Langkah 5' : 'Step 5'}: {$locale === 'id' ? 'Momen Lentur' : 'Bending Moment'}</span>
            <h2>{$locale === 'id' ? 'Diagram Momen Lentur (BMD)' : 'Bending Moment Diagram (BMD)'}</h2>
            
            <p class="explanation">
              {$locale === 'id'
                ? 'Momen lentur M(x) mengukur kecenderungan kelenturan balok. Hubungan kalkulusnya adalah dM/dx = V(x). Kemiringan diagram momen adalah nilai gaya lintang:'
                : 'The bending moment M(x) measures the internal bending resistance of the beam. The relationship is dM/dx = V(x), meaning the slope of the moment diagram equals the shear force value:'}
            </p>

            <div class="learning-tips">
              <h5>{$locale === 'id' ? 'Aturan Penting Momen Lentur:' : 'Key Bending Moment Rules:'}</h5>
              <ul>
                <li>{$locale === 'id' ? 'Di mana gaya lintang bernilai positif (V > 0), momen meningkat ke atas.' : 'Where the shear force is positive (V > 0), the moment diagram slopes upwards.'}</li>
                <li>{$locale === 'id' ? 'Di mana gaya lintang bernilai negatif (V < 0), momen menurun ke bawah.' : 'Where the shear force is negative (V < 0), the moment diagram slopes downwards.'}</li>
                <li>{$locale === 'id' ? 'Di mana gaya lintang memotong nol (V = 0), momen mencapai nilai puncak (ekstrim lokal).' : 'Where the shear force crosses zero (V = 0), the bending moment reaches a peak (local maximum or minimum).'}</li>
                <li>{$locale === 'id' ? 'Momen terpusat luar (kopel) menyebabkan lompatan vertikal mendadak pada diagram momen.' : 'An applied concentrated moment/couple causes a sudden vertical jump in the moment diagram.'}</li>
              </ul>
            </div>

            <div class="interaction-hint">
              <span class="icon">🖱️</span>
              <p>{translations[$locale].inspectionTool}</p>
            </div>
          </div>

        <!-- STEP 6: CHECK & REVIEW -->
        {:else if activeStep === 6}
          <div class="step-card animate-fade-in">
            <span class="step-badge success">{$locale === 'id' ? 'Langkah 6' : 'Step 6'}: {$locale === 'id' ? 'Selesai' : 'Completed'}</span>
            <h2>{$locale === 'id' ? 'Analisis Selesai!' : 'Analysis Complete!'}</h2>
            <p class="explanation">{translations[$locale].congratsSolved}</p>

            <div class="specs-table">
              <h4>{$locale === 'id' ? 'Ringkasan Reaksi' : 'Reactions Summary'}</h4>
              {#each reactionKeys as key}
                <div class="spec-row">
                  <span>{key}</span>
                  <strong>{(solverResult.reactions[key] ?? 0).toFixed(1)} {key.startsWith('M_') ? 'N·m' : 'N'}</strong>
                </div>
              {/each}
            </div>

            <div class="review-checklist">
              <h5>{$locale === 'id' ? 'Kriteria Kelulusan Struktur:' : 'Structural Checklist:'}</h5>
              <div class="checklist-item">
                <span>✅</span>
                <p><strong>ΣFx = 0:</strong> {$locale === 'id' ? 'Gaya horizontal seimbang.' : 'Horizontal forces are balanced.'}</p>
              </div>
              <div class="checklist-item">
                <span>✅</span>
                <p><strong>ΣFy = 0:</strong> {$locale === 'id' ? 'Gaya vertikal seimbang.' : 'Vertical forces are balanced.'}</p>
              </div>
              <div class="checklist-item">
                <span>✅</span>
                <p><strong>ΣM = 0:</strong> {$locale === 'id' ? 'Momen rotasi seimbang di semua titik.' : 'Rotational moments are balanced at all points.'}</p>
              </div>
            </div>

            <button class="btn btn-secondary w-full mt-3" on:click={() => onNavigate('dashboard')}>
              {$locale === 'id' ? 'Kembali ke Dasbor' : 'Return to Dashboard'}
            </button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Stepper Navigation footer -->
    <div class="stepper-footer">
      <button 
        class="btn btn-secondary" 
        on:click={prevStep} 
        disabled={activeStep === 1}
      >
        ← {$locale === 'id' ? 'Sebelumnya' : 'Previous'}
      </button>

      {#if activeStep === 3 && !showReactionsSolved}
        <button class="btn btn-primary" on:click={handleVerifyReactions}>
          {$locale === 'id' ? 'Periksa Jawaban' : 'Verify Reactions'}
        </button>
      {:else if activeStep < totalSteps}
        <button class="btn btn-primary" on:click={nextStep}>
          {$locale === 'id' ? 'Selanjutnya' : 'Next'} →
        </button>
      {:else}
        <button class="btn btn-primary" on:click={() => onNavigate('dashboard')}>
          {$locale === 'id' ? 'Selesai & Keluar' : 'Finish & Exit'}
        </button>
      {/if}
    </div>
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

  /* Solver section */
  .solver-section {
    display: flex;
    flex-direction: column;
  }

  .step-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 2rem;
    border-radius: 12px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .step-badge {
    background-color: rgba(37, 99, 235, 0.08);
    color: var(--color-primary);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    align-self: flex-start;
  }

  .step-badge.success {
    background-color: rgba(16, 185, 129, 0.08);
    color: var(--color-success);
  }

  .step-card h2 {
    font-size: 1.4rem;
    color: var(--text-primary);
  }

  .description {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .explanation {
    color: var(--text-primary);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .specs-table {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .specs-table h4 {
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .spec-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.25rem;
  }

  .spec-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .instruction-box {
    display: flex;
    gap: 0.75rem;
    background-color: rgba(16, 185, 129, 0.03);
    border-left: 3px solid var(--color-success);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--text-secondary);
  }

  .support-list {
    margin-left: 1.25rem;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .validation-box {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .status-badge {
    font-weight: 700;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }



  .learning-tips {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .learning-tips h5 {
    font-size: 0.85rem;
    color: var(--text-primary);
    font-weight: 700;
  }

  .learning-tips ul {
    margin-left: 1.25rem;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    color: var(--text-secondary);
  }

  .interaction-hint {
    display: flex;
    gap: 0.5rem;
    background-color: rgba(37, 99, 235, 0.03);
    border: 1px dashed rgba(37, 99, 235, 0.2);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    color: var(--color-primary);
    font-weight: 600;
    align-items: center;
  }

  .review-checklist {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: 8px;
  }

  .review-checklist h5 {
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }

  .checklist-item {
    display: flex;
    gap: 0.5rem;
    font-size: 0.85rem;
    align-items: center;
  }

  /* Stepper Navigation Footer */
  .stepper-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .w-full {
    width: 100%;
  }

  .mt-3 {
    margin-top: 0.75rem;
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
