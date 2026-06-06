import type { Point } from '../models/types';

/**
 * Calculates the unit vector pointing from one point to another,
 * and returns the distance between them.
 */
export function getUnitVector(from: Point, to: Point): { x: number; y: number; length: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 1e-9) {
    return { x: 0, y: 0, length: 0 };
  }
  return { x: dx / length, y: dy / length, length };
}
