export interface FbdViewport {
  svgWidth: number;
  svgHeight: number;
  centerX: number;
  centerY: number;
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
}

export function createFbdViewport(args: {
  svgWidth: number;
  svgHeight: number;
  bodyWidth: number;
  bodyHeight: number;
}): FbdViewport {
  return {
    ...args,
    centerX: args.svgWidth / 2,
    centerY: args.svgHeight / 2,
    scale: Math.min(500 / args.bodyWidth, 150 / args.bodyHeight)
  };
}

export function toSvgX(viewport: FbdViewport, xMeter: number): number {
  return viewport.centerX + (xMeter - viewport.bodyWidth / 2) * viewport.scale;
}

export function toSvgY(viewport: FbdViewport, yMeter: number): number {
  return viewport.centerY - (yMeter - viewport.bodyHeight / 2) * viewport.scale;
}

export function toMeterX(viewport: FbdViewport, svgX: number): number {
  const rawX = (svgX - viewport.centerX) / viewport.scale + viewport.bodyWidth / 2;
  return Math.max(0, Math.min(viewport.bodyWidth, Math.round(rawX * 10) / 10));
}

export function toMeterY(viewport: FbdViewport, svgY: number): number {
  const rawY = (viewport.centerY - svgY) / viewport.scale + viewport.bodyHeight / 2;
  return Math.max(0, Math.min(viewport.bodyHeight, Math.round(rawY * 10) / 10));
}
