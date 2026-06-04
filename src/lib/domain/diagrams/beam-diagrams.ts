import type { RigidBody, Support, Load, Reaction, Point } from '../models/types';
import { getReactionsForSupport } from '../supports/support';
import { getLoadForceComponents } from '../loads/load';
import { degToRad } from '../geometry/vector2d';

/**
 * Evaluates internal shear force (V) and bending moment (M) at a specific coordinate x
 * along the beam, looking from the left (x=0) up to x.
 * 
 * Sign convention:
 * - Shear V: Positive acts upwards on the left face of the cut (Standard CCW / Positive Upwards)
 *   V(x) = Sum of all vertical forces to the left of x.
 * - Moment M: Positive causes tension at bottom fibers (sagging, smiley face)
 *   M(x) = Sum of moments of forces/moments to the left of x about the cut at x.
 */
export function evaluateInternalForces(
  body: RigidBody,
  supports: Support[],
  loads: Load[],
  reactions: Record<string, number>,
  x: number,
  side: 'left' | 'right'
): { shear: number; moment: number } {
  let shear = 0;
  let moment = 0;

  // 1. Gather all vertical point forces (applied + reactions)
  const pointForces: { x: number; fy: number }[] = [];

  // Applied point forces
  for (const load of loads) {
    if (load.type === 'point_force') {
      const forceVec = getLoadForceComponents(load);
      pointForces.push({ x: load.position.x, fy: forceVec.y });
    } else if (load.type === 'body_weight') {
      pointForces.push({ x: load.position.x, fy: -load.magnitude });
    }
  }

  // Reaction point forces
  for (const s of supports) {
    const sReactions = getReactionsForSupport(s);
    for (const rx of sReactions) {
      if (rx.type === 'force_y') {
        const val = reactions[rx.symbol] ?? 0;
        pointForces.push({ x: rx.position.x, fy: val });
      }
    }
  }

  // 2. Gather all point moments (applied + reaction moments)
  const pointMoments: { x: number; m: number }[] = [];

  // Applied moments
  for (const load of loads) {
    if (load.type === 'applied_moment') {
      pointMoments.push({ x: load.position.x, m: load.magnitude });
    }
  }

  // Reaction moments
  for (const s of supports) {
    const sReactions = getReactionsForSupport(s);
    for (const rx of sReactions) {
      if (rx.type === 'moment') {
        const val = reactions[rx.symbol] ?? 0;
        pointMoments.push({ x: rx.position.x, m: val });
      }
    }
  }

  // 3. Process Point Forces to the left of x
  // For shear:
  // - left side: count forces strictly to the left (pf.x < x - 1e-5)
  // - right side: count forces up to and including x (pf.x <= x + 1e-5)
  for (const pf of pointForces) {
    const isToLeft = side === 'left' ? pf.x < x - 1e-5 : pf.x < x + 1e-5;
    if (isToLeft) {
      shear += pf.fy;
    }
    // Moment of point force pf about cut x:
    // Only forces strictly to the left of x generate a moment about the cut at x.
    if (pf.x < x - 1e-5) {
      moment += pf.fy * (x - pf.x);
    }
  }

  // 4. Process Point Moments to the left of x
  // - left side: count moments strictly to the left (pm.x < x - 1e-5)
  // - right side: count moments up to and including x (pm.x <= x + 1e-5)
  // Note: CCW moment on the left segment creates hogging/negative bending moment, hence subtracted.
  for (const pm of pointMoments) {
    const isToLeft = side === 'left' ? pm.x < x - 1e-5 : pm.x < x + 1e-5;
    if (isToLeft) {
      moment -= pm.m;
    }
  }

  // 5. Process Distributed Loads
  for (const load of loads) {
    if (load.type === 'distributed_load') {
      const xStart = load.startPosition.x;
      const xEnd = load.endPosition.x;
      const qStart = load.magnitudeStart * Math.sin(degToRad(load.angle));
      const qEnd = load.magnitudeEnd * Math.sin(degToRad(load.angle));

      const xb = Math.min(x, xEnd);
      const Lx = xb - xStart;

      if (Lx > 0) {
        // Linear interpolation of load intensity at boundary xb
        const qb = qStart + ((qEnd - qStart) / (xEnd - xStart)) * Lx;
        
        // Total force of the portion to the left of x
        const Fx = ((qStart + qb) / 2) * Lx;
        
        // Centroid of the portion to the left of x (relative to xStart)
        let r_c = 0.5;
        if (Math.abs(qStart + qb) > 1e-5) {
          r_c = (qStart + 2 * qb) / (3 * (qStart + qb));
        }
        const xc = xStart + r_c * Lx;

        shear += Fx;
        moment += Fx * (x - xc);
      }
    }
  }

  return { shear, moment };
}

