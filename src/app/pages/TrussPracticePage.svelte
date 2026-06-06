<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import { trussProblems } from '../../content/problems/truss-problems';
  import { solveTruss } from '../../lib/domain/truss/solver';
  import TrussCanvas from '../../lib/ui/TrussCanvas.svelte';
  import TrussProblemSelector from '../components/TrussProblemSelector.svelte';
  import TrussResultsPanel from '../components/TrussResultsPanel.svelte';
  import TrussJointEquationsPanel from '../components/TrussJointEquationsPanel.svelte';
  import TrussAnswerInputPanel from '../components/TrussAnswerInputPanel.svelte';
  import TrussPedagogyPanel from '../components/TrussPedagogyPanel.svelte';
  import { scoreTrussAttempt } from '../../lib/domain/truss/scoring';
  import type { TrussScoreResult } from '../../lib/domain/truss/scoring';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import type { Attempt } from '../../lib/domain/progress/types';

  export let problemId: string | null = null;
  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();
  let showToast = false;

  // Selected problem state
  let selectedProblemId = trussProblems[0].id;

  // Sync route parameter changes reactively and validate
  $: {
    if (problemId) {
      const exists = trussProblems.some(p => p.id === problemId);
      selectedProblemId = exists ? problemId : trussProblems[0].id;
    } else {
      selectedProblemId = trussProblems[0].id;
    }
  }

  // React to selected id
  $: activeProblem = trussProblems.find(p => p.id === selectedProblemId) || trussProblems[0];

  // Solve problem
  $: solverResult = solveTruss(activeProblem);

  // Practice state
  let checkedResult: TrussScoreResult | null = null;
  let isSaved = false;
  let currentAnswers: {
    reactions: Record<string, number | null>;
    memberForces: Record<string, number | null>;
  } | null = null;

  // Reset input and check state when activeProblem changes
  $: if (activeProblem) {
    checkedResult = null;
    isSaved = false;
    currentAnswers = null;
  }

  function handleSelectProblem(id: string) {
    selectedProblemId = id;
    // Update hash route via navigation helper
    onNavigate('trusses', { problemId: id });
  }

  function handleCheckAnswers(answers: {
    reactions: Record<string, number | null>;
    memberForces: Record<string, number | null>;
  }) {
    if (!activeProblem || !solverResult.isSolved) return;

    currentAnswers = answers;

    const memberLabels: Record<string, string> = {};
    for (const m of activeProblem.members) {
      memberLabels[m.id] = m.label;
    }

    checkedResult = scoreTrussAttempt(
      answers,
      {
        reactions: solverResult.reactions,
        memberForces: solverResult.memberForces
      },
      {},
      memberLabels
    );
  }

  function handleSaveAttempt() {
    if (!activeProblem || !checkedResult || !currentAnswers) return;

    const attemptId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 9);

    const flatAnswers: Record<string, number> = {};
    for (const [k, v] of Object.entries(currentAnswers.reactions)) {
      if (v !== null && v !== undefined) {
        flatAnswers[k] = v;
      }
    }
    for (const [k, v] of Object.entries(currentAnswers.memberForces)) {
      if (v !== null && v !== undefined) {
        flatAnswers[k] = v;
      }
    }

    const attempt: Attempt = {
      id: attemptId,
      problemId: activeProblem.id,
      problemVersion: activeProblem.version,
      createdAt: new Date().toISOString(),
      answers: flatAnswers,
      score: checkedResult.score,
      feedback: checkedResult.summaryMessages.length > 0 
        ? checkedResult.summaryMessages 
        : [$locale === 'id' ? 'Semua jawaban benar!' : 'All answers correct!'],
      completed: checkedResult.completed
    };

    repo.saveAttempt(attempt);
    isSaved = true;
    showToast = true;
    setTimeout(() => { showToast = false; }, 3000);
  }
</script>

