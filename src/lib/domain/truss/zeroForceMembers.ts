import type { TrussModel, TrussJoint } from './types';
import { getDistance } from '../geometry/vector2d';

export interface ZeroForceMembersResult {
  zeroForceMembers: string[];
  zeroForceExplanations: Map<string, string>;
}

/**
 * Iteratively identifies zero-force members using Rule 1 and Rule 2.
 */
export function identifyZeroForceMembers(
  truss: TrussModel,
  jointsMap: Map<string, TrussJoint>
): ZeroForceMembersResult {
  const zeroForce = new Set<string>();
  const zeroForceExplanations = new Map<string, string>();
  let foundNewZeroForce = true;

  const joints = truss.joints;
  const members = truss.members;
  const supports = truss.supports;
  const loads = truss.loads;

  while (foundNewZeroForce) {
    foundNewZeroForce = false;

    for (const joint of joints) {
      // Unloaded check: no external loads at this joint
      const jointLoads = loads.filter(l => l.jointId === joint.id && Math.abs(l.magnitude) > 1e-5);
      const isUnloaded = jointLoads.length === 0;

      // Unsupported check: no support at this joint position
      const isUnsupported = !supports.some(s => getDistance(s.position, joint.position) < 1e-3);

      if (isUnloaded && isUnsupported) {
        // Connected members that are not already marked as zero-force
        const connMembers = members.filter(m => !zeroForce.has(m.id) && (m.jointA === joint.id || m.jointB === joint.id));

        if (connMembers.length === 2) {
          // Rule 1: Two non-collinear members meeting at an unloaded, unsupported joint
          const m1 = connMembers[0];
          const m2 = connMembers[1];
          const k1 = m1.jointA === joint.id ? jointsMap.get(m1.jointB)! : jointsMap.get(m1.jointA)!;
          const k2 = m2.jointA === joint.id ? jointsMap.get(m2.jointB)! : jointsMap.get(m2.jointA)!;

          const dx1 = k1.position.x - joint.position.x;
          const dy1 = k1.position.y - joint.position.y;
          const L1 = Math.sqrt(dx1*dx1 + dy1*dy1);
          const u1 = { x: dx1 / L1, y: dy1 / L1 };

          const dx2 = k2.position.x - joint.position.x;
          const dy2 = k2.position.y - joint.position.y;
          const L2 = Math.sqrt(dx2*dx2 + dy2*dy2);
          const u2 = { x: dx2 / L2, y: dy2 / L2 };

          const cross = u1.x * u2.y - u1.y * u2.x;
          if (Math.abs(cross) > 1e-3) {
            // Not collinear
            if (!zeroForce.has(m1.id) || !zeroForce.has(m2.id)) {
              zeroForce.add(m1.id);
              zeroForce.add(m2.id);
              zeroForceExplanations.set(m1.id, `Two non-collinear members (${m1.label}, ${m2.label}) meet at unloaded, unsupported joint ${joint.label}.`);
              zeroForceExplanations.set(m2.id, `Two non-collinear members (${m1.label}, ${m2.label}) meet at unloaded, unsupported joint ${joint.label}.`);
              foundNewZeroForce = true;
            }
          }
        } else if (connMembers.length === 3) {
          // Rule 2: Three members meeting at unloaded, unsupported joint where two are collinear
          const m1 = connMembers[0];
          const m2 = connMembers[1];
          const m3 = connMembers[2];

          const k1 = m1.jointA === joint.id ? jointsMap.get(m1.jointB)! : jointsMap.get(m1.jointA)!;
          const k2 = m2.jointA === joint.id ? jointsMap.get(m2.jointB)! : jointsMap.get(m2.jointA)!;
          const k3 = m3.jointA === joint.id ? jointsMap.get(m3.jointB)! : jointsMap.get(m3.jointA)!;

          const getUnitVec = (k: TrussJoint) => {
            const dx = k.position.x - joint.position.x;
            const dy = k.position.y - joint.position.y;
            const L = Math.sqrt(dx*dx + dy*dy);
            return { x: dx / L, y: dy / L };
          };

          const u1 = getUnitVec(k1);
          const u2 = getUnitVec(k2);
          const u3 = getUnitVec(k3);

          const cross12 = u1.x * u2.y - u1.y * u2.x;
          const cross23 = u2.x * u3.y - u2.y * u3.x;
          const cross13 = u1.x * u3.y - u1.y * u3.x;

          if (Math.abs(cross12) < 1e-3) {
            // M1 and M2 are collinear, so M3 is zero-force
            if (!zeroForce.has(m3.id)) {
              zeroForce.add(m3.id);
              zeroForceExplanations.set(m3.id, `Three members meet at joint ${joint.label}, and two (${m1.label}, ${m2.label}) are collinear.`);
              foundNewZeroForce = true;
            }
          } else if (Math.abs(cross23) < 1e-3) {
            // M2 and M3 are collinear, so M1 is zero-force
            if (!zeroForce.has(m1.id)) {
              zeroForce.add(m1.id);
              zeroForceExplanations.set(m1.id, `Three members meet at joint ${joint.label}, and two (${m2.label}, ${m3.label}) are collinear.`);
              foundNewZeroForce = true;
            }
          } else if (Math.abs(cross13) < 1e-3) {
            // M1 and M3 are collinear, so M2 is zero-force
            if (!zeroForce.has(m2.id)) {
              zeroForce.add(m2.id);
              zeroForceExplanations.set(m2.id, `Three members meet at joint ${joint.label}, and two (${m1.label}, ${m3.label}) are collinear.`);
              foundNewZeroForce = true;
            }
          }
        }
      }
    }
  }

  return {
    zeroForceMembers: Array.from(zeroForce),
    zeroForceExplanations
  };
}
