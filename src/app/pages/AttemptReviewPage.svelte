<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import { trussProblems } from '../../content/problems/truss-problems';
  import { solveTruss } from '../../lib/domain/truss/solver';
  import { getProgressRepository } from '../../lib/services/localProgressRepository';
  import TrussCanvas from '../../lib/ui/TrussCanvas.svelte';
  import { guidedHints, getHintText } from '../../lib/domain/truss/guidedHints';
  import { getFirstAttemptAccuracy, getHintUsageSummary } from '../../lib/domain/progress/guidedTelemetry';
  import type { GuidedStepAttempt, GuidedStepId, Attempt } from '../../lib/domain/progress/types';

  export let attemptId: string;
  export let onNavigate: (page: string, params?: any) => void;

  const repo = getProgressRepository();

  // Find the matching attempt
  $: attempt = repo.getAttempts().find(a => a.id === attemptId) as Attempt | undefined;
  $: telemetry = attempt?.guidedTelemetry;

  // Resolve the active problem and solver reference
  $: activeProblem = trussProblems.find(p => p.id === attempt?.problemId) || trussProblems[0];
  $: solverResult = solveTruss(activeProblem);
  $: referenceZeroForceIds = solverResult.zeroForceMembers;

  // State for interactive timeline scrubbing
  let selectedAttemptIdx = 0;

  // Reset selected attempt index if telemetry changes
  $: if (telemetry) {
    selectedAttemptIdx = telemetry.stepAttempts.length - 1;
  }

  // Reconstruct truss state for the selected step attempt
  $: reconstructedState = (() => {
    if (!telemetry || telemetry.stepAttempts.length === 0 || selectedAttemptIdx < 0) {
      return {
        solvedReactions: {},
        solvedMemberForces: {},
        solvedMemberIds: [],
        currentSolvingJointId: null,
        zeroForceSelections: [],
        hideMemberForces: true,
        isSolved: false
      };
    }

    const solvedReactions: Record<string, number> = {};
    const solvedMemberForces: Record<string, number> = {};
    let solvedMemberIds: string[] = [];
    let currentSolvingJointId: string | null = null;
    let zeroForceSelections: string[] = [];

    // Scan attempts from index 0 up to selectedAttemptIdx
    for (let idx = 0; idx <= selectedAttemptIdx; idx++) {
      const stepAttempt = telemetry.stepAttempts[idx];
      const stepId = stepAttempt.stepId;

      if (stepId === 'reactions') {
        if (stepAttempt.isCorrect) {
          Object.assign(solvedReactions, solverResult.reactions);
        }
      } else if (stepId === 'zero_members') {
        if (Array.isArray(stepAttempt.answersSnapshot)) {
          zeroForceSelections = stepAttempt.answersSnapshot;
        }
        // If it's correct or we are past this step, apply correct ZFM forces
        if (stepAttempt.isCorrect || idx < selectedAttemptIdx) {
          const correctZeros = referenceZeroForceIds.filter(id => zeroForceSelections.includes(id));
          for (const zId of correctZeros) {
            solvedMemberForces[zId] = 0;
            solvedMemberIds.push(zId);
          }
          solvedMemberIds = [...new Set(solvedMemberIds)];
        }
      } else if (stepId === 'joint_sequence') {
        currentSolvingJointId = stepAttempt.answersSnapshot?.jointId || null;
      } else if (stepId === 'member_forces') {
        const jointId = stepAttempt.answersSnapshot?.jointId;
        currentSolvingJointId = jointId;
        if (stepAttempt.isCorrect || idx < selectedAttemptIdx) {
          if (stepAttempt.answersSnapshot?.answers) {
            for (const mId of Object.keys(stepAttempt.answersSnapshot.answers)) {
              solvedMemberForces[mId] = solverResult.memberForces[mId] ?? 0;
              solvedMemberIds.push(mId);
            }
          }
          solvedMemberIds = [...new Set(solvedMemberIds)];
        }
      }
    }

    const currentSelectedStep = telemetry.stepAttempts[selectedAttemptIdx].stepId;
    const hideMemberForces = currentSelectedStep === 'overview' || currentSelectedStep === 'determinacy' || currentSelectedStep === 'reactions';
    const isSolved = solvedMemberIds.length === activeProblem.members.length;

    return {
      solvedReactions,
      solvedMemberForces,
      solvedMemberIds,
      currentSolvingJointId,
      zeroForceSelections,
      hideMemberForces,
      isSolved
    };
  })();

  // Derived aggregates
  $: firstAttemptAccuracy = telemetry ? getFirstAttemptAccuracy(telemetry.stepAttempts) : 0;
  $: hintSummary = telemetry ? getHintUsageSummary(telemetry.stepAttempts) : { totalHintsUsed: 0, maxHintLevel: 0, hintsByStep: {} };

  // Misconception explanations dictionary
  const misconceptionDetails: Record<string, { title: { id: string; en: string }; desc: { id: string; en: string } }> = {
    sign_reversed: {
      title: { id: 'Tanda Terbalik (+/-)', en: 'Sign Convention Reversal' },
      desc: { id: 'Mengalami kesalahan tanda aljabar pada gaya reaksi atau gaya batang. Ingat bahwa Tarik bernilai (+) dan Tekan bernilai (-).', en: 'Encountered algebraic sign errors on support reactions or member forces. Remember: Tension is (+), Compression is (-).' }
    },
    zero_force_missed: {
      title: { id: 'Batang Gaya Nol Terlewat', en: 'Missed Zero-Force Member' },
      desc: { id: 'Beberapa batang berdaya nol terlewatkan dalam peninjauan visual. Tinjau kembali Aturan 1 dan Aturan 2.', en: 'Zero-force members were missed. Review Rule 1 (unloaded 2-member joint) and Rule 2 (unloaded 3-member joint with 2 collinear).' }
    },
    zero_force_false_positive: {
      title: { id: 'Kesalahan Batang Nol (False Positive)', en: 'False Positive Zero-Force Member' },
      desc: { id: 'Batang yang aktif memikul gaya diidentifikasi keliru sebagai batang nol. Pastikan tidak ada tumpuan atau beban luar di titik tersebut.', en: 'Active force-bearing members were incorrectly marked as zero-force. Make sure the joint has no external supports or loads.' }
    },
    wrong_joint_order: {
      title: { id: 'Urutan Titik Hubung Salah', en: 'Incorrect Joint Sequence' },
      desc: { id: 'Memilih titik hubung yang memiliki lebih dari 2 gaya batang tidak diketahui. Gunakan titik hubung dengan maksimal 2 unknown.', en: 'Selected a joint with more than 2 unknowns. The Method of Joints requires solving joints with at most 2 unknown forces.' }
    },
    reaction_count_error: {
      title: { id: 'Kesalahan Jumlah Reaksi', en: 'Support Reaction Counting Error' },
      desc: { id: 'Mengidentifikasi jumlah reaksi tumpuan dengan keliru. Sendi membatasi 2 arah, rol membatasi 1 arah.', en: 'Miscounted reaction forces. A pin support restricts 2 directions, a roller support restricts 1 direction.' }
    },
    tension_compression_confusion: {
      title: { id: 'Kebingungan Tarik/Tekan', en: 'Tension/Compression Confusion' },
      desc: { id: 'Menentukan sifat batang (tarik vs tekan) secara terbalik. Tarik menarik titik hubung menjauh, Tekan mendorong titik hubung mendekat.', en: 'Incorrectly identified member nature (tension vs compression). Tension pulls away from joints; compression pushes into joints.' }
    }
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

  function formatTime(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString($locale === 'id' ? 'id-ID' : 'en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  function getDurationString(start: string, end?: string): string {
    if (!end) return '-';
    try {
      const diffMs = new Date(end).getTime() - new Date(start).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      if (mins > 0) {
        return $locale === 'id' ? `${mins} mnt ${secs} dtk` : `${mins}m ${secs}s`;
      }
      return $locale === 'id' ? `${secs} dtk` : `${secs}s`;
    } catch {
      return '-';
    }
  }

  function getJointLabel(jointId: string): string {
    const j = activeProblem.joints.find(jt => jt.id === jointId);
    return j ? j.label : jointId;
  }

  function getMemberLabel(memberId: string): string {
    const m = activeProblem.members.find(mem => mem.id === memberId);
    return m ? m.label : memberId;
  }
</script>

<div class="review-page-container animate-fade-in">
  <header class="review-header">
    <button class="btn btn-secondary back-btn" on:click={() => onNavigate('progress')}>
      ◀ {$locale === 'id' ? 'Kembali ke Progress' : 'Back to Progress'}
    </button>
    
    {#if attempt}
      <div class="header-main">
        <div class="header-title">
          <span class="guided-badge">🎓 {$locale === 'id' ? 'Tinjauan Percobaan Terpandu' : 'Guided Attempt Review'}</span>
          <h1>{$locale === 'id' ? activeProblem.titleId || activeProblem.title : activeProblem.title}</h1>
          <p class="timestamp">
            {$locale === 'id' ? 'Diselesaikan pada:' : 'Completed on:'} {formatTime(attempt.createdAt)}
            {#if telemetry}
              | {$locale === 'id' ? 'Durasi:' : 'Duration:'} {getDurationString(telemetry.startedAt, telemetry.completedAt)}
            {/if}
          </p>
        </div>
        
        <div class="score-card">
          <span class="score-label">{$locale === 'id' ? 'Skor Akhir' : 'Final Score'}</span>
          <span class="score-value">{Math.round(attempt.score * 100)}%</span>
        </div>
      </div>
    {/if}
  </header>

  {#if !attempt}
    <div class="empty-state">
      <p>{$locale === 'id' ? 'Percobaan tidak ditemukan.' : 'Attempt not found.'}</p>
    </div>
  {:else if !telemetry}
    <div class="empty-state">
      <p>{$locale === 'id' ? 'Data tinjauan langkah demi langkah tidak tersedia untuk percobaan ini.' : 'Step-by-step review telemetry is not available for this attempt.'}</p>
    </div>
  {:else}
    <div class="review-grid">
      <!-- Left Column: Metrics & Misconceptions Sidebar -->
      <aside class="sidebar-panel">
        <div class="card panel-card">
          <h3>{$locale === 'id' ? 'Metrik Pembelajaran' : 'Learning Telemetry'}</h3>
          <div class="metrics-list">
            <div class="metric-item">
              <span class="metric-label">{$locale === 'id' ? 'Akurasi Percobaan Pertama' : 'First-Attempt Accuracy'}</span>
              <span class="metric-value">{Math.round(firstAttemptAccuracy * 100)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{$locale === 'id' ? 'Total Petunjuk Digunakan' : 'Total Hints Used'}</span>
              <span class="metric-value">{hintSummary.totalHintsUsed}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{$locale === 'id' ? 'Level Petunjuk Maksimum' : 'Max Hint Level'}</span>
              <span class="metric-value">{hintSummary.maxHintLevel} / 3</span>
            </div>
          </div>
        </div>

        <div class="card panel-card">
          <h3>{$locale === 'id' ? 'Miskonsepsi yang Terdeteksi' : 'Detected Misconceptions'}</h3>
          {#if attempt.misconceptions && attempt.misconceptions.length > 0}
            <div class="misconceptions-list">
              {#each Array.from(new Set(attempt.misconceptions)) as misc}
                {#if misconceptionDetails[misc]}
                  <div class="misconception-card">
                    <span class="misc-badge">⚠️ {$locale === 'id' ? misconceptionDetails[misc].title.id : misconceptionDetails[misc].title.en}</span>
                    <p class="misc-desc">
                      {$locale === 'id' ? misconceptionDetails[misc].desc.id : misconceptionDetails[misc].desc.en}
                    </p>
                  </div>
                {/if}
              {/each}
            </div>
          {:else}
            <p class="no-misconceptions">
              🎉 {$locale === 'id' ? 'Luar biasa! Tidak ada miskonsepsi yang terdeteksi.' : 'Excellent! No misconceptions detected.'}
            </p>
          {/if}
        </div>

        <!-- Skill breakdowns -->
        {#if attempt.skillBreakdown}
          <div class="card panel-card">
            <h3>{$locale === 'id' ? 'Penguasaan Keterampilan' : 'Skill Mastery'}</h3>
            <div class="skills-grid">
              {#each Object.entries(attempt.skillBreakdown) as [skill, val]}
                <div class="skill-row">
                  <span class="skill-name">
                    {#if skill === 'determinacy'}{$locale === 'id' ? 'Determinasi' : 'Determinacy'}
                    {:else if skill === 'reactions'}{$locale === 'id' ? 'Reaksi Tumpuan' : 'Reactions'}
                    {:else if skill === 'zeroForceMembers'}{$locale === 'id' ? 'Batang Gaya Nol' : 'Zero-Force Members'}
                    {:else if skill === 'jointSelection'}{$locale === 'id' ? 'Urutan Titik Hubung' : 'Joint Sequence'}
                    {:else if skill === 'memberForces'}{$locale === 'id' ? 'Persamaan Gaya Batang' : 'Member Forces'}
                    {/if}
                  </span>
                  <div class="skill-bar-wrapper">
                    <div class="skill-bar" style="width: {val * 100}%"></div>
                    <span class="skill-percent">{Math.round(val * 100)}%</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </aside>

      <!-- Right Column: Interactive Timeline & Canvas -->
      <main class="main-content-panel">
        <!-- SVG Truss Canvas displaying the state of the selected step -->
        <div class="canvas-card card">
          <div class="canvas-header">
            <h3>{$locale === 'id' ? 'Model Fisik pada Langkah Terpilih' : 'Physical Model at Selected Step'}</h3>
            <span class="selected-step-name">
              {$locale === 'id' ? stepLabels[telemetry.stepAttempts[selectedAttemptIdx].stepId].id : stepLabels[telemetry.stepAttempts[selectedAttemptIdx].stepId].en}
              (Attempt #{telemetry.stepAttempts[selectedAttemptIdx].attemptNumber})
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

        <!-- Interactive Chronological Timeline -->
        <div class="timeline-card card">
          <h3>{$locale === 'id' ? 'Riwayat Langkah demi Langkah' : 'Step-by-Step History Timeline'}</h3>
          
          <div class="timeline-container">
            <div class="timeline-scroller">
              {#each telemetry.stepAttempts as stepAttempt, idx}
                {@const isSelected = selectedAttemptIdx === idx}
                <button
                  type="button"
                  class="timeline-node {isSelected ? 'selected' : ''} {stepAttempt.isCorrect ? 'correct' : 'incorrect'}"
                  on:click={() => selectedAttemptIdx = idx}
                >
                  <div class="node-icon">
                    {stepAttempt.isCorrect ? '✓' : '✗'}
                  </div>
                  <div class="node-info">
                    <span class="node-step">
                      {$locale === 'id' ? stepLabels[stepAttempt.stepId].id : stepLabels[stepAttempt.stepId].en}
                    </span>
                    <span class="node-attempt">
                      {$locale === 'id' ? `Percobaan #${stepAttempt.attemptNumber}` : `Attempt #${stepAttempt.attemptNumber}`}
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Selected Step Attempt Details -->
        {#if telemetry.stepAttempts[selectedAttemptIdx]}
          {@const selectedAttempt = telemetry.stepAttempts[selectedAttemptIdx]}
          {#key selectedAttemptIdx}
            <div class="details-card card animate-fade-in">
            <div class="details-header">
              <h4>
                {$locale === 'id' ? 'Detail Percobaan:' : 'Attempt Details:'}
                <span class="highlight">
                  {$locale === 'id' ? stepLabels[selectedAttempt.stepId].id : stepLabels[selectedAttempt.stepId].en}
                </span>
                ({$locale === 'id' ? `Percobaan #${selectedAttempt.attemptNumber}` : `Attempt #${selectedAttempt.attemptNumber}`})
              </h4>
              <span class="badge {selectedAttempt.isCorrect ? 'correct' : 'incorrect'}">
                {selectedAttempt.isCorrect ? ($locale === 'id' ? 'Benar' : 'Correct') : ($locale === 'id' ? 'Salah' : 'Incorrect')}
              </span>
            </div>

            <!-- Attempt Details Content based on Step Category -->
            <div class="details-content">
              <!-- Determinacy Step Details -->
              {#if selectedAttempt.stepId === 'determinacy' && selectedAttempt.answersSnapshot}
                {@const answers = selectedAttempt.answersSnapshot}
                {@const refVal = countTrussUnknowns(activeProblem)}
                {@const refClass = classifyTrussByCount(activeProblem)}
                <div class="answers-comparison">
                  <h5>{$locale === 'id' ? 'Jawaban yang Dimasukkan:' : 'Submitted Answers:'}</h5>
                  <div class="comparison-grid">
                    <div class="comparison-row">
                      <span class="label">{$locale === 'id' ? 'Jumlah Batang (m)' : 'Number of Members (m)'}</span>
                      <span class="user-val {answers.m === refVal.m ? 'correct' : 'incorrect'}">{answers.m ?? '-'}</span>
                      <span class="ref-val">({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal.m})</span>
                    </div>
                    <div class="comparison-row">
                      <span class="label">{$locale === 'id' ? 'Jumlah Reaksi (r)' : 'Number of Reactions (r)'}</span>
                      <span class="user-val {answers.r === refVal.r ? 'correct' : 'incorrect'}">{answers.r ?? '-'}</span>
                      <span class="ref-val">({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal.r})</span>
                    </div>
                    <div class="comparison-row">
                      <span class="label">{$locale === 'id' ? 'Jumlah Titik Hubung (j)' : 'Number of Joints (j)'}</span>
                      <span class="user-val {answers.j === refVal.j ? 'correct' : 'incorrect'}">{answers.j ?? '-'}</span>
                      <span class="ref-val">({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal.j})</span>
                    </div>
                    <div class="comparison-row">
                      <span class="label">{$locale === 'id' ? 'Klasifikasi' : 'Classification'}</span>
                      <span class="user-val {answers.classification === refClass ? 'correct' : 'incorrect'}">
                        {#if answers.classification === 'statically_determinate'}{$locale === 'id' ? 'Statis Tertentu' : 'Statically Determinate'}
                        {:else if answers.classification === 'statically_indeterminate'}{$locale === 'id' ? 'Statis Tak Tentu' : 'Statically Indeterminate'}
                        {:else if answers.classification === 'unstable'}{$locale === 'id' ? 'Labil (Unstable)' : 'Unstable'}
                        {:else}-
                        {/if}
                      </span>
                      <span class="ref-val">
                        ({$locale === 'id' ? 'Benar:' : 'Correct:'} 
                        {refClass === 'statically_determinate' ? ($locale === 'id' ? 'Statis Tertentu' : 'Statically Determinate') : refClass === 'statically_indeterminate' ? ($locale === 'id' ? 'Statis Tak Tentu' : 'Statically Indeterminate') : ($locale === 'id' ? 'Labil' : 'Unstable')})
                      </span>
                    </div>
                  </div>
                </div>

              <!-- Reactions Step Details -->
              {:else if selectedAttempt.stepId === 'reactions' && selectedAttempt.answersSnapshot}
                {@const rxAnswers = selectedAttempt.answersSnapshot}
                <div class="answers-comparison">
                  <h5>{$locale === 'id' ? 'Reaksi Tumpuan yang Dimasukkan:' : 'Submitted Support Reactions:'}</h5>
                  <div class="comparison-grid">
                    {#each Object.keys(solverResult.reactions) as rxKey}
                      {@const userVal = rxAnswers[rxKey]}
                      {@const refVal = solverResult.reactions[rxKey]}
                      {@const diff = userVal !== null && userVal !== undefined ? Math.abs(userVal - refVal) : 999}
                      {@const isRxCorrect = diff <= 2}
                      <div class="comparison-row">
                        <span class="label font-mono">{rxKey}</span>
                        <span class="user-val {isRxCorrect ? 'correct' : 'incorrect'}">
                          {userVal !== null && userVal !== undefined ? `${userVal} N` : '-'}
                        </span>
                        <span class="ref-val">({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal} N)</span>
                      </div>
                    {/each}
                  </div>
                </div>

              <!-- Zero Force Members Details -->
              {:else if selectedAttempt.stepId === 'zero_members' && Array.isArray(selectedAttempt.answersSnapshot)}
                {@const selections = selectedAttempt.answersSnapshot}
                {@const correctSelections = selections.filter(id => referenceZeroForceIds.includes(id))}
                {@const falsePositives = selections.filter(id => !referenceZeroForceIds.includes(id))}
                {@const missed = referenceZeroForceIds.filter(id => !selections.includes(id))}
                <div class="zero-members-comparison">
                  <h5>{$locale === 'id' ? 'Identifikasi Batang Gaya Nol:' : 'Zero-Force Members Identification:'}</h5>
                  <div class="zero-feedback-lists">
                    <div class="feedback-col">
                      <span class="col-title text-success">✓ {$locale === 'id' ? 'Benar Diidentifikasi' : 'Correctly Identified'}</span>
                      {#if correctSelections.length > 0}
                        <div class="labels-row">
                          {#each correctSelections as id}
                            <span class="badge badge-success">{getMemberLabel(id)}</span>
                          {/each}
                        </div>
                      {:else}
                        <p class="empty-list-desc">-</p>
                      {/if}
                    </div>

                    <div class="feedback-col">
                      <span class="col-title text-error">✗ {$locale === 'id' ? 'Salah Diidentifikasi (Bukan ZFM)' : 'False Positives (Not ZFM)'}</span>
                      {#if falsePositives.length > 0}
                        <div class="labels-row">
                          {#each falsePositives as id}
                            <span class="badge badge-error">{getMemberLabel(id)}</span>
                          {/each}
                        </div>
                      {:else}
                        <p class="empty-list-desc">-</p>
                      {/if}
                    </div>

                    <div class="feedback-col">
                      <span class="col-title text-warning">⚠️ {$locale === 'id' ? 'Terlewatkan' : 'Missed'}</span>
                      {#if missed.length > 0}
                        <div class="labels-row">
                          {#each missed as id}
                            <span class="badge badge-warning">{getMemberLabel(id)}</span>
                          {/each}
                        </div>
                      {:else}
                        <p class="empty-list-desc">-</p>
                      {/if}
                    </div>
                  </div>
                </div>

              <!-- Joint Selection Details -->
              {:else if selectedAttempt.stepId === 'joint_sequence' && selectedAttempt.answersSnapshot}
                {@const jointId = selectedAttempt.answersSnapshot.jointId}
                <div class="joint-select-comparison">
                  <h5>{$locale === 'id' ? 'Titik Hubung yang Dipilih:' : 'Selected Joint:'}</h5>
                  <p class="selected-joint-text">
                    {$locale === 'id' ? 'Titik Hubung' : 'Joint'} <strong>{jointId ? getJointLabel(jointId) : '-'}</strong>
                  </p>
                </div>

              <!-- Member Forces Step Details -->
              {:else if selectedAttempt.stepId === 'member_forces' && selectedAttempt.answersSnapshot}
                {@const jointId = selectedAttempt.answersSnapshot.jointId}
                {@const mAnswers = selectedAttempt.answersSnapshot.answers || {}}
                <div class="answers-comparison">
                  <h5>
                    {$locale === 'id' ? `Perhitungan Gaya Batang pada Titik Hubung ${getJointLabel(jointId)}:` : `Member Force Calculations at Joint ${getJointLabel(jointId)}:`}
                  </h5>
                  <div class="comparison-grid">
                    {#each Object.keys(mAnswers) as mId}
                      {@const userVal = mAnswers[mId] === '' ? null : parseFloat(mAnswers[mId])}
                      {@const refVal = solverResult.memberForces[mId] ?? 0}
                      {@const diff = userVal !== null && userVal !== undefined ? Math.abs(userVal - refVal) : 999}
                      {@const isForceCorrect = diff <= 2}
                      <div class="comparison-row">
                        <span class="label font-mono">{$locale === 'id' ? 'Batang' : 'Member'} {getMemberLabel(mId)}</span>
                        <span class="user-val {isForceCorrect ? 'correct' : 'incorrect'}">
                          {userVal !== null && userVal !== undefined ? `${userVal} N` : '-'}
                          {#if userVal !== null && userVal !== undefined}
                            ({userVal > 0 ? ($locale === 'id' ? 'Tarik' : 'Tension') : userVal < 0 ? ($locale === 'id' ? 'Tekan' : 'Compression') : 'Zero'})
                          {/if}
                        </span>
                        <span class="ref-val">
                          ({$locale === 'id' ? 'Benar:' : 'Correct:'} {refVal} N 
                          {refVal > 0 ? ($locale === 'id' ? 'Tarik' : 'Tension') : refVal < 0 ? ($locale === 'id' ? 'Tekan' : 'Compression') : 'Zero'})
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- System Feedback Message callout -->
              {#if selectedAttempt.feedbackMessages && selectedAttempt.feedbackMessages.length > 0}
                <div class="feedback-callout">
                  <h5>{$locale === 'id' ? 'Respon Sistem:' : 'System Response:'}</h5>
                  <ul>
                    {#each selectedAttempt.feedbackMessages as msg}
                      <li>{msg}</li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <!-- Misconception Highlight inside attempt details -->
              {#if selectedAttempt.misconceptions && selectedAttempt.misconceptions.length > 0}
                <div class="misconceptions-callout">
                  <h5>{$locale === 'id' ? 'Kesalahan Berpikir Terdeteksi:' : 'Misconception Flagged:'}</h5>
                  <div class="tags-group">
                    {#each selectedAttempt.misconceptions as misc}
                      {#if misconceptionDetails[misc]}
                        <span class="callout-misc-badge">
                          ⚠️ {$locale === 'id' ? misconceptionDetails[misc].title.id : misconceptionDetails[misc].title.en}
                        </span>
                      {/if}
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Hint Used Card -->
              {#if selectedAttempt.hintLevelUsed > 0}
                {@const stepHintKeys = {
                  overview: [],
                  determinacy: ['reaction_count_error'],
                  reactions: ['sign_reversed'],
                  zero_members: ['zero_force_missed', 'zero_force_false_positive'],
                  joint_sequence: ['wrong_joint_order'],
                  member_forces: ['sign_reversed', 'tension_compression_confusion'],
                  summary: []
                }[selectedAttempt.stepId] || []}
                {@const primaryHintKey = stepHintKeys.find(key => selectedAttempt.misconceptions?.includes(key)) || stepHintKeys[0]}
                
                {#if primaryHintKey && guidedHints[primaryHintKey]}
                  <div class="hint-card">
                    <span class="hint-badge">💡 {$locale === 'id' ? `Petunjuk Tingkat ${selectedAttempt.hintLevelUsed} Digunakan` : `Hint Level ${selectedAttempt.hintLevelUsed} Unlocked`}</span>
                    <p class="hint-text">
                      {getHintText(guidedHints[primaryHintKey], selectedAttempt.hintLevelUsed, $locale)}
                    </p>
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        {/key}
      {/if}
      </main>
    </div>
  {/if}
</div>

<script context="module" lang="ts">
  // Helper to calculate count of truss unknowns for comparative render
  function countTrussUnknowns(truss: any) {
    const m = truss.members.length;
    const r = truss.supports.reduce((acc: number, s: any) => acc + (s.type === 'pin' ? 2 : 1), 0);
    const j = truss.joints.length;
    return { m, r, j };
  }

  function classifyTrussByCount(truss: any): 'statically_determinate' | 'statically_indeterminate' | 'unstable' {
    const { m, r, j } = countTrussUnknowns(truss);
    const LHS = m + r;
    const RHS = 2 * j;
    if (LHS < RHS) return 'unstable';
    if (LHS > RHS) return 'statically_indeterminate';
    return 'statically_determinate';
  }
</script>

<style>
  .review-page-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .review-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1.25rem;
  }

  .back-btn {
    align-self: flex-start;
    font-size: 0.82rem;
    padding: 0.45rem 0.75rem;
  }

  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header-title h1 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0.25rem 0;
    color: var(--text-primary);
  }

  .timestamp {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .guided-badge {
    font-size: 0.7rem;
    background-color: rgba(37, 99, 235, 0.1);
    color: var(--color-primary);
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
    font-weight: 700;
  }

  .score-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .score-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: bold;
    color: var(--text-secondary);
  }

  .score-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--color-success, #10b981);
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  .review-grid {
    display: grid;
    grid-template-columns: 1fr 2.2fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .review-grid {
      grid-template-columns: 1fr;
    }
  }

  .card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .panel-card {
    margin-bottom: 1.25rem;
  }

  .panel-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .metrics-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
  }

  .metric-label {
    color: var(--text-secondary);
  }

  .metric-value {
    font-weight: bold;
    color: var(--text-primary);
  }

  .misconceptions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .misconception-card {
    padding: 0.6rem;
    border-radius: 6px;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-left: 3px solid #f59e0b;
  }

  .misc-badge {
    font-size: 0.75rem;
    font-weight: bold;
    color: #d97706;
  }

  .misc-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 0.25rem 0 0 0;
    line-height: 1.35;
  }

  .no-misconceptions {
    font-size: 0.82rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .skills-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .skill-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .skill-name {
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--text-secondary);
  }

  .skill-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--bg-primary);
    border-radius: 4px;
    padding: 0.2rem;
    border: 1px solid var(--border-color);
  }

  .skill-bar {
    height: 6px;
    background-color: var(--color-primary);
    border-radius: 3px;
  }

  .skill-percent {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .main-content-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

  .timeline-card h3 {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    font-weight: bold;
    color: var(--text-primary);
  }

  .timeline-container {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .timeline-scroller {
    display: flex;
    gap: 1rem;
    min-width: max-content;
    padding: 0.25rem;
  }

  .timeline-node {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    border-radius: 20px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    cursor: pointer;
    transition: all 0.15s;
  }

  .timeline-node:hover {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.04);
  }

  .timeline-node.selected {
    border-color: var(--color-primary);
    background-color: rgba(37, 99, 235, 0.1);
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .node-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
  }

  .timeline-node.correct .node-icon {
    background-color: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .timeline-node.incorrect .node-icon {
    background-color: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  .node-info {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .node-step {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .node-attempt {
    font-size: 0.65rem;
    color: var(--text-secondary);
  }

  .details-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .details-header h4 {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .details-header .highlight {
    color: var(--color-primary);
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }

  .badge.correct {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .badge.incorrect {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .details-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .answers-comparison h5,
  .zero-members-comparison h5,
  .joint-select-comparison h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.82rem;
    font-weight: bold;
    color: var(--text-secondary);
  }

  .comparison-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .comparison-row {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    font-size: 0.8rem;
    align-items: center;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.35rem;
  }

  .comparison-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .comparison-row .label {
    font-weight: 600;
    color: var(--text-primary);
  }

  .comparison-row .user-val {
    font-weight: 700;
  }

  .comparison-row .user-val.correct {
    color: #10b981;
  }

  .comparison-row .user-val.incorrect {
    color: #ef4444;
  }

  .comparison-row .ref-val {
    color: var(--text-secondary);
    font-style: italic;
    text-align: right;
  }

  .zero-feedback-lists {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .feedback-col {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .col-title {
    font-size: 0.75rem;
    font-weight: bold;
  }

  .text-success { color: #10b981; }
  .text-error { color: #ef4444; }
  .text-warning { color: #f59e0b; }

  .labels-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .badge-success { background-color: rgba(16, 185, 129, 0.15); color: #10b981; }
  .badge-error { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; }
  .badge-warning { background-color: rgba(245, 158, 11, 0.15); color: #d97706; }

  .empty-list-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .selected-joint-text {
    font-size: 0.85rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.5rem;
    display: inline-block;
  }

  .feedback-callout {
    background-color: rgba(37, 99, 235, 0.03);
    border: 1px solid var(--border-color);
    border-left: 3px solid var(--color-primary);
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
  }

  .feedback-callout h5,
  .misconceptions-callout h5 {
    margin: 0 0 0.25rem 0;
    font-size: 0.8rem;
    font-weight: bold;
    color: var(--text-primary);
  }

  .feedback-callout ul {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .misconceptions-callout {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    background-color: rgba(245, 158, 11, 0.03);
    border: 1px solid var(--border-color);
    border-left: 3px solid #f59e0b;
  }

  .tags-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.25rem;
  }

  .callout-misc-badge {
    font-size: 0.75rem;
    font-weight: bold;
    color: #b45309;
    background-color: #fef3c7;
    border: 1px solid #fde68a;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }

  :global(html.dark) .callout-misc-badge {
    color: #fcd34d;
    background-color: rgba(217, 119, 6, 0.15);
    border-color: rgba(217, 119, 6, 0.3);
  }

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

  .btn {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    transition: background-color 0.15s;
  }

  .btn-secondary {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background-color: var(--border-color);
  }

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
