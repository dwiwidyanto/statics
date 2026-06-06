<script lang="ts">
  import type { RigidBody, Support, Load, Reaction, Point } from '../domain/models/types';
  import { getDistributedLoadResultant } from '../domain/loads/load';
  import { locale } from '../utils/i18n';

  export let body: RigidBody;
  export let supports: Support[];
  export let loads: Load[];
  export let reactions: Reaction[] = [];
  export let momentPivot: Point | null = null;
  export let showLabels = true;
  export let showReactions = true;
  export let selectedItemId: string | null = null;
  
  // Custom event dispatcher to notify parent on element selection or canvas clicks
  export let onItemSelect: (id: string, type: 'support' | 'load') => void = () => {};
  export let onCanvasClick: (x: number, y: number) => void = () => {};

  // SVG parameters
  const svgWidth = 750;
  const svgHeight = 350;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Scaling factor: map meters to SVG pixels
  $: scale = Math.min(500 / body.width, 150 / body.height);

  // Coordinate conversion helpers
  function toSvgX(xMeter: number): number {
    return centerX + (xMeter - body.width / 2) * scale;
  }

  // In SVG, Y goes down, so we subtract from centerY
  function toSvgY(yMeter: number): number {
    return centerY - (yMeter - body.height / 2) * scale;
  }

  function toMeterX(svgX: number): number {
    const rawX = (svgX - centerX) / scale + body.width / 2;
    // Snap to 1 decimal place (e.g. 0.1m resolution)
    return Math.max(0, Math.min(body.width, Math.round(rawX * 10) / 10));
  }

  function toMeterY(svgY: number): number {
    const rawY = (centerY - svgY) / scale + body.height / 2;
    return Math.max(0, Math.min(body.height, Math.round(rawY * 10) / 10));
  }

  function handleSvgClick(event: MouseEvent) {
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale SVG coordinate back to natural coordinates
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    
    const meterX = toMeterX(x * scaleX);
    const meterY = toMeterY(y * scaleY);
    
    onCanvasClick(meterX, meterY);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<div class="canvas-wrapper">
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <svg 
    viewBox="0 0 {svgWidth} {svgHeight}" 
    class="fbd-svg"
    role="application"
    aria-label="Interactive Free-body Diagram Canvas"
    on:click={handleSvgClick}
    on:keydown={(e) => { if (e.key === 'Escape') onCanvasClick(0, 0); }}
  >
    <defs>
      <!-- Force Arrowhead Marker -->
      <marker id="arrow-force" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-force)" />
      </marker>
      <!-- Reaction Arrowhead Marker -->
      <marker id="arrow-reaction" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-reaction)" />
      </marker>
      
      <!-- Hatch pattern for walls / fixed supports -->
      <pattern id="hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="10" stroke="var(--border-color)" stroke-width="2" />
      </pattern>
    </defs>

    <!-- Grid / Background -->
    <rect width={svgWidth} height={svgHeight} class="svg-bg" />
    
    <!-- Coordinate Origin Indicator -->
    <g transform="translate(40, {svgHeight - 40})">
      <line x1="0" y1="0" x2="30" y2="0" stroke="var(--text-secondary)" stroke-width="1.5" marker-end="url(#arrow-force)" />
      <line x1="0" y1="0" x2="0" y2="-30" stroke="var(--text-secondary)" stroke-width="1.5" marker-end="url(#arrow-force)" />
      <text x="35" y="4" class="origin-label">x</text>
      <text x="-4" y="-35" class="origin-label">y</text>
      <circle cx="0" cy="0" r="3" fill="var(--text-primary)" />
    </g>

    <!-- Scale Guide -->
    <g transform="translate({svgWidth - 120}, 30)">
      <line x1="0" y1="0" x2="80" y2="0" stroke="var(--text-secondary)" stroke-width="1.5" />
      <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--text-secondary)" stroke-width="1.5" />
      <line x1="80" y1="-4" x2="80" y2="4" stroke="var(--text-secondary)" stroke-width="1.5" />
      <text x="40" y="-8" text-anchor="middle" class="scale-label">{(80 / scale).toFixed(1)} m</text>
    </g>

    <!-- 1. The Rigid Body -->
    <g class="body-group">
      <rect
        x={toSvgX(0)}
        y={toSvgY(body.height)}
        width={body.width * scale}
        height={body.height * scale}
        rx={body.type === 'beam' ? 2 : 4}
        class="rigid-body {body.type}"
      />
      <!-- Body Center Line for Beam -->
      {#if body.type === 'beam'}
        <line
          x1={toSvgX(0)}
          y1={toSvgY(body.height / 2)}
          x2={toSvgX(body.width)}
          y2={toSvgY(body.height / 2)}
          stroke="var(--bg-primary)"
          stroke-dasharray="4,4"
          stroke-width="1"
          opacity="0.5"
        />
      {/if}
      
      <!-- Label dimensions -->
      {#if showLabels}
        <text 
          x={toSvgX(body.width / 2)} 
          y={toSvgY(body.height / 2) + 4} 
          class="body-label"
          text-anchor="middle"
        >
          {$locale === 'id' 
            ? (body.type === 'beam' ? 'BALOK' : 'PLAT') 
            : body.type.toUpperCase()
          } ({body.width}m × {body.height}m)
        </text>
      {/if}
    </g>

    <!-- 2. Supports -->
    {#each supports as support}
      {@const sx = toSvgX(support.position.x)}
      {@const sy = toSvgY(support.position.y)}
      <g 
        class="support-node cursor-pointer"
        role="button"
        tabindex="0"
        aria-label="Support {support.label} ({support.type})"
        on:click|stopPropagation={() => onItemSelect(support.id, 'support')}
        on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') onItemSelect(support.id, 'support'); }}
        opacity={selectedItemId && selectedItemId !== support.id ? 0.6 : 1.0}
      >
        {#if support.type === 'pin'}
          <!-- Pin: Triangle pointing to joint -->
          <polygon 
            points="{sx},{sy} {sx-12},{sy+18} {sx+12},{sy+18}" 
            class="support-shape pin {selectedItemId === support.id ? 'selected' : ''}" 
          />
          <line x1={sx-16} y1={sy+18} x2={sx+16} y2={sy+18} stroke="var(--text-primary)" stroke-width="2" />
          <!-- ground hatch -->
          {#each [-12, -6, 0, 6, 12] as offset}
            <line x1={sx+offset} y1={sy+18} x2={sx+offset-4} y2={sy+23} stroke="var(--text-secondary)" stroke-width="1" />
          {/each}
        
        {:else if support.type === 'roller'}
          <!-- Roller: Triangle with wheels underneath -->
          {@const rad = support.angle * Math.PI / 180}
          <polygon 
            points="{sx},{sy} {sx-10},{sy+12} {sx+10},{sy+12}" 
            class="support-shape roller {selectedItemId === support.id ? 'selected' : ''}" 
          />
          <circle cx={sx-5} cy={sy+16} r="3" class="support-wheel" />
          <circle cx={sx+5} cy={sy+16} r="3" class="support-wheel" />
          <line x1={sx-16} y1={sy+20} x2={sx+16} y2={sy+20} stroke="var(--text-primary)" stroke-width="1.5" />
        
        {:else if support.type === 'fixed'}
          <!-- Fixed wall hatching. Left side or right side of body -->
          {@const isRight = support.position.x > body.width / 2}
          {#if isRight}
            <line x1={sx} y1={sy-20} x2={sx} y2={sy+20} stroke="var(--text-primary)" stroke-width="3" />
            {#each [-15, -5, 5, 15] as offset}
              <line x1={sx} y1={sy+offset} x2={sx+6} y2={sy+offset-6} stroke="var(--text-secondary)" stroke-width="1.5" />
            {/each}
          {:else}
            <line x1={sx} y1={sy-20} x2={sx} y2={sy+20} stroke="var(--text-primary)" stroke-width="3" />
            {#each [-15, -5, 5, 15] as offset}
              <line x1={sx} y1={sy+offset} x2={sx-6} y2={sy+offset-6} stroke="var(--text-secondary)" stroke-width="1.5" />
            {/each}
          {/if}
        {/if}
        
        <!-- Label of Support (e.g. A, B) -->
        {#if showLabels}
          <text 
            x={support.type === 'fixed' ? (support.position.x > body.width / 2 ? sx + 15 : sx - 15) : sx} 
            y={support.type === 'fixed' ? sy + 5 : sy + 32} 
            class="support-label"
            text-anchor="middle"
          >
            {support.label}
          </text>
        {/if}
      </g>
    {/each}

    <!-- 3. Applied Loads -->
    {#each loads as load}
      <g 
        class="load-node cursor-pointer"
        role="button"
        tabindex="0"
        aria-label="Load {load.label} ({load.type})"
        on:click|stopPropagation={() => onItemSelect(load.id, 'load')}
        on:keydown|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') onItemSelect(load.id, 'load'); }}
        opacity={selectedItemId && selectedItemId !== load.id ? 0.6 : 1.0}
      >
        {#if load.type === 'point_force'}
          {@const sx = toSvgX(load.position.x)}
          {@const sy = toSvgY(load.position.y)}
          
          <!-- Direction angles (angle is CCW from +x axis) -->
          <!-- We draw arrow pointing TO application point (pushing force) -->
          {@const len = 45}
          {@const rad = load.angle * Math.PI / 180}
          {@const startX = sx - len * Math.cos(rad)}
          {@const startY = sy + len * Math.sin(rad)}

          <line 
            x1={startX} 
            y1={startY} 
            x2={sx} 
            y2={sy} 
            class="load-line {selectedItemId === load.id ? 'selected' : ''}"
            marker-end="url(#arrow-force)" 
          />
          
          {#if showLabels}
            <text 
              x={startX - 10 * Math.cos(rad)} 
              y={startY + 10 * Math.sin(rad) + 4} 
              class="load-text"
              text-anchor="middle"
            >
              {load.label} ({load.magnitude}N)
            </text>
          {/if}
        {/if}

        {#if load.type === 'body_weight'}
          <!-- Body Weight: Centroid, straight down -->
          {@const sx = toSvgX(load.position.x)}
          {@const sy = toSvgY(load.position.y)}
          <line 
            x1={sx} 
            y1={sy} 
            x2={sx} 
            y2={sy + 45} 
            class="load-line weight"
            marker-end="url(#arrow-force)" 
          />
          <text x={sx + 8} y={sy + 25} class="load-text weight">
            W = {load.magnitude}N
          </text>
          <circle cx={sx} cy={sy} r="4" fill="var(--color-force)" />
        {/if}

        {#if load.type === 'applied_moment'}
          <!-- Moment: circular arc arrow -->
          {@const sx = toSvgX(load.position.x)}
          {@const sy = toSvgY(load.position.y)}
          {@const isPositive = load.magnitude >= 0}
          
          <path
            d={isPositive
              ? `M ${sx + 15} ${sy + 5} A 16 16 0 1 0 ${sx - 5} ${sy - 15}`
              : `M ${sx - 15} ${sy + 5} A 16 16 0 1 1 ${sx + 5} ${sy - 15}`
            }
            fill="none"
            class="load-moment-arc {selectedItemId === load.id ? 'selected' : ''}"
            marker-end="url(#arrow-force)"
          />
          
          <circle cx={sx} cy={sy} r="3" fill="var(--color-force)" opacity="0.8" />
          {#if showLabels}
            <text x={sx} y={sy - 22} class="load-text" text-anchor="middle">
              {load.label} ({Math.abs(load.magnitude)} N·m {isPositive ? '↺' : '↻'})
            </text>
          {/if}
        {/if}

        {#if load.type === 'distributed_load'}
          {@const x1 = toSvgX(load.startPosition.x)}
          {@const y1 = toSvgY(load.startPosition.y)}
          {@const x2 = toSvgX(load.endPosition.x)}
          {@const y2 = toSvgY(load.endPosition.y)}
          
          {@const distHeight = 25}
          {@const topY1 = y1 - distHeight}
          {@const topY2 = y2 - distHeight}
          
          <line x1={x1} y1={topY1} x2={x2} y2={topY2} class="dist-load-top" />
          <path d="M {x1} {y1} L {x1} {topY1} L {x2} {topY2} L {x2} {y2} Z" class="dist-load-fill" />

          {@const steps = Math.max(3, Math.floor(Math.abs(x2 - x1) / 15))}
          {#each Array(steps + 1) as _, i}
            {@const t = i / steps}
            {@const currX = x1 + t * (x2 - x1)}
            {@const currY = y1 + t * (y2 - y1)}
            {@const currTopY = topY1 + t * (topY2 - topY1)}
            <line 
              x1={currX} 
              y1={currTopY} 
              x2={currX} 
              y2={currY} 
              class="dist-load-arrow"
              marker-end="url(#arrow-force)" 
            />
          {/each}

          {#if showLabels}
            <text x={(x1 + x2) / 2} y={(topY1 + topY2) / 2 - 6} class="load-text text-center" text-anchor="middle">
              {load.label}: {load.magnitudeStart === load.magnitudeEnd ? `${load.magnitudeStart} N/m` : `${load.magnitudeStart} to ${load.magnitudeEnd} N/m`}
            </text>
          {/if}
        {/if}
      </g>
    {/each}

    <!-- 4. Solved Support Reactions -->
    {#if showReactions && reactions.length > 0}
      {#each reactions as reaction}
        {@const sx = toSvgX(reaction.position.x)}
        {@const sy = toSvgY(reaction.position.y)}
        {@const value = reaction.magnitude}
        
        {#if reaction.type === 'moment'}
          <!-- Reaction Moment: curved blue arrow -->
          {@const isPositive = value >= 0}
          {#if Math.abs(value) > 1e-2}
            <path
              d={isPositive
                ? `M ${sx + 24} ${sy + 8} A 25 25 0 1 0 ${sx - 8} ${sy - 24}`
                : `M ${sx - 24} ${sy + 8} A 25 25 0 1 1 ${sx + 8} ${sy - 24}`
              }
              fill="none"
              class="reaction-moment-arc"
              marker-end="url(#arrow-reaction)"
            />
            <text x={sx} y={sy - 32} class="reaction-text" text-anchor="middle">
              {#if reaction.symbol.includes('_')}
                {@const parts = reaction.symbol.split('_')}
                {parts[0]}<tspan font-size="8px" dy="3">{parts[1]}</tspan><tspan dy="-3" font-size="11px"> = {value.toFixed(1)} N·m</tspan>
              {:else}
                {reaction.symbol} = {value.toFixed(1)} N·m
              {/if}
            </text>
          {/if}
        {:else}
          <!-- Reaction Force: arrow pointing in direction of solved value -->
          {@const forceMag = Math.abs(value)}
          {#if forceMag > 1e-2}
            {@const actualDirX = reaction.direction.x * Math.sign(value)}
            {@const actualDirY = reaction.direction.y * Math.sign(value)}
            {@const arrowLen = 50}
            
            <line 
              x1={sx} 
              y1={sy} 
              x2={sx + arrowLen * actualDirX} 
              y2={sy - arrowLen * actualDirY} 
              class="reaction-line"
              marker-end="url(#arrow-reaction)" 
            />
            <text 
              x={sx + (arrowLen + 15) * actualDirX} 
              y={sy - (arrowLen + 15) * actualDirY + 4} 
              class="reaction-text"
              text-anchor={actualDirX > 0.1 ? 'start' : (actualDirX < -0.1 ? 'end' : 'middle')}
            >
              {#if reaction.symbol.includes('_')}
                {@const parts = reaction.symbol.split('_')}
                {parts[0]}<tspan font-size="8px" dy="3">{parts[1]}</tspan><tspan dy="-3" font-size="11px"> = {value.toFixed(1)} N</tspan>
              {:else}
                {reaction.symbol} = {value.toFixed(1)} N
              {/if}
            </text>
          {:else}
            <!-- Zero reaction force: dotted arrow -->
            <line
              x1={sx}
              y1={sy}
              x2={sx + 30 * reaction.direction.x}
              y2={sy - 30 * reaction.direction.y}
              stroke="var(--text-secondary)"
              stroke-width="1.5"
              stroke-dasharray="3,3"
              opacity="0.4"
            />
            <text
              x={sx + 35 * reaction.direction.x}
              y={sy - 35 * reaction.direction.y + 4}
              class="reaction-text-zero"
              text-anchor="middle"
            >
              {#if reaction.symbol.includes('_')}
                {@const parts = reaction.symbol.split('_')}
                {parts[0]}<tspan font-size="7px" dy="2.5">{parts[1]}</tspan><tspan dy="-2.5" font-size="10px"> = 0</tspan>
              {:else}
                {reaction.symbol} = 0
              {/if}
            </text>
          {/if}
        {/if}
      {/each}
    {/if}

    <!-- Pivot Point Indicator -->
    {#if momentPivot}
      <g transform="translate({toSvgX(momentPivot.x)}, {toSvgY(momentPivot.y)})">
        <circle cx="0" cy="0" r="5" fill="none" stroke="var(--color-primary)" stroke-width="2" />
        <circle cx="0" cy="0" r="2" fill="var(--color-primary)" />
        <text x="8" y="-4" class="pivot-label">{$locale === 'id' ? 'Pusat (ΣM = 0)' : 'Pivot (ΣM = 0)'}</text>
      </g>
    {/if}
  </svg>
</div>

<style>
  .canvas-wrapper {
    position: relative;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--bg-secondary);
  }

  .fbd-svg {
    display: block;
    width: 100%;
    height: auto;
    background-color: var(--bg-secondary);
    user-select: none;
  }

  .svg-bg {
    fill: var(--bg-secondary);
  }

  .cursor-pointer {
    cursor: pointer;
  }

  /* Rigid body styles */
  .rigid-body {
    fill: #cbd5e1;
    stroke: #475569;
    stroke-width: 2.5;
    transition: all 0.2s;
  }
  
  :global(html.dark) .rigid-body {
    fill: #334155;
    stroke: #94a3b8;
  }

  .rigid-body.beam {
    fill: #cbd5e1;
  }
  
  .rigid-body.block {
    fill: #cbd5e1;
  }

  .body-label {
    font-size: 11px;
    font-weight: 600;
    fill: #475569;
    pointer-events: none;
  }
  :global(html.dark) .body-label {
    fill: #94a3b8;
  }

  /* Support styles */
  .support-shape {
    fill: #64748b;
    stroke: #1e293b;
    stroke-width: 1.5;
    transition: fill 0.2s;
  }
  .support-shape.selected {
    stroke: var(--color-primary);
    stroke-width: 2.5;
  }
  .support-wheel {
    fill: #f8fafc;
    stroke: #1e293b;
    stroke-width: 1.5;
  }
  .support-label {
    font-size: 12px;
    font-weight: 700;
    fill: var(--text-primary);
  }

  /* Load styles */
  .load-line {
    stroke: var(--color-force);
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-width 0.2s;
  }
  .load-line.selected {
    stroke-width: 4.5;
    filter: drop-shadow(0px 0px 2px rgba(220, 38, 38, 0.4));
  }
  .load-line.weight {
    stroke: #059669;
  }
  
  .load-text {
    font-size: 11px;
    font-weight: 700;
    fill: var(--color-force);
    background-color: var(--bg-secondary);
  }
  .load-text.weight {
    fill: #059669;
  }

  .load-moment-arc {
    stroke: var(--color-force);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-dasharray: 0;
  }
  .load-moment-arc.selected {
    stroke-width: 4;
  }

  /* Distributed load visual */
  .dist-load-top {
    stroke: var(--color-force);
    stroke-width: 2;
  }
  .dist-load-fill {
    fill: var(--color-force);
    fill-opacity: 0.1;
  }
  .dist-load-arrow {
    stroke: var(--color-force);
    stroke-width: 1.5;
  }

  /* Reaction styles */
  .reaction-line {
    stroke: var(--color-reaction);
    stroke-width: 3.5;
    stroke-dasharray: none;
    stroke-linecap: round;
  }
  .reaction-moment-arc {
    stroke: var(--color-reaction);
    stroke-width: 2.5;
    fill: none;
  }
  .reaction-text {
    font-size: 11px;
    font-weight: 800;
    fill: var(--color-reaction);
  }
  .reaction-text-zero {
    font-size: 10px;
    font-weight: 500;
    fill: var(--text-secondary);
    opacity: 0.7;
  }

  .origin-label {
    font-size: 10px;
    font-family: monospace;
    fill: var(--text-secondary);
  }
  
  .scale-label {
    font-size: 10px;
    font-weight: 600;
    fill: var(--text-secondary);
  }

  .pivot-label {
    font-size: 10px;
    font-weight: bold;
    fill: var(--color-primary);
  }
</style>