/**
 * Extracts all unique critical x coordinates along the beam
 * where the loading, support, or boundary changes.
 */
export function extractCriticalXPoints(
  body: RigidBody,
  supports: Support[],
  loads: Load[]
): number[] {
  const points = new Set<number>();
  
  // Boundary ends
  points.add(0);
  points.add(body.width);

  // Supports
  for (const s of supports) {
    points.add(s.position.x);
  }

  // Loads
  for (const load of loads) {
    if (load.type === 'point_force' || load.type === 'applied_moment' || load.type === 'body_weight') {
      points.add(load.position.x);
    } else if (load.type === 'distributed_load') {
      points.add(load.startPosition.x);
      points.add(load.endPosition.x);
    }
  }

  // Sort and filter close values (within 1e-5)
  const sorted = Array.from(points).sort((a, b) => a - b);
  const result: number[] = [];
  
  for (const p of sorted) {
    if (p < 0 || p > body.width) continue; // safety guard
    if (result.length === 0 || Math.abs(p - result[result.length - 1]) > 1e-5) {
      result.push(p);
    }
  }

  return result;
}

/**
 * Checks if a distributed load overlaps with the open interval (x1, x2)
 */
function hasDistributedLoadInInterval(loads: Load[], x1: number, x2: number): boolean {
  const mid = (x1 + x2) / 2;
  return loads.some(load => {
    if (load.type === 'distributed_load') {
      return mid > load.startPosition.x + 1e-5 && mid < load.endPosition.x - 1e-5;
    }
    return false;
  });
}

/**
 * Generates an ordered array of points for plotting shear force and bending moment diagrams.
 * Handles jumps at point forces and moments by evaluating both left and right limits.
 */
export function generateDiagramPoints(
  body: RigidBody,
  supports: Support[],
  loads: Load[],
  reactions: Record<string, number>
): { x: number; shear: number; moment: number }[] {
  const critX = extractCriticalXPoints(body, supports, loads);
  const points: { x: number; shear: number; moment: number }[] = [];

  if (critX.length === 0) return [];

  for (let i = 0; i < critX.length - 1; i++) {
    const xLeft = critX[i];
    const xRight = critX[i + 1];

    // 1. Evaluate right side of xLeft
    const leftEval = evaluateInternalForces(body, supports, loads, reactions, xLeft, 'right');
    points.push({ x: xLeft, ...leftEval });

    // 2. If there is a distributed load in the interval, evaluate intermediate points for curves
    if (hasDistributedLoadInInterval(loads, xLeft, xRight)) {
      const numSteps = 15;
      for (let k = 1; k <= numSteps; k++) {
        const xi = xLeft + (k / (numSteps + 1)) * (xRight - xLeft);
        const evalMid = evaluateInternalForces(body, supports, loads, reactions, xi, 'right');
        points.push({ x: xi, ...evalMid });
      }
    }

    // 3. Evaluate left side of xRight
    const rightEval = evaluateInternalForces(body, supports, loads, reactions, xRight, 'left');
    points.push({ x: xRight, ...rightEval });
  }

  // Boundary condition at the very end of the beam (evaluate right limit of xL to close the diagram)
  const lastX = critX[critX.length - 1];
  const finalEval = evaluateInternalForces(body, supports, loads, reactions, lastX, 'right');
  points.push({ x: lastX, ...finalEval });

  return points;
}
