import type { TrussModel, TrussJoint, JointEquationStep } from './types';
import type { Support, Reaction } from '../models/types';
import { getReactionsForSupport } from '../supports/support';
import { getDistance } from '../geometry/vector2d';
import { getUnitVector } from './geometry';

export interface JointsSolveResult {
  isSolved: boolean;
  memberForces: Record<string, number>;
  jointEquations: JointEquationStep[];
  messages: string[];
}

/**
 * Solve member forces by marching joint-by-joint where at most 2 unknowns exist.
 */
export function solveMethodOfJoints(
  truss: TrussModel,
  jointsMap: Map<string, TrussJoint>,
  reactions: Record<string, number>,
  rxValues: number[],
  allReactionsList: Reaction[],
  zeroForceMembers: string[]
): JointsSolveResult {
  const messages: string[] = [];
  const memberForces: Record<string, number> = {};
  const jointEquations: JointEquationStep[] = [];

  const joints = truss.joints;
  const members = truss.members;
  const supports = truss.supports;
  const loads = truss.loads;

  // Pre-fill zero force members
  for (const mId of zeroForceMembers) {
    memberForces[mId] = 0;
  }

  const solvedMembers = new Set<string>(zeroForceMembers);
  let solvedSomething = true;

  while (solvedMembers.size < members.length && solvedSomething) {
    solvedSomething = false;

    for (const joint of joints) {
      const conn = members.filter(m => m.jointA === joint.id || m.jointB === joint.id);
      const unsolvedConn = conn.filter(m => !solvedMembers.has(m.id));

      if (unsolvedConn.length > 0 && unsolvedConn.length <= 2) {
        // Collect known forces acting at this joint
        // Loads
        const jointLoads = loads.filter(l => l.jointId === joint.id);
        let F_known_x = 0;
        let F_known_y = 0;

        const loadTermsX: string[] = [];
        const loadTermsY: string[] = [];

        for (const load of jointLoads) {
          const rad = (load.angle * Math.PI) / 180;
          const fx = load.magnitude * Math.cos(rad);
          const fy = load.magnitude * Math.sin(rad);
          F_known_x += fx;
          F_known_y += fy;

          if (Math.abs(fx) > 1e-3) loadTermsX.push(`${fx >= 0 ? '+' : ''}${fx.toFixed(0)} (${load.label})`);
          if (Math.abs(fy) > 1e-3) loadTermsY.push(`${fy >= 0 ? '+' : ''}${fy.toFixed(0)} (${load.label})`);
        }

        // Reactions
        const jointSupports = supports.filter(s => getDistance(s.position, joint.position) < 1e-3);
        for (const s of jointSupports) {
          const rxList = getReactionsForSupport(s).filter(r => r.type !== 'moment');
          for (const rx of rxList) {
            const rxIdx = allReactionsList.findIndex(r => r.symbol === rx.symbol);
            if (rxIdx !== -1) {
              const val = rxValues[rxIdx];
              const fx = val * rx.direction.x;
              const fy = val * rx.direction.y;
              F_known_x += fx;
              F_known_y += fy;

              if (Math.abs(fx) > 1e-3) loadTermsX.push(`${fx >= 0 ? '+' : ''}${fx.toFixed(0)} (${rx.symbol})`);
              if (Math.abs(fy) > 1e-3) loadTermsY.push(`${fy >= 0 ? '+' : ''}${fy.toFixed(0)} (${rx.symbol})`);
            }
          }
        }

        // Solved members
        const solvedConn = conn.filter(m => solvedMembers.has(m.id));
        const memberTermsX: string[] = [];
        const memberTermsY: string[] = [];

        for (const m of solvedConn) {
          const otherId = m.jointA === joint.id ? m.jointB : m.jointA;
          const otherJoint = jointsMap.get(otherId)!;
          
          const uv = getUnitVector(joint.position, otherJoint.position);
          const forceVal = memberForces[m.id];
          F_known_x += forceVal * uv.x;
          F_known_y += forceVal * uv.y;

          if (Math.abs(uv.x) > 1e-3) {
            memberTermsX.push(`${uv.x * forceVal >= 0 ? '+' : ''}${(uv.x * forceVal).toFixed(0)} (${m.label})`);
          }
          if (Math.abs(uv.y) > 1e-3) {
            memberTermsY.push(`${uv.y * forceVal >= 0 ? '+' : ''}${(uv.y * forceVal).toFixed(0)} (${m.label})`);
          }
        }

        if (unsolvedConn.length === 1) {
          // 1 unknown member force
          const m1 = unsolvedConn[0];
          const otherId = m1.jointA === joint.id ? m1.jointB : m1.jointA;
          const otherJoint = jointsMap.get(otherId)!;
          
          const uv = getUnitVector(joint.position, otherJoint.position);

          let forceVal = 0;
          if (Math.abs(uv.x) > Math.abs(uv.y)) {
            forceVal = -F_known_x / uv.x;
          } else {
            forceVal = -F_known_y / uv.y;
          }

          memberForces[m1.id] = Math.round(forceVal * 100) / 100;
          solvedMembers.add(m1.id);
          solvedSomething = true;

          const eqX = `${m1.label} * (${uv.x.toFixed(2)}) ${memberTermsX.join(' ')} ${loadTermsX.join(' ')} = 0`;
          const eqY = `${m1.label} * (${uv.y.toFixed(2)}) ${memberTermsY.join(' ')} ${loadTermsY.join(' ')} = 0`;
          
          jointEquations.push({
            jointLabel: joint.label,
            eqX,
            eqY,
            solved: { [m1.label]: memberForces[m1.id] },
            explanation: `Solved joint ${joint.label} (1 unknown): ${m1.label} = ${memberForces[m1.id]} N (${memberForces[m1.id] >= 0 ? 'Tension' : 'Compression'}).`
          });

        } else if (unsolvedConn.length === 2) {
          // 2 unknown member forces
          const m1 = unsolvedConn[0];
          const m2 = unsolvedConn[1];

          const o1 = m1.jointA === joint.id ? m1.jointB : m1.jointA;
          const o2 = m2.jointA === joint.id ? m2.jointB : m2.jointA;

          const j1 = jointsMap.get(o1)!;
          const j2 = jointsMap.get(o2)!;

          const uv1 = getUnitVector(joint.position, j1.position);
          const uv2 = getUnitVector(joint.position, j2.position);

          const a = uv1.x;
          const b = uv2.x;
          const c = uv1.y;
          const d = uv2.y;
          const e = -F_known_x;
          const f = -F_known_y;

          const D = a * d - b * c;
          if (Math.abs(D) < 1e-5) {
            messages.push(`Collinear members ${m1.label} and ${m2.label} at joint ${joint.label} prevent solving.`);
            return { isSolved: false, memberForces, jointEquations, messages };
          }

          const f1 = (e * d - b * f) / D;
          const f2 = (a * f - e * c) / D;

          memberForces[m1.id] = Math.round(f1 * 100) / 100;
          memberForces[m2.id] = Math.round(f2 * 100) / 100;

          solvedMembers.add(m1.id);
          solvedMembers.add(m2.id);
          solvedSomething = true;

          const eqX = `${m1.label} * (${uv1.x.toFixed(2)}) + ${m2.label} * (${uv2.x.toFixed(2)}) ${memberTermsX.join(' ')} ${loadTermsX.join(' ')} = 0`;
          const eqY = `${m1.label} * (${uv1.y.toFixed(2)}) + ${m2.label} * (${uv2.y.toFixed(2)}) ${memberTermsY.join(' ')} ${loadTermsY.join(' ')} = 0`;

          jointEquations.push({
            jointLabel: joint.label,
            eqX,
            eqY,
            solved: { [m1.label]: memberForces[m1.id], [m2.label]: memberForces[m2.id] },
            explanation: `Solved joint ${joint.label} (2 unknowns): ${m1.label} = ${memberForces[m1.id]} N, ${m2.label} = ${memberForces[m2.id]} N.`
          });
        }
      }
    }
  }

  const isSolved = solvedMembers.size === members.length;
  if (!isSolved) {
    const jCount = joints.length;
    const mCount = members.length;
    const rCount = allReactionsList.length;
    if (mCount + rCount === 2 * jCount) {
      messages.push(
        'The truss is statically determinate but cannot be solved by a greedy joint-by-joint marching method. ' +
        'All remaining unsolved joints have 3 or more unknown forces, which requires solving the system of equations simultaneously.'
      );
    } else {
      messages.push('Method of joints could not progress because there are no joints with at most two unknown member forces remaining.');
    }
  }

  return {
    isSolved,
    memberForces,
    jointEquations,
    messages
  };
}