<div class="truss-page-container animate-fade-in">
  <!-- Toast Notification -->
  {#if showToast}
    <div class="toast-notification" role="alert">
      <span>✅ {$locale === 'id' ? 'Kemajuan disimpan ke profil Anda!' : 'Progress saved to your profile!'}</span>
    </div>
  {/if}

  <header class="page-header">
    <div class="header-btn-row">
      <button class="btn btn-secondary back-btn" on:click={() => onNavigate('dashboard')}>
        ◀ {$locale === 'id' ? 'Kembali ke Dasbor' : 'Back to Dashboard'}
      </button>
      <button class="btn btn-guided-mode" on:click={() => onNavigate('trusses/' + selectedProblemId + '/guided')}>
        🎓 {$locale === 'id' ? 'Mulai Mode Terpandu' : 'Start Guided Mode'}
      </button>
    </div>
    <div class="header-text-group">
      <span class="subheading">{$locale === 'id' ? 'Latihan Mandiri Rangka Batang' : 'Truss Self-Practice'}</span>
      <h1>{$locale === 'id' ? 'Analisis Rangka Batang Planar' : 'Planar Truss Analysis'}</h1>
      <p class="description">
        {$locale === 'id'
          ? 'Pelajari penyelesaian gaya batang pada rangka sendi dengan Metode Titik Hubung langkah demi langkah.'
          : 'Study member axial forces in pin-jointed structures step-by-step using the Method of Joints.'}
      </p>
    </div>
  </header>

  <div class="workspace-grid">
    <!-- Left column: Selector, Canvas, Equations -->
    <div class="main-column">
      <TrussProblemSelector 
        problems={trussProblems} 
        selectedId={selectedProblemId} 
        onSelect={handleSelectProblem} 
      />

      <div class="canvas-section">
        <div class="section-title-bar">
          <h2>{$locale === 'id' ? 'Diagram Rangka Batang' : 'Truss Diagram'}</h2>
          <span class="difficulty-badge difficulty-{activeProblem.difficulty}">
            {activeProblem.difficulty.toUpperCase()}
          </span>
        </div>
        
        <p class="problem-desc">
          {$locale === 'id' ? activeProblem.descriptionId || activeProblem.description : activeProblem.description}
        </p>

        <TrussCanvas 
          joints={activeProblem.joints} 
          members={activeProblem.members} 
          supports={activeProblem.supports} 
          loads={activeProblem.loads} 
          memberForces={solverResult.memberForces} 
          reactions={solverResult.reactions} 
          isSolved={solverResult.isSolved} 
        />
        
        <div class="canvas-legend">
          <div class="legend-item"><span class="legend-color tension"></span> {$locale === 'id' ? 'Tarik (Tension)' : 'Tension (T)'}</div>
          <div class="legend-item"><span class="legend-color compression"></span> {$locale === 'id' ? 'Tekan (Compression)' : 'Compression (C)'}</div>
          <div class="legend-item"><span class="legend-color zero"></span> {$locale === 'id' ? 'Gaya Nol (Zero-Force)' : 'Zero-Force Member'}</div>
        </div>
      </div>

      {#if checkedResult}
        <TrussJointEquationsPanel 
          jointEquations={solverResult.jointEquations} 
          messages={solverResult.messages} 
        />
      {/if}
    </div>

    <!-- Right column: Inputs, Pedagogy, Results -->
    <div class="sidebar-column">
      <TrussAnswerInputPanel
        reactionsReference={solverResult.reactions}
        members={activeProblem.members}
        onCheck={handleCheckAnswers}
        onSave={handleSaveAttempt}
        checkedResult={checkedResult}
        isSaved={isSaved}
      />

      <TrussPedagogyPanel />

      {#if checkedResult}
        <TrussResultsPanel 
          m={activeProblem.members.length} 
          r={solverResult.reactions ? Object.keys(solverResult.reactions).length : 0} 
          j={activeProblem.joints.length} 
          determinacy={solverResult.determinacy} 
          stability={solverResult.stability} 
          reactions={solverResult.reactions} 
          memberForces={solverResult.memberForces} 
          members={activeProblem.members} 
          zeroForceMembers={solverResult.zeroForceMembers} 
        />
      {/if}
    </div>
  </div>
</div>

<style>
  .truss-page-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Toast Notification */
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

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .back-btn {
    align-self: flex-start;
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
  }

  .header-btn-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .btn-guided-mode {
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: white;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
  }

  .btn-guided-mode:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .header-text-group h1 {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .subheading {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-primary, #2563eb);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .description {
    font-size: 0.95rem;
    color: var(--text-secondary);
    margin: 0;
    max-width: 700px;
    line-height: 1.5;
  }

  .workspace-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .main-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .sidebar-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: sticky;
    top: 20px;
  }

  .canvas-section {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .section-title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .section-title-bar h2 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }

  .difficulty-badge {
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .difficulty-easy { background-color: rgba(16, 185, 129, 0.1); color: #10b981; }
  .difficulty-medium { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  .difficulty-hard { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }

  .problem-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .canvas-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px dashed var(--border-color);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .legend-color {
    width: 24px;
    height: 6px;
    border-radius: 3px;
    display: inline-block;
  }

  .legend-color.tension { background-color: #0d9488; }
  .legend-color.compression { background-color: #ea580c; }
  .legend-color.zero { 
    background-color: transparent; 
    border-top: 2px dashed #9ca3af;
  }



  @media (max-width: 900px) {
    .workspace-grid {
      grid-template-columns: 1fr;
    }

    .sidebar-column {
      position: static;
    }
  }
</style>
