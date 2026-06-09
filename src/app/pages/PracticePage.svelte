<script lang="ts">
  import type { RigidBody, Support, Load, ProblemModel } from '../../lib/domain/models/types';
  import { starterProblems } from '../../content/problems/statics-problems';
  import { checkFbdModel } from '../../lib/domain/validation/checker';
  import { solveEquilibrium } from '../../lib/domain/solvers/equilibrium';
  import FbdCanvas from '../../lib/ui/FbdCanvas.svelte';
  import { locale, translations } from '../../lib/utils/i18n';
  import { selectPracticeProblemFromRoute } from '../routing/problemSelection';
  import PracticeBodySettingsForm from '../components/practice/PracticeBodySettingsForm.svelte';
  import PracticePresetSelector from '../components/practice/PracticePresetSelector.svelte';
  import PracticeSolverPanel from '../components/practice/PracticeSolverPanel.svelte';
  import PracticeSupportForm from '../components/practice/PracticeSupportForm.svelte';

  export let initialProblemId: string | null = null;
  export let onNavigate: (page: string, params?: any) => void;

  // 1. App State
  let body: RigidBody = {
    id: 'custom-body',
    type: 'beam',
    width: 6.0,
    height: 0.3,
    weight: 0,
  };

  let supports: Support[] = [];
  let loads: Load[] = [];
  
  let showLabels = true;
  let showReactions = true;
  let selectedItemId: string | null = null;
  let selectedItemType: 'support' | 'load' | null = null;

  // 2. Preset management
  let problemDropdownValue = 'custom';

  // 3. Form input states for adding new items
  let inputMode: 'none' | 'body' | 'add_support' | 'add_load' = 'none';
  
  // Support Form Fields
  let suppType: 'pin' | 'roller' | 'fixed' = 'pin';
  let suppX = 0.0;
  let suppAngle = 0.0; // surface incline
  let suppLabel = 'A';

  // Load Form Fields
  let loadType: 'point_force' | 'applied_moment' | 'distributed_load' = 'point_force';
  let loadX = 3.0;
  let loadY = 0.3; // top of beam
  let loadMag = 100.0;
  let loadAngle = 270.0; // straight down
  let loadLabel = 'F1';
  // Distributed load specific
  let distStartX = 1.0;
  let distEndX = 4.0;
  let distMagStart = 100.0;
  let distMagEnd = 100.0;

  // 4. Derive solvers and validation results reactively
  $: activeLoads = body.weight > 0 
    ? [...loads, {
        id: 'load-internal-weight',
        type: 'body_weight',
        label: 'W',
        magnitude: body.weight,
        position: { x: body.width / 2, y: body.height / 2 }
      } as Load]
    : loads;

  $: validation = checkFbdModel(body, supports, activeLoads, $locale);
  $: solverResult = solveEquilibrium(body, supports, activeLoads);

  let lastSyncedRouteProblemId: string | null | undefined = undefined;

  // 5. Route prop synchronization: keep mounted workspace aligned with hash changes.
  $: if (initialProblemId !== lastSyncedRouteProblemId) {
    lastSyncedRouteProblemId = initialProblemId;
    const selection = selectPracticeProblemFromRoute(initialProblemId, starterProblems);
    if (selection.kind === 'default') {
      loadProblemById(selection.problemId);
      problemDropdownValue = selection.problemId;
    } else if (selection.kind === 'route') {
      loadProblemById(selection.problemId);
      problemDropdownValue = selection.problemId;
    } else {
      supports = [];
      loads = [];
      selectedItemId = null;
      selectedItemType = null;
      inputMode = 'none';
      problemDropdownValue = 'custom';
    }
  }

  function loadProblemById(id: string) {
    if (id === 'custom') {
      // Keep current settings but clear problems
      return;
    }
    const problem = starterProblems.find(p => p.id === id);
    if (problem) {
      body = { ...problem.body };
      supports = problem.supports.map(s => ({ ...s }));
      loads = problem.loads.map(l => ({ ...l }));
      selectedItemId = null;
      selectedItemType = null;
      inputMode = 'none';
    }
  }

  function handleProblemChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const val = target.value;
    problemDropdownValue = val;
    if (val === 'custom') {
      // Just clear supports/loads for a custom sandbox
      supports = [];
      loads = [];
      selectedItemId = null;
      selectedItemType = null;
    } else {
      loadProblemById(val);
    }
  }

  // 6. Support and Load Actions
  function generateNextSupportLabel(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (!supports.some(s => s.label === char)) {
        return char;
      }
    }
    return 'Z';
  }

  function generateNextLoadLabel(type: string): string {
    const prefix = type === 'point_force' ? 'F' : (type === 'applied_moment' ? 'M' : 'w');
    const existing = loads.filter(l => l.type === type);
    return `${prefix}${existing.length + 1}`;
  }

  function openAddSupportForm() {
    inputMode = 'add_support';
    suppX = Math.round((body.width / 2) * 10) / 10;
    suppType = 'pin';
    suppAngle = 0;
    suppLabel = generateNextSupportLabel();
  }

  function openAddLoadForm() {
    inputMode = 'add_load';
    loadX = Math.round((body.width / 2) * 10) / 10;
    loadType = 'point_force';
    loadLabel = generateNextLoadLabel('point_force');
    loadMag = 200;
    loadAngle = 270;
    
    // Dist load reset values
    distStartX = Math.max(0, loadX - 1.5);
    distEndX = Math.min(body.width, loadX + 1.5);
    distMagStart = 100;
    distMagEnd = 100;
  }

  function openBodySettings() {
    inputMode = 'body';
  }

  function handleBodyChange(nextBody: RigidBody) {
    body = nextBody;
  }

  function saveNewSupport() {
    const newSupport: Support = {
      id: `support-${Date.now()}`,
      type: suppType,
      position: { x: suppX, y: 0.0 }, // fixed to bottom surface for 2D MVP
      angle: suppAngle,
      label: suppLabel.toUpperCase() || 'A',
    };
    supports = [...supports, newSupport];
    selectedItemId = newSupport.id;
    selectedItemType = 'support';
    inputMode = 'none';
    problemDropdownValue = 'custom';
  }

  function saveNewLoad() {
    let newLoad: Load;
    const loadId = `load-${Date.now()}`;
    const nameLabel = loadLabel || 'F1';

    if (loadType === 'point_force') {
      newLoad = {
        id: loadId,
        type: 'point_force',
        label: nameLabel,
        magnitude: loadMag,
        angle: loadAngle,
        position: { x: loadX, y: body.height }, // placed at top of beam/block
      };
    } else if (loadType === 'applied_moment') {
      newLoad = {
        id: loadId,
        type: 'applied_moment',
        label: nameLabel,
        magnitude: loadMag, // CCW = positive, CW = negative
        position: { x: loadX, y: body.height / 2 },
      };
    } else {
      newLoad = {
        id: loadId,
        type: 'distributed_load',
        label: nameLabel,
        magnitudeStart: distMagStart,
        magnitudeEnd: distMagEnd,
        startPosition: { x: distStartX, y: body.height },
        endPosition: { x: distEndX, y: body.height },
        angle: 270, // perpendicular straight down
      };
    }

    loads = [...loads, newLoad];
    selectedItemId = newLoad.id;
    selectedItemType = 'load';
    inputMode = 'none';
    problemDropdownValue = 'custom';
  }

  function deleteSelectedItem() {
    if (!selectedItemId) return;
    if (selectedItemType === 'support') {
      supports = supports.filter(s => s.id !== selectedItemId);
    } else if (selectedItemType === 'load') {
      loads = loads.filter(l => l.id !== selectedItemId);
    }
    selectedItemId = null;
    selectedItemType = null;
    inputMode = 'none';
    problemDropdownValue = 'custom';
  }

  function selectItem(id: string, type: 'support' | 'load') {
    selectedItemId = id;
    selectedItemType = type;
    inputMode = 'none';
  }

  function handleCanvasClick(meterX: number, meterY: number) {
    // If we click in blank space, deselect current selection
    selectedItemId = null;
    selectedItemType = null;

    // If we are currently filling in a coordinate field, auto-populate it!
    if (inputMode === 'add_support') {
      suppX = meterX;
    } else if (inputMode === 'add_load') {
      loadX = meterX;
      distStartX = Math.max(0, meterX - 1.0);
      distEndX = Math.min(body.width, meterX + 1.0);
    }
  }

  function handleLoadTypeChange() {
    loadLabel = generateNextLoadLabel(loadType);
    if (loadType === 'applied_moment') {
      loadAngle = 0; // moment has no angle vector in 2D
    } else if (loadType === 'point_force') {
      loadAngle = 270;
    }
  }

  function clearAll() {
    supports = [];
    loads = [];
    selectedItemId = null;
    selectedItemType = null;
    inputMode = 'none';
    problemDropdownValue = 'custom';
  }
