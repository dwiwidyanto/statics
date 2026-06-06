import type { TrussModel, TrussJoint } from './types';
import type { Support, Reaction } from '../models/types';
import { getReactionsForSupport } from '../supports/support';
import { getDistance } from '../geometry/vector2d';
import { getUnitVector } from './geometry';

/**
 * Validates joint equilibrium (ΣFx = 0, ΣFy = 0) at all nodes of the solved truss.
 * Pushes warnings to the messages array if residues exceed 0.5 N.
 */
export function checkJointEquilibrium(
  truss: TrussModel,
  jointsMap: Map<string, TrussJoint>,
  reactions: Record<string, number>,
  rxValues: number[],
  allReactionsList: Reaction[],
  memberForces: Record<string, number>,
  messages: string[]
): void {
  const joints = truss.joints;
  const members = truss.members;
  const supports = truss.supports;
  const loads = truss.loads;

  for (const joint of joints) {
    const conn = members.filter(m => m.jointA === joint.id || m.jointB === joint.id);
    let fxSum = 0;
    let fySum = 0;

    // External loads
    const jointLoads = loads.filter(l => l.jointId === joint.id);
    for (const load of jointLoads) {
      const rad = (load.angle * Math.PI) / 180;
      fxSum += load.magnitude * Math.cos(rad);
      fySum += load.magnitude * Math.sin(rad);
    }

    // Reactions
    const jointSupports = supports.filter(s => getDistance(s.position, joint.position) < 1e-3);
    for (const s of jointSupports) {
      const rxList = getReactionsForSupport(s).filter(r => r.type !== 'moment');
      for (const rx of rxList) {
        const rxIdx = allReactionsList.findIndex(r => r.symbol === rx.symbol);
        if (rxIdx !== -1) {
          const val = rxValues[rxIdx];
          fxSum += val * rx.direction.x;
          fySum += val * rx.direction.y;
        }
      }
    }

    // Members
    for (const m of conn) {
      if (m.id in memberForces) {
        const otherId = m.jointA === joint.id ? m.jointB : m.jointA;
        const otherJoint = jointsMap.get(otherId)!;
        
        const uv = getUnitVector(joint.position, otherJoint.position);
        fxSum += memberForces[m.id] * uv.x;
        fySum += memberForces[m.id] * uv.y;
      }
    }

    if (Math.abs(fxSum) > 0.5 || Math.abs(fySum) > 0.5) {
      messages.push(`Warning: Joint ${joint.label} equilibrium check failed (Fx sum: ${fxSum.toFixed(2)}, Fy sum: ${fySum.toFixed(2)}).`);
    }
  }
}
