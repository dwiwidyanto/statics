<script lang="ts">
  import { locale, translations } from '../../../lib/utils/i18n';
  import type { CheckResult } from '../../../lib/domain/validation/checker';
  import type { ProblemModel, SolverResult } from '../../../lib/domain/models/types';
  import ReactionInputPanel from '../ReactionInputPanel.svelte';

  export let activeStep: number;
  export let problem: ProblemModel;
  export let solverResult: SolverResult;
  export let validationResult: CheckResult | null;
  export let reactionKeys: string[];
  export let userReactionsInput: Record<string, string | number>;
  export let showReactionsSolved: boolean;
  export let reactionInputError: string;
  export let reactionExplanation: string;
  export let onVerify: () => void;
  export let onNavigate: (page: string, params?: any) => void;
</script>

<div class="solver-section">
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
  {:else if activeStep === 3}
    <ReactionInputPanel
      {reactionKeys}
      bind:userReactionsInput
      {showReactionsSolved}
      {reactionInputError}
      {reactionExplanation}
      onVerify={onVerify}
    />
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
        <div class="checklist-item"><span>✅</span><p><strong>ΣFx = 0:</strong> {$locale === 'id' ? 'Gaya horizontal seimbang.' : 'Horizontal forces are balanced.'}</p></div>
        <div class="checklist-item"><span>✅</span><p><strong>ΣFy = 0:</strong> {$locale === 'id' ? 'Gaya vertikal seimbang.' : 'Vertical forces are balanced.'}</p></div>
        <div class="checklist-item"><span>✅</span><p><strong>ΣM = 0:</strong> {$locale === 'id' ? 'Momen rotasi seimbang di semua titik.' : 'Rotational moments are balanced at all points.'}</p></div>
      </div>
      <button class="btn btn-secondary w-full mt-3" on:click={() => onNavigate('dashboard')}>
        {$locale === 'id' ? 'Kembali ke Dasbor' : 'Return to Dashboard'}
      </button>
    </div>
  {/if}
</div>

<style>
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

  .specs-table,
  .validation-box,
  .learning-tips,
  .review-checklist {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .specs-table h4,
  .learning-tips h5,
  .review-checklist h5 {
    font-size: 0.85rem;
    color: var(--text-secondary);
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

  .instruction-box,
  .interaction-hint {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--text-secondary);
  }

  .instruction-box {
    background-color: rgba(16, 185, 129, 0.03);
    border-left: 3px solid var(--color-success);
  }

  .interaction-hint {
    background-color: rgba(37, 99, 235, 0.03);
    border: 1px dashed rgba(37, 99, 235, 0.2);
    color: var(--color-primary);
    font-weight: 600;
    align-items: center;
  }

  .support-list,
  .learning-tips ul {
    margin-left: 1.25rem;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .learning-tips ul {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .status-badge {
    font-weight: 700;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }

  .checklist-item {
    display: flex;
    gap: 0.5rem;
    font-size: 0.85rem;
    align-items: center;
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
</style>
