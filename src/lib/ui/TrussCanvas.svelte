<script lang="ts">
  import type { TrussJoint, TrussMember, TrussJointLoad } from '../domain/truss/types';
  import type { Support } from '../domain/models/types';
  import { locale } from '../utils/i18n';
  import { getDistance } from '../domain/geometry/vector2d';
  import { createTrussViewport, trussToSvgX, trussToSvgY } from './trussViewport';

  export let joints: TrussJoint[] = [];
  export let members: TrussMember[] = [];
  export let supports: Support[] = [];
  export let loads: TrussJointLoad[] = [];
  export let memberForces: Record<string, number> = {};
  export let reactions: Record<string, number> = {};
  export let isSolved = false;

  // Guided-mode props (optional — default to inactive so existing callers are unaffected)
  /** Joint ID highlighted as "currently being solved" in guided mode. */
  export let selectedJointId: string | null = null;
  /** Member IDs that have been solved in guided mode (rendered with green tint). */
  export let solvedMemberIds: string[] = [];
  /** Member IDs highlighted as zero-force selections in guided mode (blue-dashed). */
  export let highlightZeroForceIds: string[] = [];
  /** Suppress tension/compression coloring during early guided steps. */
  export let hideMemberForces: boolean = false;
  /** Joint IDs recommended as next solvable joints (subtle glow). */
  export let recommendedJointIds: string[] = [];

  // Internal selection state (for inspector overlay clicks — separate from guided selectedJointId)
  let inspectorJointId: string | null = null;
  let selectedMemberId: string | null = null;

  // Derived sets for O(1) lookup
  $: solvedMemberSet = new Set(solvedMemberIds);
  $: highlightZeroSet = new Set(highlightZeroForceIds);
  $: recommendedJointSet = new Set(recommendedJointIds);

  // SVG parameters
  const svgWidth = 750;
  const svgHeight = 350;
  const margin = 50;

  // Bounding box & scaling calculations
  $: viewport = createTrussViewport(joints, svgWidth, svgHeight, margin);
  $: scale = viewport.scale;

  function toSvgX(x: number): number {
    return trussToSvgX(viewport, x);
  }

  function toSvgY(y: number): number {
    return trussToSvgY(viewport, y);
  }

  // Helper map
  $: jointsMap = new Map<string, TrussJoint>(joints.map(j => [j.id, j]));

  // Get force state — respects hideMemberForces for guided mode
  function getMemberForceState(memberId: string): 'tension' | 'compression' | 'zero' | 'unsolved' | 'guided-solved' | 'guided-zero-highlight' {
    // Guided-mode overrides
    if (highlightZeroSet.has(memberId)) return 'guided-zero-highlight';
    if (hideMemberForces && solvedMemberSet.has(memberId)) return 'guided-solved';
    if (hideMemberForces) return 'unsolved';

    // Normal mode
    if (!isSolved && !solvedMemberSet.has(memberId)) return 'unsolved';
    const force = memberForces[memberId];
    if (force === undefined) {
      if (solvedMemberSet.has(memberId)) return 'guided-solved';
      return 'unsolved';
    }
    if (Math.abs(force) < 1e-2) return 'zero';
    return force > 0 ? 'tension' : 'compression';
  }

  // Joint visual class for guided mode
  function getGuidedJointClass(jointId: string): string {
    if (selectedJointId === jointId) return 'guided-active';
    if (recommendedJointSet.has(jointId)) return 'guided-recommended';
    return '';
  }

  // Draw force vector arrow pointing towards a joint
  function getLoadArrowPoints(load: TrussJointLoad) {
    const joint = jointsMap.get(load.jointId);
    if (!joint) return null;

    const jx = toSvgX(joint.position.x);
    const jy = toSvgY(joint.position.y);

    const rad = (load.angle * Math.PI) / 180;
    // Arrow length is 45px
    const arrowLen = 45;
    const arrowHeadLen = 10;

    // Arrow starts at (jx - arrowLen * cos, jy + arrowLen * sin) and points to (jx, jy)
    // Remember: in SVG, y increases downwards. So +y in Cartesian translates to -y in SVG.
    const startX = jx - arrowLen * Math.cos(rad);
    const startY = jy + arrowLen * Math.sin(rad);

    return { startX, startY, endX: jx, endY: jy };
  }
</script>

