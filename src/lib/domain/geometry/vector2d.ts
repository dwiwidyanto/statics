import type { Point, Vector2D } from '../models/types';

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function polarToCartesian(magnitude: number, angleDeg: number): Vector2D {
  const rad = degToRad(angleDeg);
  return {
    x: magnitude * Math.cos(rad),
    y: magnitude * Math.sin(rad),
  };
}

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Calculates the moment (torque) of a force about a pivot point in 2D.
 * Positive moment is counter-clockwise (CCW), negative is clockwise (CW).
 * 
 * M = r_x * F_y - r_y * F_x
 * where r = applicationPoint - pivotPoint
 */
export function calculateMoment(
  force: Vector2D,
  applicationPoint: Point,
  pivotPoint: Point
): number {
  const rx = applicationPoint.x - pivotPoint.x;
  const ry = applicationPoint.y - pivotPoint.y;
  return rx * force.y - ry * force.x;
}
