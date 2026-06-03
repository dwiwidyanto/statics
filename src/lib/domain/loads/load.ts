import type { Load, Point, Vector2D } from '../models/types';
import { polarToCartesian } from '../geometry/vector2d';

/**
 * Returns the force components (Fx, Fy) of a load.
 * For moments, returns (0, 0) as it represents a torque, not a linear force.
 * For distributed loads, returns the total force components.
 */
export function getLoadForceComponents(load: Load): Vector2D {
  switch (load.type) {
    case 'point_force':
      return polarToCartesian(load.magnitude, load.angle);
    case 'body_weight':
      // Weight points straight down (270 degrees)
      return { x: 0, y: -load.magnitude };
    case 'applied_moment':
      return { x: 0, y: 0 };
    case 'distributed_load': {
      const resultant = getDistributedLoadResultant(load);
      return polarToCartesian(resultant.magnitude, resultant.angle);
    }
    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Calculates the equivalent point force (magnitude, angle, and centroid position)
 * for a distributed load.
 */
export function getDistributedLoadResultant(load: {
  magnitudeStart: number;
  magnitudeEnd: number;
  startPosition: Point;
  endPosition: Point;
  angle: number;
}): { magnitude: number; angle: number; position: Point } {
  const { magnitudeStart: w1, magnitudeEnd: w2, startPosition: p1, endPosition: p2, angle } = load;

  // Length of the distributed load
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return { magnitude: 0, angle, position: p1 };
  }

  // Total force (area of the trapezoid)
  const magnitude = ((w1 + w2) / 2) * length;

  // Centroid location relative to start position
  let centroidRatio = 0.5;
  if (w1 + w2 > 0) {
    centroidRatio = (w1 + 2 * w2) / (3 * (w1 + w2));
  }

  const position: Point = {
    x: p1.x + dx * centroidRatio,
    y: p1.y + dy * centroidRatio,
  };

  return {
    magnitude,
    angle,
    position,
  };
}
