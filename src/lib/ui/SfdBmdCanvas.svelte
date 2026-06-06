<!-- src/lib/ui/SfdBmdCanvas.svelte -->
<script lang="ts">
  import type { RigidBody, Support, Load } from '../domain/models/types';
  import { 
    generateDiagramPoints, 
    evaluateInternalForces, 
    extractCriticalXPoints 
  } from '../domain/diagrams/beam-diagrams';
  import { locale, translations } from '../utils/i18n';

  export let body: RigidBody;
  export let supports: Support[];
  export let loads: Load[];
  export let reactions: Record<string, number>;
  export let type: 'SFD' | 'BMD';

  // SVG parameters
  const svgWidth = 650;
  const svgHeight = 180;
  const paddingX = 50;
  const paddingY = 30;
  const plotWidth = svgWidth - 2 * paddingX; // 550
  const plotHeight = svgHeight - 2 * paddingY; // 120
  const centerY = paddingY + plotHeight / 2; // 90

  // Reactively compute the coordinates list for the diagram
  $: points = generateDiagramPoints(body, supports, loads, reactions);

  // Compute maximum absolute value for Y scaling
  $: maxVal = (() => {
    let max = 0.0;
    for (const p of points) {
      const val = type === 'SFD' ? p.shear : p.moment;
      if (Math.abs(val) > max) {
        max = Math.abs(val);
      }
    }
    return max < 1e-3 ? 1.0 : max;
  })();

  // Scaling helpers
  $: scaleX = plotWidth / body.width;
  $: scaleY = (plotHeight / 2) / maxVal;

  function toSvgX(xMeter: number): number {
    return paddingX + xMeter * scaleX;
  }

  function toSvgY(val: number): number {
    return centerY - val * scaleY;
  }

  function toMeterX(svgX: number): number {
    const rawX = (svgX - paddingX) / scaleX;
    return Math.max(0, Math.min(body.width, rawX));
  }

  // Construct SVG paths
  $: borderPath = (() => {
    if (points.length === 0) return '';
    let d = '';
    points.forEach((p, idx) => {
      const val = type === 'SFD' ? p.shear : p.moment;
      const x = toSvgX(p.x);
      const y = toSvgY(val);
      if (idx === 0) {
        d += `M ${x} ${y}`;
      } else {
        d += ` L ${x} ${y}`;
      }
    });
    return d;
  })();

  $: fillPath = (() => {
    if (points.length === 0) return '';
    let d = '';
    // Start at baseline (x=0, y=0)
    d += `M ${toSvgX(0)} ${centerY}`;
    
    // Line to first point value
    const firstVal = type === 'SFD' ? points[0].shear : points[0].moment;
    d += ` L ${toSvgX(points[0].x)} ${toSvgY(firstVal)}`;

    // Draw path along points
    points.forEach((p) => {
      const val = type === 'SFD' ? p.shear : p.moment;
      d += ` L ${toSvgX(p.x)} ${toSvgY(val)}`;
    });

    // Line back to baseline at the end (x=L, y=0)
    d += ` L ${toSvgX(body.width)} ${centerY}`;
    d += ' Z';
    return d;
  })();

  // Identify peaks and boundaries for static text labels
  $: keyLocations = (() => {
    const crits = extractCriticalXPoints(body, supports, loads);
    const labels: { x: number; val: number; label: string; offsetUp: boolean }[] = [];
    
    crits.forEach((cx) => {
      // Evaluate left and right limits
      const evalL = evaluateInternalForces(body, supports, loads, reactions, cx, 'left');
      const evalR = evaluateInternalForces(body, supports, loads, reactions, cx, 'right');
      const valL = type === 'SFD' ? evalL.shear : evalL.moment;
      const valR = type === 'SFD' ? evalR.shear : evalR.moment;

      // Add non-zero points or boundary values
      if (Math.abs(valL) > 1e-2 || Math.abs(valR) > 1e-2 || cx === 0 || cx === body.width) {
        if (Math.abs(valL - valR) > 1e-2) {
          // Point of discontinuity (jump)
          labels.push({ 
            x: cx, 
            val: valL, 
            label: formatValue(valL), 
            offsetUp: valL >= 0 
          });
          labels.push({ 
            x: cx, 
            val: valR, 
            label: formatValue(valR), 
            offsetUp: valR >= 0 
          });
        } else {
          labels.push({ 
            x: cx, 
            val: valL, 
            label: formatValue(valL), 
            offsetUp: valL >= 0 
          });
        }
      }
    });

    // Filter labels to prevent overcrowding: keep max, min, ends, and support points
    return labels.filter((lbl, idx, self) => {
      const isEnd = lbl.x === 0 || lbl.x === body.width;
      const isMax = Math.abs(Math.abs(lbl.val) - maxVal) < 1e-2;
      const isMin = Math.abs(lbl.val) < 1e-2;
      const isSupport = supports.some(s => Math.abs(s.position.x - lbl.x) < 1e-2);
      
      // Remove duplicate x and value matches
      const isFirst = self.findIndex(t => Math.abs(t.x - lbl.x) < 1e-2 && Math.abs(t.val - lbl.val) < 1e-2) === idx;
      
      return isFirst && (isEnd || isMax || isSupport || isMin);
    });
  })();

  function formatValue(v: number): string {
    const unit = type === 'SFD' ? ' N' : ' N·m';
    if (Math.abs(v) < 1e-1) return '0';
    return v.toFixed(0) + unit;
  }

  // Hover tracker state
  let hoverX: number | null = null;
  let hoverValLeft = 0;
  let hoverValRight = 0;
  let hasDiscontinuity = false;
  let snappedMeterX = 0;

  function updateHoverFromSvgX(svgX: number) {
    const rawMeterX = toMeterX(svgX);
    let targetX = rawMeterX;

    // Snap to critical coordinates if within snapping distance (0.15 meters)
    const crits = extractCriticalXPoints(body, supports, loads);
    const snapDistance = 0.15;
    for (const cx of crits) {
      if (Math.abs(rawMeterX - cx) < snapDistance) {
        targetX = cx;
        break;
      }
    }

    // Evaluate left and right limits at targetX
    const evalL = evaluateInternalForces(body, supports, loads, reactions, targetX, 'left');
    const evalR = evaluateInternalForces(body, supports, loads, reactions, targetX, 'right');

    snappedMeterX = targetX;
    hoverX = toSvgX(targetX);
    
    if (type === 'SFD') {
      hoverValLeft = evalL.shear;
      hoverValRight = evalR.shear;
    } else {
      hoverValLeft = evalL.moment;
      hoverValRight = evalR.moment;
    }

    hasDiscontinuity = Math.abs(hoverValLeft - hoverValRight) > 1e-2;
  }

  function handleMouseMove(event: MouseEvent) {
    const svgElement = event.currentTarget as SVGElement;
    const rect = svgElement.getBoundingClientRect();
    const clientX = event.clientX - rect.left;
    
    // Scale coordinate to SVG coordinate system
    const scaleFactor = svgWidth / rect.width;
    const svgX = clientX * scaleFactor;

    // Check bounds
    if (svgX < paddingX - 10 || svgX > svgWidth - paddingX + 10) {
      hoverX = null;
      return;
    }

    updateHoverFromSvgX(svgX);
  }

  function handleMouseLeave() {
    hoverX = null;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (hoverX === null) {
      hoverX = paddingX;
    }
    const step = 5; // pixels
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const newX = Math.max(paddingX, hoverX - step);
      updateHoverFromSvgX(newX);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const newX = Math.min(svgWidth - paddingX, hoverX + step);
      updateHoverFromSvgX(newX);
    } else if (event.key === 'Escape') {
      hoverX = null;
    }
  }
