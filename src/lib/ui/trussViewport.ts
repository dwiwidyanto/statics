import type { TrussJoint } from '../domain/truss/types';

export interface TrussViewport {
  svgWidth: number;
  svgHeight: number;
  margin: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  spanX: number;
  spanY: number;
  scale: number;
  cx: number;
  cy: number;
  svgCx: number;
  svgCy: number;
}

export function createTrussViewport(joints: Pick<TrussJoint, 'position'>[], svgWidth: number, svgHeight: number, margin: number): TrussViewport {
  const minX = joints.length > 0 ? Math.min(...joints.map(j => j.position.x)) : 0;
  const maxX = joints.length > 0 ? Math.max(...joints.map(j => j.position.x)) : 10;
  const minY = joints.length > 0 ? Math.min(...joints.map(j => j.position.y)) : 0;
  const maxY = joints.length > 0 ? Math.max(...joints.map(j => j.position.y)) : 5;
  const spanX = maxX - minX > 1e-3 ? maxX - minX : 1.0;
  const spanY = maxY - minY > 1e-3 ? maxY - minY : 1.0;
  return {
    svgWidth,
    svgHeight,
    margin,
    minX,
    maxX,
    minY,
    maxY,
    spanX,
    spanY,
    scale: Math.min((svgWidth - 2 * margin) / spanX, (svgHeight - 2 * margin) / spanY),
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    svgCx: svgWidth / 2,
    svgCy: svgHeight / 2,
  };
}

export function trussToSvgX(viewport: TrussViewport, x: number): number {
  return viewport.svgCx + (x - viewport.cx) * viewport.scale;
}

export function trussToSvgY(viewport: TrussViewport, y: number): number {
  return viewport.svgCy - (y - viewport.cy) * viewport.scale;
}