</script>

<div class="practice-container">
  <PracticePresetSelector
    problems={starterProblems}
    {problemDropdownValue}
    onProblemChange={handleProblemChange}
    onReset={clearAll}
    onDashboard={() => onNavigate('dashboard')}
  />

  <!-- Layout Main Content Grid -->
  <div class="sandbox-layout">
    <!-- Left Column: Canvas and Builder Palette -->
    <div class="workspace-panel">
      <!-- Info banner for problem presets -->
      {#if problemDropdownValue !== 'custom'}
        {@const loadedProb = starterProblems.find(p => p.id === problemDropdownValue)}
        {#if loadedProb}
          <div class="problem-info-banner">
            <div>
              <strong>{translations[$locale].targetGoal}</strong> 
              {$locale === 'id' ? loadedProb.descriptionId || loadedProb.description : loadedProb.description}
            </div>
            <div class="hint-toggle-wrapper">
              <strong>{translations[$locale].expected}</strong> 
              <span class="badge badge-expected">
                {#if loadedProb.expectedDeterminacy === 'statically_determinate'}
                  {translations[$locale].determinate}
                {:else if loadedProb.expectedDeterminacy === 'statically_indeterminate'}
                  {translations[$locale].indeterminate}
                {:else}
                  {translations[$locale].unstable}
                {/if}
              </span>
            </div>
          </div>
        {/if}
      {/if}

      <!-- Visual Canvas Card -->
      <div class="canvas-card">
        <div class="canvas-header">
          <div class="canvas-title">{translations[$locale].canvasTitle}</div>
          <div class="canvas-options">
            <label class="toggle-control">
              <input type="checkbox" bind:checked={showLabels} />
              <span>{translations[$locale].showLabels}</span>
            </label>
            <label class="toggle-control">
              <input type="checkbox" bind:checked={showReactions} />
              <span>{translations[$locale].showReactions}</span>
            </label>
          </div>
        </div>

        <FbdCanvas
          {body}
          {supports}
          {loads}
          reactions={solverResult.reactions ? Object.entries(solverResult.reactions).map(([symbol, magnitude]) => {
            // Reconstruct Reaction list to pass to canvas
            // Find corresponding support/direction
            const matchSupport = supports.find(s => symbol.includes(s.label));
            const direction = symbol.endsWith('x') ? { x: 1, y: 0 } : (symbol.endsWith('y') ? { x: 0, y: 1 } : { x: 0, y: 0 });
            return {
              id: symbol,
              supportId: matchSupport?.id || '',
              type: symbol.startsWith('M') ? 'moment' : (symbol.endsWith('x') ? 'force_x' : 'force_y'),
              position: matchSupport?.position || { x: 0, y: 0 },
              symbol,
              magnitude,
              direction
            };
          }) : []}
          momentPivot={solverResult.momentPivot}
          {showLabels}
          {showReactions}
          {selectedItemId}
          onItemSelect={selectItem}
          onCanvasClick={handleCanvasClick}
        />
        
        <div class="canvas-instruction">
          💡 <em>{translations[$locale].canvasTip}</em>
        </div>
      </div>

      <!-- Action Palette Buttons -->
      <div class="palette-bar">
        <button class="btn btn-secondary" on:click={openBodySettings}>
          📦 {translations[$locale].editBodyProps}
        </button>
        <button class="btn btn-primary" on:click={openAddSupportForm}>
          ➕ {translations[$locale].addSupport}
        </button>
        <button class="btn btn-primary" on:click={openAddLoadForm}>
          💥 {translations[$locale].addAppliedLoad}
        </button>
      </div>

      <!-- Builder Forms and Inspector Card -->
      {#if inputMode !== 'none' || selectedItemId}
        <div class="inspector-card animate-fade-in">
          {#if inputMode === 'body'}
            <PracticeBodySettingsForm
              {body}
              onBodyChange={handleBodyChange}
              onClose={() => inputMode = 'none'}
            />

          {:else if inputMode === 'add_support'}
            <PracticeSupportForm
              bodyWidth={body.width}
              bind:suppType
              bind:suppX
              bind:suppAngle
              bind:suppLabel
              onCancel={() => inputMode = 'none'}
              onSave={saveNewSupport}
            />

          {:else if inputMode === 'add_load'}
            <h3>{translations[$locale].addExternalLoad}</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="load-type">{translations[$locale].loadType}</label>
                <select id="load-type" class="form-control" bind:value={loadType} on:change={handleLoadTypeChange}>
                  <option value="point_force">{translations[$locale].pointForce}</option>
                  <option value="applied_moment">{translations[$locale].appliedMoment}</option>
                  <option value="distributed_load">{translations[$locale].distributedLoad}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="load-lbl">{translations[$locale].label}</label>
                <input id="load-lbl" type="text" class="form-control" bind:value={loadLabel} />
              </div>
            </div>

            {#if loadType === 'point_force' || loadType === 'applied_moment'}
              <div class="form-row">
                <div class="form-group">
                  <label for="load-x">{translations[$locale].positionX} (0 to {body.width}m)</label>
                  <input id="load-x" type="number" min="0" max={body.width} step="0.1" class="form-control" bind:value={loadX} />
                </div>
                <div class="form-group">
                  <label for="load-mag">
                    {loadType === 'point_force' ? translations[$locale].forceMag : translations[$locale].momentMag}
                  </label>
                  <input id="load-mag" type="number" step="10" class="form-control" bind:value={loadMag} />
                </div>
                {#if loadType === 'point_force'}
                  <div class="form-group">
                    <label for="load-ang">{translations[$locale].forceAngle}</label>
                    <input id="load-ang" type="number" min="0" max="360" step="15" class="form-control" bind:value={loadAngle} />
                  </div>
                {/if}
              </div>
            {:else}
              <!-- Distributed Load specific controls -->
              <div class="form-row">
                <div class="form-group">
                  <label for="dist-x1">{translations[$locale].startX}</label>
                  <input id="dist-x1" type="number" min="0" max={body.width} step="0.1" class="form-control" bind:value={distStartX} />
                </div>
                <div class="form-group">
                  <label for="dist-x2">{translations[$locale].endX}</label>
                  <input id="dist-x2" type="number" min="0" max={body.width} step="0.1" class="form-control" bind:value={distEndX} />
                </div>
                <div class="form-group">
                  <label for="dist-w1">{translations[$locale].loadStartMag}</label>
                  <input id="dist-w1" type="number" min="0" step="10" class="form-control" bind:value={distMagStart} />
                </div>
                <div class="form-group">
                  <label for="dist-w2">{translations[$locale].loadEndMag}</label>
                  <input id="dist-w2" type="number" min="0" step="10" class="form-control" bind:value={distMagEnd} />
                </div>
              </div>
            {/if}
            
            <div class="form-actions">
              <button class="btn btn-secondary" on:click={() => inputMode = 'none'}>{translations[$locale].cancel}</button>
              <button class="btn btn-primary" on:click={saveNewLoad}>{translations[$locale].applyLoad}</button>
            </div>

          {:else if selectedItemId}
            <!-- Item Inspector (Details of selected support or load) -->
            {@const selectedSupport = supports.find(s => s.id === selectedItemId)}
            {@const selectedLoad = loads.find(l => l.id === selectedItemId)}
            
            <div class="inspector-item-header">
              <h3>{translations[$locale].elementInspector}</h3>
              <button class="btn btn-danger btn-sm" on:click={deleteSelectedItem}>
                🗑️ {translations[$locale].deleteElement}
              </button>
            </div>

            {#if selectedSupport}
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-supp-type">{translations[$locale].supportType}</label>
                  <select id="edit-supp-type" class="form-control" bind:value={selectedSupport.type}>
                    <option value="pin">{$locale === 'id' ? 'Sendi' : 'Pin'}</option>
                    <option value="roller">Roller</option>
                    <option value="fixed">{$locale === 'id' ? 'Jepit' : 'Fixed'}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="edit-supp-x">{translations[$locale].positionX} (m)</label>
                  <input id="edit-supp-x" type="number" min="0" max={body.width} step="0.1" class="form-control" bind:value={selectedSupport.position.x} />
                </div>
                <div class="form-group">
                  <label for="edit-supp-lbl">{translations[$locale].label}</label>
                  <input id="edit-supp-lbl" type="text" class="form-control" bind:value={selectedSupport.label} />
                </div>
                {#if selectedSupport.type === 'roller'}
                  <div class="form-group">
                    <label for="edit-supp-ang">{translations[$locale].rollerIncline}</label>
                    <input id="edit-supp-ang" type="number" class="form-control" bind:value={selectedSupport.angle} />
                  </div>
                {/if}
              </div>
            {:else if selectedLoad}
              {#if selectedLoad.type === 'point_force'}
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-load-lbl">{translations[$locale].label}</label>
                    <input id="edit-load-lbl" type="text" class="form-control" bind:value={selectedLoad.label} />
                  </div>
                  <div class="form-group">
                    <label for="edit-load-x">{translations[$locale].positionX} (m)</label>
                    <input id="edit-load-x" type="number" min="0" max={body.width} step="0.1" class="form-control" bind:value={selectedLoad.position.x} />
                  </div>
                  <div class="form-group">
                    <label for="edit-load-mag">{translations[$locale].forceMag}</label>
                    <input id="edit-load-mag" type="number" class="form-control" bind:value={selectedLoad.magnitude} />
                  </div>
                  <div class="form-group">
                    <label for="edit-load-ang">{translations[$locale].forceAngle}</label>
                    <input id="edit-load-ang" type="number" class="form-control" bind:value={selectedLoad.angle} />
                  </div>
                </div>
              {:else if selectedLoad.type === 'applied_moment'}
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-load-lbl">{translations[$locale].label}</label>
                    <input id="edit-load-lbl" type="text" class="form-control" bind:value={selectedLoad.label} />
                  </div>
                  <div class="form-group">
                    <label for="edit-load-x">{translations[$locale].positionX} (m)</label>
                    <input id="edit-load-x" type="number" min="0" max={body.width} step="0.1" class="form-control" bind:value={selectedLoad.position.x} />
                  </div>
                  <div class="form-group">
                    <label for="edit-load-mag">{translations[$locale].momentMag}</label>
                    <input id="edit-load-mag" type="number" class="form-control" bind:value={selectedLoad.magnitude} />
                  </div>
                </div>
              {:else if selectedLoad.type === 'distributed_load'}
                <div class="form-row">
                  <div class="form-group">
                    <label for="edit-load-lbl">{translations[$locale].label}</label>
                    <input id="edit-load-lbl" type="text" class="form-control" bind:value={selectedLoad.label} />
                  </div>
                  <div class="form-group">
                    <label for="edit-dist-x1">{translations[$locale].startX}</label>
                    <input id="edit-dist-x1" type="number" min="0" max={body.width} step="0.1" class="form-control" bind:value={selectedLoad.startPosition.x} />
                  </div>
                  <div class="form-group">
                    <label for="edit-dist-x2">{translations[$locale].endX}</label>
                    <input id="edit-dist-x2" type="number" min="0" max={body.width} step="0.1" class="form-control" bind:value={selectedLoad.endPosition.x} />
                  </div>
                  <div class="form-group">
                    <label for="edit-dist-w1">{translations[$locale].loadStartMag}</label>
                    <input id="edit-dist-w1" type="number" class="form-control" bind:value={selectedLoad.magnitudeStart} />
                  </div>
                  <div class="form-group">
                    <label for="edit-dist-w2">{translations[$locale].loadEndMag}</label>
                    <input id="edit-dist-w2" type="number" class="form-control" bind:value={selectedLoad.magnitudeEnd} />
                  </div>
                </div>
              {/if}
            {/if}
            <div class="form-actions">
              <button class="btn btn-secondary" on:click={() => selectedItemId = null}>{translations[$locale].deselect}</button>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Preset problem hints block if preset is active -->
      {#if problemDropdownValue !== 'custom'}
        {@const currProb = starterProblems.find(p => p.id === problemDropdownValue)}
        {#if currProb}
          <div class="hints-card card">
            <h4>💡 {translations[$locale].solvingHints}</h4>
            <ul>
              {#each ($locale === 'id' ? currProb.hintsId || currProb.hints : currProb.hints) as hint}
                <li>{hint}</li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}
    </div>

    <PracticeSolverPanel
      feedbacks={validation.feedbacks}
      determinacy={validation.determinacy}
      stability={validation.stability}
      {solverResult}
      {supports}
      {showReactions}
    />
  </div>
</div>

<style>
  .practice-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 1300px;
    margin: 0 auto;
    animation: fadeIn 0.4s ease-out;
  }

  .sandbox-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 950px) {
    .sandbox-layout {
      grid-template-columns: 1.2fr 1fr;
    }
  }

  .workspace-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .problem-info-banner {
    background-color: rgba(37, 99, 235, 0.05);
    border: 1px solid rgba(37, 99, 235, 0.15);
    border-radius: 8px;
    padding: 1rem;
    font-size: 0.9rem;
    color: var(--text-primary);
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .hint-toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
  }

  .badge-expected {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    color: var(--color-primary);
    text-transform: uppercase;
    font-size: 0.75rem;
  }

  .canvas-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
  }

  .canvas-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .canvas-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-secondary);
  }

  .canvas-options {
    display: flex;
    gap: 1rem;
  }

  .toggle-control {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  .canvas-instruction {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-align: center;
    margin-top: 0.5rem;
  }

  .palette-bar {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .palette-bar button {
    flex: 1;
    min-width: 150px;
    padding: 0.65rem;
  }

  .inspector-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }

  .inspector-card h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.4rem;
  }

  .inspector-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.4rem;
  }

  .inspector-item-header h3 {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
    border-top: 1px solid var(--border-color);
    padding-top: 0.75rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .hints-card {
    padding: 1.25rem;
  }

  .hints-card h4 {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    color: var(--color-primary);
  }

  .hints-card ul {
    margin-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .hints-card li {
    margin-bottom: 0.35rem;
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