<div class="canvas-wrapper">
  <svg 
    viewBox="0 0 {svgWidth} {svgHeight}" 
    class="truss-svg"
    role="img"
    aria-label="Structural diagram of the planar truss showing joints, members, support reactions, and external loads"
  >
    <title>Planar Truss Structural Diagram</title>
    <desc>Interactive SVG diagram showing {joints.length} joints, {members.length} members, support conditions, and applied loads for structural analysis.</desc>
    <defs>
      <!-- External Force Arrowhead -->
      <marker id="arrow-force" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-force, #dc2626)" />
      </marker>
      <!-- Support Reaction Arrowhead -->
      <marker id="arrow-reaction" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-reaction, #2563eb)" />
      </marker>
    </defs>

    <!-- Grid / Background -->
    <rect width={svgWidth} height={svgHeight} class="svg-bg" />

    <!-- 1. Draw Members -->
    {#each members as m}
      {@const jA = jointsMap.get(m.jointA)}
      {@const jB = jointsMap.get(m.jointB)}
      {#if jA && jB}
        {@const state = getMemberForceState(m.id)}
        {@const forceVal = memberForces[m.id]}
        {@const midX = (toSvgX(jA.position.x) + toSvgX(jB.position.x)) / 2}
        {@const midY = (toSvgY(jA.position.y) + toSvgY(jB.position.y)) / 2}
        {@const isSelected = selectedMemberId === m.id}

        <!-- Interactive Member Group -->
        <g 
          class="member-group state-{state} {isSelected ? 'selected' : ''}"
          role="button"
          tabindex="0"
          aria-label="Member {m.label}. {state === 'unsolved' ? 'Unsolved' : `Force: ${Math.abs(forceVal ?? 0)} N in ${state === 'tension' ? 'Tension' : state === 'compression' ? 'Compression' : 'Zero-Force'}`}"
          on:click={() => { selectedMemberId = m.id; inspectorJointId = null; }}
          on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { selectedMemberId = m.id; inspectorJointId = null; } }}
        >
          <!-- Member line shadow for outline/hover -->
          <line 
            x1={toSvgX(jA.position.x)} 
            y1={toSvgY(jA.position.y)} 
            x2={toSvgX(jB.position.x)} 
            y2={toSvgY(jB.position.y)} 
            class="member-line-outline" 
          />
          <!-- Actual member line -->
          <line 
            x1={toSvgX(jA.position.x)} 
            y1={toSvgY(jA.position.y)} 
            x2={toSvgX(jB.position.x)} 
            y2={toSvgY(jB.position.y)} 
            class="member-line" 
          />
          
          <!-- Member Label -->
          <g transform="translate({midX}, {midY - 10})">
            <rect x="-18" y="-12" width="36" height="16" rx="3" class="label-bg" />
            <text class="member-label">{m.label}</text>
          </g>
        </g>
      {/if}
    {/each}

    <!-- 2. Draw Supports -->
    {#each supports as s}
      {@const j = joints.find(joint => getDistance(joint.position, s.position) < 1e-3)}
      {#if j}
        {@const sx = toSvgX(s.position.x)}
        {@const sy = toSvgY(s.position.y)}

        <!-- Draw Support Icons -->
        <g class="support-icon type-{s.type}">
          {#if s.type === 'pin'}
            <!-- Pinned Support Triangle -->
            <polygon points="{sx},{sy} {sx-12},{sy+16} {sx+12},{sy+16}" class="support-shape" />
            <line x1={sx-16} y1={sy+16} x2={sx+16} y2={sy+16} stroke="var(--text-primary)" stroke-width="2" />
          {:else if s.type === 'roller'}
            <!-- Roller Support (Triangle with wheels) -->
            <polygon points="{sx},{sy} {sx-10},{sy+12} {sx+10},{sy+12}" class="support-shape" />
            <circle cx={sx-6} cy={sy+15} r="3" class="roller-wheel" />
            <circle cx={sx+6} cy={sy+15} r="3" class="roller-wheel" />
            <line x1={sx-14} y1={sy+18} x2={sx+14} y2={sy+18} stroke="var(--text-primary)" stroke-width="2" />
          {/if}
        </g>
      {/if}
    {/each}

    <!-- 3. Draw Support Reaction Arrows (If Solved) -->
    {#if isSolved}
      {#each supports as s}
        {@const sx = toSvgX(s.position.x)}
        {@const sy = toSvgY(s.position.y)}

        <!-- Horizontal Reaction -->
        {#if reactions[`R_${s.label}x`] !== undefined}
          {@const val = reactions[`R_${s.label}x`]}
          {@const dir = val >= 0 ? 1 : -1}
          <g class="reaction-arrow">
            <line 
              x1={sx - 45 * dir} 
              y1={sy} 
              x2={sx - 10 * dir} 
              y2={sy} 
              stroke="var(--color-reaction, #2563eb)" 
              stroke-width="2" 
              marker-end="url(#arrow-reaction)" 
            />
            <text 
              x={sx - 50 * dir} 
              y={sy - 5} 
              class="reaction-label"
              text-anchor={dir >= 0 ? 'end' : 'start'}
            >
              R_{s.label}x = {val} N
            </text>
          </g>
        {/if}

        <!-- Vertical Reaction -->
        {#if reactions[`R_${s.label}y`] !== undefined}
          {@const val = reactions[`R_${s.label}y`]}
          {@const dir = val >= 0 ? 1 : -1}
          <g class="reaction-arrow">
            <line 
              x1={sx} 
              y1={sy + 45 * dir} 
              x2={sx} 
              y2={sy + 10 * dir} 
              stroke="var(--color-reaction, #2563eb)" 
              stroke-width="2" 
              marker-end="url(#arrow-reaction)" 
            />
            <text 
              x={sx + 10} 
              y={sy + 40 * dir} 
              class="reaction-label"
              text-anchor="start"
            >
              R_{s.label}y = {val} N
            </text>
          </g>
        {/if}
      {/each}
    {/if}

    <!-- 4. Draw External Loads -->
    {#each loads as load}
      {@const pts = getLoadArrowPoints(load)}
      {#if pts}
        <g class="load-arrow">
          <line 
            x1={pts.startX} 
            y1={pts.startY} 
            x2={pts.endX} 
            y2={pts.endY} 
            stroke="var(--color-force, #dc2626)" 
            stroke-width="3" 
            marker-end="url(#arrow-force)" 
          />
          <!-- Label at the tail of the force vector -->
          <text 
            x={pts.startX - 8 * Math.cos((load.angle * Math.PI) / 180)} 
            y={pts.startY + 12 * Math.sin((load.angle * Math.PI) / 180) + 4} 
            class="load-text"
          >
            {load.label} = {load.magnitude} N
          </text>
        </g>
      {/if}
    {/each}

    <!-- 5. Draw Joints -->
    {#each joints as j}
      {@const jx = toSvgX(j.position.x)}
      {@const jy = toSvgY(j.position.y)}
      {@const isInspecting = inspectorJointId === j.id}
      {@const guidedClass = getGuidedJointClass(j.id)}

      <g 
        class="joint-group {isInspecting ? 'selected' : ''} {guidedClass}"
        role="button"
        tabindex="0"
        aria-label="Joint {j.label} at coordinate ({j.position.x}, {j.position.y})"
        on:click={() => { inspectorJointId = j.id; selectedMemberId = null; }}
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { inspectorJointId = j.id; selectedMemberId = null; } }}
      >
        <!-- Outer circle for selection ring -->
        <circle cx={jx} cy={jy} r="10" class="joint-focus-ring" />
        <!-- Joint circle -->
        <circle cx={jx} cy={jy} r="5.5" class="joint-circle" />
        
        <!-- Joint Label -->
        <text x={jx} y={jy - 14} class="joint-label-text">{j.label}</text>
      </g>
    {/each}
  </svg>

  <!-- Inspector Overlay (for focused elements) -->
  {#if inspectorJointId}
    {@const j = joints.find(jt => jt.id === inspectorJointId)}
    {#if j}
      <div class="canvas-inspector">
        <strong>{$locale === 'id' ? 'Titik Hubung' : 'Joint'} {j.label}</strong>:
        ({j.position.x} m, {j.position.y} m)
        <button class="btn-close" on:click={() => inspectorJointId = null}>×</button>
      </div>
    {/if}
  {:else if selectedMemberId}
    {@const m = members.find(mem => mem.id === selectedMemberId)}
    {#if m}
      {@const jA = jointsMap.get(m.jointA)}
      {@const jB = jointsMap.get(m.jointB)}
      {@const force = memberForces[m.id]}
      <div class="canvas-inspector">
        <strong>{$locale === 'id' ? 'Batang' : 'Member'} {m.label}</strong>:
        {jA?.label ?? ''} ➔ {jB?.label ?? ''}
        {#if force !== undefined}
          | <strong>Gaya:</strong> {Math.abs(force)} N
          ({force > 0 ? ($locale === 'id' ? 'Tarik' : 'Tension') : force < 0 ? ($locale === 'id' ? 'Tekan' : 'Compression') : ($locale === 'id' ? 'Gaya Nol' : 'Zero-Force')})
        {:else}
          | {$locale === 'id' ? 'Belum terhitung' : 'Not solved'}
        {/if}
        <button class="btn-close" on:click={() => selectedMemberId = null}>×</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .canvas-wrapper {
    position: relative;
    width: 100%;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
  }

  .truss-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .svg-bg {
    fill: var(--bg-secondary);
  }

  /* Member lines styling */
  .member-line-outline {
    stroke: transparent;
    stroke-width: 14px;
    stroke-linecap: round;
    cursor: pointer;
  }

  .member-group:hover .member-line-outline,
  .member-group.selected .member-line-outline {
    stroke: var(--color-primary-light, rgba(37, 99, 235, 0.15));
  }

  .member-line {
    stroke: var(--text-primary);
    stroke-width: 4.5px;
    stroke-linecap: round;
    transition: stroke 0.2s, stroke-width 0.2s;
  }

  /* Tension - compression colors */
  .state-tension .member-line {
    stroke: #0d9488; /* Teal */
  }

  .state-compression .member-line {
    stroke: #ea580c; /* Orange-red */
  }

  .state-zero .member-line {
    stroke: #9ca3af; /* Gray */
    stroke-dasharray: 4, 4;
    stroke-width: 3px;
  }

  /* Guided-mode: solved member (green tint) */
  .state-guided-solved .member-line {
    stroke: #10b981;
    stroke-width: 4px;
  }

  /* Guided-mode: zero-force highlight (blue dashed) */
  .state-guided-zero-highlight .member-line {
    stroke: #3b82f6;
    stroke-dasharray: 6, 3;
    stroke-width: 3.5px;
  }

  /* Labels */
  .label-bg {
    fill: var(--bg-secondary);
    stroke: var(--border-color);
    stroke-width: 1;
  }

  .member-label {
    fill: var(--text-secondary);
    font-size: 10px;
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
  }

  /* Joints */
  .joint-group {
    cursor: pointer;
    outline: none;
  }

  .joint-circle {
    fill: var(--bg-primary);
    stroke: var(--text-primary);
    stroke-width: 2.5px;
    transition: fill 0.2s, r 0.2s;
  }

  .joint-group:hover .joint-circle,
  .joint-group.selected .joint-circle {
    fill: var(--color-primary, #2563eb);
    stroke: var(--color-primary, #2563eb);
  }

  .joint-focus-ring {
    fill: transparent;
    stroke: transparent;
    stroke-width: 1.5px;
  }

  .joint-group:focus-visible .joint-focus-ring {
    stroke: var(--color-primary, #2563eb);
    fill: rgba(37, 99, 235, 0.1);
  }

  /* Guided-mode: actively solving joint (pulsing ring) */
  .joint-group.guided-active .joint-circle {
    fill: #f59e0b;
    stroke: #f59e0b;
  }

  .joint-group.guided-active .joint-focus-ring {
    stroke: #f59e0b;
    fill: rgba(245, 158, 11, 0.15);
    animation: pulse-ring 1.5s ease-in-out infinite;
  }

  @keyframes pulse-ring {
    0%, 100% { r: 10; opacity: 1; }
    50% { r: 14; opacity: 0.6; }
  }

  /* Guided-mode: recommended next joints (subtle glow) */
  .joint-group.guided-recommended .joint-focus-ring {
    stroke: #3b82f6;
    fill: rgba(59, 130, 246, 0.1);
  }

  .joint-label-text {
    fill: var(--text-primary);
    font-size: 12px;
    font-weight: 700;
    text-anchor: middle;
    pointer-events: none;
  }

  /* Supports */
  .support-shape {
    fill: var(--bg-primary);
    stroke: var(--text-primary);
    stroke-width: 2;
  }

  .roller-wheel {
    fill: var(--bg-primary);
    stroke: var(--text-primary);
    stroke-width: 1.5;
  }

  /* Forces & Reactions labels */
  .load-text {
    fill: #dc2626;
    font-size: 11px;
    font-weight: 700;
    text-anchor: middle;
  }

  .reaction-label {
    fill: #2563eb;
    font-size: 11px;
    font-weight: 700;
  }

  /* Inspector Overlay styling */
  .canvas-inspector {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 0.85rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--text-primary);
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--text-secondary);
    line-height: 1;
    padding: 0 4px;
  }

  .btn-close:hover {
    color: var(--text-primary);
  }
</style>