</script>

<div class="diagram-wrapper">
  <div class="diagram-header">
    <span class="diagram-title">{type === 'SFD' ? translations[$locale].sfdTitle : translations[$locale].bmdTitle}</span>
    <span class="diagram-scale-text">max: {maxVal.toFixed(0)} {type === 'SFD' ? 'N' : 'N·m'}</span>
  </div>

  <!-- svelte-ignore a11y-no-noninteractive-element-interactions a11y-no-noninteractive-tabindex -->
  <svg 
    viewBox="0 0 {svgWidth} {svgHeight}" 
    class="diagram-svg"
    role="application"
    tabindex="0"
    aria-label="{type === 'SFD' ? 'Shear Force' : 'Bending Moment'} Diagram. Use left and right arrow keys to inspect values along the beam."
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
    on:keydown={handleKeyDown}
  >
    <defs>
      <!-- Area fills -->
      <linearGradient id="gradient-sfd" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.15" />
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.03" />
      </linearGradient>
      <linearGradient id="gradient-bmd" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="var(--color-reaction)" stop-opacity="0.15" />
        <stop offset="100%" stop-color="var(--color-reaction)" stop-opacity="0.03" />
      </linearGradient>
    </defs>

    <!-- Grid / Background -->
    <rect width={svgWidth} height={svgHeight} class="svg-bg" />

    <!-- 1. Shaded area under the curve -->
    <path 
      d={fillPath} 
      fill={type === 'SFD' ? 'url(#gradient-sfd)' : 'url(#gradient-bmd)'} 
      stroke="none"
    />

    <!-- 2. Zero Baseline (x-axis) -->
    <line 
      x1={paddingX} 
      y1={centerY} 
      x2={svgWidth - paddingX} 
      y2={centerY} 
      class="baseline" 
    />
    <text x={paddingX - 10} y={centerY + 4} class="axis-label" text-anchor="end">0</text>
    <text x={svgWidth - paddingX + 10} y={centerY + 4} class="axis-label" text-anchor="start">x</text>

    <!-- 3. Border Stroke representing the diagram -->
    <path 
      d={borderPath} 
      fill="none" 
      class="diagram-line {type === 'SFD' ? 'sfd' : 'bmd'}" 
    />

    <!-- 4. Key value labels -->
    {#each keyLocations as kl}
      {@const lx = toSvgX(kl.x)}
      {@const ly = toSvgY(kl.val)}
      <circle cx={lx} cy={ly} r="3" fill={type === 'SFD' ? 'var(--color-primary)' : 'var(--color-reaction)'} />
      <text 
        x={lx} 
        y={kl.offsetUp ? ly - 8 : ly + 14} 
        class="key-value-label" 
        text-anchor="middle"
      >
        {kl.label}
      </text>
    {/each}

    <!-- 5. Hover inspection tracker -->
    {#if hoverX !== null}
      <!-- Vertical tracking line -->
      <line 
        x1={hoverX} 
        y1={paddingY} 
        x2={hoverX} 
        y2={svgHeight - paddingY} 
        class="tracker-line" 
      />

      <!-- Tracker pointer circles -->
      {#if hasDiscontinuity}
        <circle cx={hoverX} cy={toSvgY(hoverValLeft)} r="4" class="tracker-dot" />
        <circle cx={hoverX} cy={toSvgY(hoverValRight)} r="4" class="tracker-dot" />
      {:else}
        <circle cx={hoverX} cy={toSvgY(hoverValLeft)} r="4" class="tracker-dot" />
      {/if}

      <!-- Tooltip Box -->
      {@const tooltipLeft = hoverX > svgWidth / 2 ? hoverX - 130 : hoverX + 10}
      <g transform="translate({tooltipLeft}, 25)">
        <rect width="120" height={hasDiscontinuity ? 52 : 36} rx="4" class="tooltip-box" />
        <text x="8" y="16" class="tooltip-title">x = {snappedMeterX.toFixed(2)} m</text>
        {#if hasDiscontinuity}
          <text x="8" y="32" class="tooltip-value">
            L: {hoverValLeft.toFixed(0)}{type === 'SFD' ? ' N' : ' N·m'}
          </text>
          <text x="8" y="46" class="tooltip-value">
            R: {hoverValRight.toFixed(0)}{type === 'SFD' ? ' N' : ' N·m'}
          </text>
        {:else}
          <text x="8" y="30" class="tooltip-value">
            {type === 'SFD' ? 'V' : 'M'} = {hoverValLeft.toFixed(0)}{type === 'SFD' ? ' N' : ' N·m'}
          </text>
        {/if}
      </g>
    {/if}
  </svg>
</div>

<style>
  .diagram-wrapper {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .diagram-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .diagram-title {
    color: var(--text-primary);
  }

  .diagram-scale-text {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  .diagram-svg {
    display: block;
    width: 100%;
    height: auto;
    background-color: var(--bg-secondary);
    overflow: visible;
  }

  .svg-bg {
    fill: var(--bg-secondary);
  }

  .baseline {
    stroke: var(--text-secondary);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
    opacity: 0.7;
  }

  .axis-label {
    font-size: 10px;
    font-weight: 600;
    fill: var(--text-secondary);
  }

  .diagram-line {
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .diagram-line.sfd {
    stroke: var(--color-primary);
  }

  .diagram-line.bmd {
    stroke: var(--color-reaction);
  }

  .key-value-label {
    font-size: 9px;
    font-weight: 700;
    fill: var(--text-primary);
    pointer-events: none;
  }

  /* Hover tracker */
  .tracker-line {
    stroke: var(--text-secondary);
    stroke-width: 1.5;
    stroke-dasharray: 2 2;
    pointer-events: none;
  }

  .tracker-dot {
    fill: var(--bg-secondary);
    stroke: var(--text-primary);
    stroke-width: 2;
    pointer-events: none;
  }

  .tooltip-box {
    fill: var(--bg-primary);
    stroke: var(--border-color);
    stroke-width: 1;
    fill-opacity: 0.95;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
  }

  .tooltip-title {
    font-size: 9px;
    font-weight: 700;
    fill: var(--text-secondary);
  }

  .tooltip-value {
    font-size: 10px;
    font-weight: bold;
    fill: var(--text-primary);
  }
</style>
