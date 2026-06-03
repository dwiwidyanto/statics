import type { Support, Load, RigidBody, Reaction } from '../models/types';
import { getReactionsForSupport } from '../supports/support';
import { getLoadForceComponents } from '../loads/load';
import { solveEquilibrium } from '../solvers/equilibrium';

export interface ValidationFeedback {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  whyItMatters: string;
}

export interface CheckResult {
  reactionsCount: number;
  determinacy: 'statically_determinate' | 'statically_indeterminate' | 'unstable';
  stability: 'stable' | 'unstable';
  feedbacks: ValidationFeedback[];
}

export function checkFbdModel(
  body: RigidBody,
  supports: Support[],
  loads: Load[]
): CheckResult {
  const feedbacks: ValidationFeedback[] = [];
  
  // 1. Extract all reactions
  const reactions: Reaction[] = [];
  for (const s of supports) {
    reactions.push(...getReactionsForSupport(s));
  }
  const reactionsCount = reactions.length;

  // 2. Run solver to check mathematical determinacy and stability
  const solverResult = solveEquilibrium(body, supports, loads);
  const { determinacy, stability } = solverResult;

  // 3. Check for Duplicate Support Locations
  for (let i = 0; i < supports.length; i++) {
    for (let j = i + 1; j < supports.length; j++) {
      const s1 = supports[i];
      const s2 = supports[j];
      const dist = Math.sqrt((s1.position.x - s2.position.x) ** 2 + (s1.position.y - s2.position.y) ** 2);
      if (dist < 0.05) {
        feedbacks.push({
          type: 'error',
          title: 'Duplicated Support Location',
          message: `Supports ${s1.label} and ${s2.label} are placed at the same location.`,
          whyItMatters: 'Physical supports cannot occupy the same physical space. If you want to model a multi-action support, use a single support type like a fixed support or a pin support instead of stacking them.',
        });
      }
    }
  }

  // 4. Check for Horizontal Restraint
  const hasHorizontalRestraint = reactions.some(
    r => Math.abs(r.direction.x) > 1e-4 || r.type === 'moment'
  );
  if (!hasHorizontalRestraint && supports.length > 0) {
    feedbacks.push({
      type: 'error',
      title: 'No Horizontal Restraint',
      message: 'None of the placed supports can resist forces in the horizontal (X) direction.',
      whyItMatters: 'If any horizontal load is applied (even a tiny wind force or offset load), the body will accelerate horizontally indefinitely (Newton\'s 2nd Law). You must include at least one support that restricts horizontal motion, like a pin or fixed support, or an inclined roller.',
    });
  }

  // 5. Check for Vertical Restraint
  const hasVerticalRestraint = reactions.some(
    r => Math.abs(r.direction.y) > 1e-4 || r.type === 'moment'
  );
  if (!hasVerticalRestraint && supports.length > 0) {
    feedbacks.push({
      type: 'error',
      title: 'No Vertical Restraint',
      message: 'None of the placed supports can resist forces in the vertical (Y) direction.',
      whyItMatters: 'Gravity acts vertically. Without a vertical constraint, the body will fall. Ensure there is at least one pin, roller, or fixed support resisting vertical motion.',
    });
  }

  // 6. Check for Parallel Reactions
  if (reactionsCount >= 2) {
    // Only check forces, moments don't have direction vectors
    const forces = reactions.filter(r => r.type !== 'moment');
    if (forces.length === reactionsCount) { // all are forces
      const firstDir = forces[0].direction;
      const allParallel = forces.every(f => {
        // Dot product absolute value is close to 1
        const dot = Math.abs(f.direction.x * firstDir.x + f.direction.y * firstDir.y);
        return Math.abs(dot - 1) < 1e-4;
      });

      if (allParallel && reactionsCount >= 3) {
        feedbacks.push({
          type: 'error',
          title: 'Parallel Reaction Forces',
          message: `All ${reactionsCount} reaction forces are parallel to each other.`,
          whyItMatters: 'Even though you have 3 or more reactions, parallel reaction forces cannot resist any translation perpendicular to their direction. For example, three vertical rollers cannot prevent the beam from sliding horizontally. This represents geometric instability.',
        });
      }
    }
  }

  // 7. Check for Concurrent Lines of Action (Rotational Instability)
  const forces = reactions.filter(r => r.type !== 'moment');
  const moments = reactions.filter(r => r.type === 'moment');
  if (forces.length >= 3 && moments.length === 0) {
    // Find intersection of line of action of force 0 and 1
    const p0 = forces[0].position;
    const d0 = forces[0].direction;
    const p1 = forces[1].position;
    const d1 = forces[1].direction;

    // Check if they are parallel
    const cross = d0.x * d1.y - d0.y * d1.x;
    if (Math.abs(cross) > 1e-4) {
      // Find intersection point Q of line 0 and line 1
      // Line equation: p + t*d
      // p0.x + t0*d0.x = p1.x + t1*d1.x
      // p0.y + t0*d0.y = p1.y + t1*d1.y
      // Solving for t0:
      const t0 = ((p1.x - p0.x) * d1.y - (p1.y - p0.y) * d1.x) / cross;
      const Q = {
        x: p0.x + t0 * d0.x,
        y: p0.y + t0 * d0.y,
      };

      // Check if all other forces' lines of action pass through Q
      let allConcurrent = true;
      for (let i = 2; i < forces.length; i++) {
        const pi = forces[i].position;
        const di = forces[i].direction;
        // distance from Q to line pi + t*di
        // dist = |(Qx - pix)*diy - (Qy - piy)*dix| / |di|
        const dist = Math.abs((Q.x - pi.x) * di.y - (Q.y - pi.y) * di.x);
        if (dist > 1e-3) {
          allConcurrent = false;
          break;
        }
      }

      if (allConcurrent) {
        feedbacks.push({
          type: 'error',
          title: 'Concurrent Reaction Forces',
          message: 'All support reaction forces intersect at a single point.',
          whyItMatters: 'If all reaction forces point towards or pass through the exact same point, none of them can generate a moment about that point. This means there is zero resistance to rotation about this intersection point, making the body rotationally unstable.',
        });
      }
    }
  }

  // 8. General determinacy feedback
  if (reactionsCount === 0) {
    feedbacks.push({
      type: 'error',
      title: 'No Supports Placed',
      message: 'The rigid body has no supports. It is completely free to move in space.',
      whyItMatters: 'Without supports, there are no reaction forces to counteract external loads. The body will accelerate in the direction of the net external force.',
    });
  } else if (reactionsCount < 3) {
    feedbacks.push({
      type: 'error',
      title: 'Under-restrained (Unstable)',
      message: `You have placed ${reactionsCount} reaction constraints. A 2D rigid body requires at least 3 reactions.`,
      whyItMatters: 'A rigid body in a 2D plane has 3 degrees of freedom: horizontal translation (X), vertical translation (Y), and rotation (M). To prevent all motion, you must satisfy 3 independent boundary conditions, meaning at least 3 reactions are needed.',
    });
  } else if (reactionsCount === 3) {
    if (stability === 'stable') {
      feedbacks.push({
        type: 'success',
        title: 'Statically Determinate & Stable',
        message: 'The system has exactly 3 independent reaction constraints. It is stable and can be solved uniquely.',
        whyItMatters: 'This is the ideal case for simple structures. You have just enough supports to prevent all motions without creating internal stresses due to thermal expansion or support settlement.',
      });
    }
  } else {
    if (stability === 'stable') {
      feedbacks.push({
        type: 'warning',
        title: 'Statically Indeterminate',
        message: `The system has ${reactionsCount} reactions (more than the 3 equations of equilibrium).`,
        whyItMatters: 'Your structure is redundant. While it is stable and safe, you cannot solve for the reaction forces using statics alone (Sum Fx=0, Sum Fy=0, Sum M=0). You would need material properties and deformation equations (Mechanics of Materials) to solve this.',
      });
    }
  }

  // 9. Check for loads and body weight
  const hasLoads = loads.length > 0;
  if (!hasLoads) {
    feedbacks.push({
      type: 'info',
      title: 'No External Loads',
      message: 'The body is currently unloaded (except for any support actions).',
      whyItMatters: 'Under no external forces, all support reactions will solve to zero. Try adding a point force, distributed load, or applied moment to see how reactions change.',
    });
  }

  // Check if body weight load exists
  const hasWeightLoad = loads.some(l => l.type === 'body_weight');
  if (body.weight > 0 && !hasWeightLoad) {
    feedbacks.push({
      type: 'warning',
      title: 'Body Weight Omitted',
      message: `The body weight (${body.weight} N) is specified in the body properties but not added to the FBD diagram.`,
      whyItMatters: 'In real-world engineering, the weight of the beam or block acts at its center of gravity. Leaving it out makes the calculations incomplete, unless you are explicitly assuming a "massless" body.',
    });
  }

  return {
    reactionsCount,
    determinacy,
    stability,
    feedbacks,
  };
}
