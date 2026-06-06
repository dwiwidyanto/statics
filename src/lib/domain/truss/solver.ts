import type { TrussModel, TrussJoint, TrussMember, TrussJointLoad, TrussSolverResult } from './types';
import type { Support, Point, Reaction } from '../models/types';
import { getReactionsForSupport } from '../supports/support';
import { calculateMoment, getDistance } from '../geometry/vector2d';

/**
 * Solve support reactions and member forces for a planar pin-jointed truss.
 */
export function solveTruss(truss: TrussModel): TrussSolverResult {
  const messages: string[] = [];
  const reactions: Record<string, number> = {};
  const memberForces: Record<string, number> = {};
  const jointEquations: any[] = [];
  
  const joints = truss.joints;
  const members = truss.members;
  const supports = truss.supports;
  const loads = truss.loads;

  // 1. Validation checks
  if (!joints || joints.length === 0) {
    return {
      isSolved: false,
      determinacy: 'unstable',
      stability: 'unstable',
      reactions,
      memberForces,
      zeroForceMembers: [],
      jointEquations,
      messages: ['Truss has no joints.']
    };
  }

  // Check joint label duplicates
  const jointLabels = new Set<string>();
  for (const j of joints) {
    if (jointLabels.has(j.label)) {
      return {
        isSolved: false,
        determinacy: 'unstable',
        stability: 'unstable',
        reactions,
        memberForces,
        zeroForceMembers: [],
        jointEquations,
        messages: [`Duplicate joint label detected: "${j.label}".`]
      };
    }
    jointLabels.add(j.label);
  }

  // Check member label duplicates
  const memberLabels = new Set<string>();
  for (const m of members) {
    if (memberLabels.has(m.label)) {
      return {
        isSolved: false,
        determinacy: 'unstable',
        stability: 'unstable',
        reactions,
        memberForces,
        zeroForceMembers: [],
        jointEquations,
        messages: [`Duplicate member label detected: "${m.label}".`]
      };
    }
    memberLabels.add(m.label);
  }

  // Check members referencing unknown joints
  const jointsMap = new Map<string, TrussJoint>(joints.map(j => [j.id, j]));
  for (const m of members) {
    if (!jointsMap.has(m.jointA) || !jointsMap.has(m.jointB)) {
      return {
        isSolved: false,
        determinacy: 'unstable',
        stability: 'unstable',
        reactions,
        memberForces,
        zeroForceMembers: [],
        jointEquations,
        messages: [`Member "${m.label}" references unknown joint ID(s).`]
      };
    }

    const ja = jointsMap.get(m.jointA)!;
    const jb = jointsMap.get(m.jointB)!;
    const L = getDistance(ja.position, jb.position);
    if (L < 1e-5) {
      return {
        isSolved: false,
        determinacy: 'unstable',
        stability: 'unstable',
        reactions,
        memberForces,
        zeroForceMembers: [],
        jointEquations,
        messages: [`Member "${m.label}" has zero length.`]
      };
    }
  }

  // 2. Count support reaction components
  const allReactionsList: Reaction[] = [];
  for (const s of supports) {
    // Treat fixed supports at truss joints as pin supports (2 force reactions, no moment)
    const rawReactions = getReactionsForSupport(s);
    const filteredReactions = rawReactions.filter(r => r.type !== 'moment');
    if (rawReactions.some(r => r.type === 'moment')) {
      messages.push(`Fixed support at joint was treated as a pin support (moment reaction ignored).`);
    }
    allReactionsList.push(...filteredReactions);
  }

  const r = allReactionsList.length;
  const m = members.length;
  const j = joints.length;

  // 3. Determinacy classification
  const requiredEquations = 2 * j;
  const unknowns = m + r;
  let determinacy: 'statically_determinate' | 'statically_indeterminate' | 'unstable' = 'statically_determinate';
  let stability: 'stable' | 'unstable' = 'stable';

  if (unknowns < requiredEquations) {
    determinacy = 'unstable';
    stability = 'unstable';
    messages.push(`Truss is unstable: m + r (${unknowns}) < 2j (${requiredEquations}).`);
    return { isSolved: false, determinacy, stability, reactions, memberForces, zeroForceMembers: [], jointEquations, messages };
  } else if (unknowns > requiredEquations) {
    determinacy = 'statically_indeterminate';
    stability = 'stable';
    messages.push(`Truss is statically indeterminate: m + r (${unknowns}) > 2j (${requiredEquations}).`);
    return { isSolved: false, determinacy, stability, reactions, memberForces, zeroForceMembers: [], jointEquations, messages };
  }

  // 4. Solve support reactions (Global Equilibrium)
  if (r !== 3) {
    // If we have determinacy but r !== 3, we cannot solve it using standard 3-reaction rigid body solver
    determinacy = 'unstable';
    stability = 'unstable';
    messages.push(`Unsupported support arrangement: total reaction components r = ${r} (must be exactly 3).`);
    return { isSolved: false, determinacy, stability, reactions, memberForces, zeroForceMembers: [], jointEquations, messages };
  }

  // Calculate sum of loads
  let sumLoadFx = 0;
  let sumLoadFy = 0;
  let sumLoadMoment = 0;

  // Let's choose the position of the first support or first joint as pivot
  const pivot: Point = supports.length > 0 ? supports[0].position : joints[0].position;

  for (const load of loads) {
    const joint = jointsMap.get(load.jointId);
    if (!joint) continue;
    const rad = (load.angle * Math.PI) / 180;
    const fx = load.magnitude * Math.cos(rad);
    const fy = load.magnitude * Math.sin(rad);
    sumLoadFx += fx;
    sumLoadFy += fy;
    sumLoadMoment += calculateMoment({ x: fx, y: fy }, joint.position, pivot);
  }

  // Setup 3x3 matrix for reactions
  const A = [
    [allReactionsList[0].direction.x, allReactionsList[1].direction.x, allReactionsList[2].direction.x],
    [allReactionsList[0].direction.y, allReactionsList[1].direction.y, allReactionsList[2].direction.y],
    [
      calculateMoment(allReactionsList[0].direction, allReactionsList[0].position, pivot),
      calculateMoment(allReactionsList[1].direction, allReactionsList[1].position, pivot),
      calculateMoment(allReactionsList[2].direction, allReactionsList[2].position, pivot)
    ]
  ];

  const B = [-sumLoadFx, -sumLoadFy, -sumLoadMoment];

  // Cramer's rule solver for 3x3
  const detA = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1])
             - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0])
             + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

  if (Math.abs(detA) < 1e-5) {
    determinacy = 'unstable';
    stability = 'unstable';
    messages.push('Truss is geometrically unstable (reactions are parallel or concurrent).');
    return { isSolved: false, determinacy, stability, reactions, memberForces, zeroForceMembers: [], jointEquations, messages };
  }

  const solve3x3 = (colIndex: number): number => {
    const temp = A.map(row => [...row]);
    for (let i = 0; i < 3; i++) {
      temp[i][colIndex] = B[i];
    }
    const detTemp = temp[0][0] * (temp[1][1] * temp[2][2] - temp[1][2] * temp[2][1])
                  - temp[0][1] * (temp[1][0] * temp[2][2] - temp[1][2] * temp[2][0])
                  + temp[0][2] * (temp[1][0] * temp[2][1] - temp[1][1] * temp[2][0]);
    return detTemp / detA;
  };

  const rxValues = [solve3x3(0), solve3x3(1), solve3x3(2)];
  for (let i = 0; i < 3; i++) {
    reactions[allReactionsList[i].symbol] = Math.round(rxValues[i] * 100) / 100;
  }

  // 5. Zero-force member detection
  const zeroForce = new Set<string>();
  const zeroForceExplanations = new Map<string, string>();
  let foundNewZeroForce = true;

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
            zeroForce.add(m1.id);
            zeroForce.add(m2.id);
            zeroForceExplanations.set(m1.id, `Two non-collinear members (${m1.label}, ${m2.label}) meet at unloaded, unsupported joint ${joint.label}.`);
            zeroForceExplanations.set(m2.id, `Two non-collinear members (${m1.label}, ${m2.label}) meet at unloaded, unsupported joint ${joint.label}.`);
            foundNewZeroForce = true;
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
            zeroForce.add(m3.id);
            zeroForceExplanations.set(m3.id, `Three members meet at joint ${joint.label}, and two (${m1.label}, ${m2.label}) are collinear.`);
            foundNewZeroForce = true;
          } else if (Math.abs(cross23) < 1e-3) {
            // M2 and M3 are collinear, so M1 is zero-force
            zeroForce.add(m1.id);
            zeroForceExplanations.set(m1.id, `Three members meet at joint ${joint.label}, and two (${m2.label}, ${m3.label}) are collinear.`);
            foundNewZeroForce = true;
          } else if (Math.abs(cross13) < 1e-3) {
            // M1 and M3 are collinear, so M2 is zero-force
            zeroForce.add(m2.id);
            zeroForceExplanations.set(m2.id, `Three members meet at joint ${joint.label}, and two (${m1.label}, ${m3.label}) are collinear.`);
            foundNewZeroForce = true;
          }
        }
      }
    }
  }

  // Pre-fill zero force members into memberForces
  const zeroForceMembers = Array.from(zeroForce);
  for (const mId of zeroForceMembers) {
    memberForces[mId] = 0;
  }

  // 6. Solve member forces using Method of Joints (marching)
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
            const val = rxValues[allReactionsList.findIndex(r => r.symbol === rx.symbol)];
            const fx = val * rx.direction.x;
            const fy = val * rx.direction.y;
            F_known_x += fx;
            F_known_y += fy;

            if (Math.abs(fx) > 1e-3) loadTermsX.push(`${fx >= 0 ? '+' : ''}${fx.toFixed(0)} (${rx.symbol})`);
            if (Math.abs(fy) > 1e-3) loadTermsY.push(`${fy >= 0 ? '+' : ''}${fy.toFixed(0)} (${rx.symbol})`);
          }
        }

        // Solved members
        const solvedConn = conn.filter(m => solvedMembers.has(m.id));
        const memberTermsX: string[] = [];
        const memberTermsY: string[] = [];

        for (const m of solvedConn) {
          const otherId = m.jointA === joint.id ? m.jointB : m.jointA;
          const otherJoint = jointsMap.get(otherId)!;
          const dx = otherJoint.position.x - joint.position.x;
          const dy = otherJoint.position.y - joint.position.y;
          const L = Math.sqrt(dx*dx + dy*dy);
          const ux = dx / L;
          const uy = dy / L;

          const forceVal = memberForces[m.id];
          F_known_x += forceVal * ux;
          F_known_y += forceVal * uy;

          if (Math.abs(ux) > 1e-3) {
            memberTermsX.push(`${ux * forceVal >= 0 ? '+' : ''}${(ux * forceVal).toFixed(0)} (${m.label})`);
          }
          if (Math.abs(uy) > 1e-3) {
            memberTermsY.push(`${uy * forceVal >= 0 ? '+' : ''}${(uy * forceVal).toFixed(0)} (${m.label})`);
          }
        }

        if (unsolvedConn.length === 1) {
          // 1 unknown member force
          const m1 = unsolvedConn[0];
          const otherId = m1.jointA === joint.id ? m1.jointB : m1.jointA;
          const otherJoint = jointsMap.get(otherId)!;
          const dx = otherJoint.position.x - joint.position.x;
          const dy = otherJoint.position.y - joint.position.y;
          const L = Math.sqrt(dx*dx + dy*dy);
          const ux = dx / L;
          const uy = dy / L;

          let forceVal = 0;
          if (Math.abs(ux) > Math.abs(uy)) {
            forceVal = -F_known_x / ux;
          } else {
            forceVal = -F_known_y / uy;
          }

          memberForces[m1.id] = Math.round(forceVal * 100) / 100;
          solvedMembers.add(m1.id);
          solvedSomething = true;

          const eqX = `${m1.label} * (${ux.toFixed(2)}) ${memberTermsX.join(' ')} ${loadTermsX.join(' ')} = 0`;
          const eqY = `${m1.label} * (${uy.toFixed(2)}) ${memberTermsY.join(' ')} ${loadTermsY.join(' ')} = 0`;
          
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

          const getUnitVec = (jTarget: TrussJoint) => {
            const dx = jTarget.position.x - joint.position.x;
            const dy = jTarget.position.y - joint.position.y;
            const L = Math.sqrt(dx*dx + dy*dy);
            return { x: dx / L, y: dy / L };
          };

          const u1 = getUnitVec(j1);
          const u2 = getUnitVec(j2);

          const a = u1.x;
          const b = u2.x;
          const c = u1.y;
          const d = u2.y;
          const e = -F_known_x;
          const f = -F_known_y;

          const D = a * d - b * c;
          if (Math.abs(D) < 1e-5) {
            messages.push(`Collinear members ${m1.label} and ${m2.label} at joint ${joint.label} prevent solving.`);
            return { isSolved: false, determinacy, stability, reactions, memberForces, zeroForceMembers, jointEquations, messages };
          }

          const f1 = (e * d - b * f) / D;
          const f2 = (a * f - e * c) / D;

          memberForces[m1.id] = Math.round(f1 * 100) / 100;
          memberForces[m2.id] = Math.round(f2 * 100) / 100;

          solvedMembers.add(m1.id);
          solvedMembers.add(m2.id);
          solvedSomething = true;

          const eqX = `${m1.label} * (${u1.x.toFixed(2)}) + ${m2.label} * (${u2.x.toFixed(2)}) ${memberTermsX.join(' ')} ${loadTermsX.join(' ')} = 0`;
          const eqY = `${m1.label} * (${u1.y.toFixed(2)}) + ${m2.label} * (${u2.y.toFixed(2)}) ${memberTermsY.join(' ')} ${loadTermsY.join(' ')} = 0`;

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

  // Check if we solved all members
  const isSolved = solvedMembers.size === members.length;
  if (!isSolved) {
    messages.push('Method of joints could not progress because there are no joints with at most two unknown member forces remaining.');
  }

  // Populate any zero force messages
  for (const mId of zeroForceMembers) {
    const mObj = members.find(mem => mem.id === mId);
    if (mObj) {
      messages.push(`[Zero-Force] Member "${mObj.label}": ${zeroForceExplanations.get(mId)}`);
    }
  }

  // 7. Verify equilibrium at all joints
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
        const val = rxValues[allReactionsList.findIndex(r => r.symbol === rx.symbol)];
        fxSum += val * rx.direction.x;
        fySum += val * rx.direction.y;
      }
    }

    // Members
    for (const m of conn) {
      if (solvedMembers.has(m.id)) {
        const otherId = m.jointA === joint.id ? m.jointB : m.jointA;
        const otherJoint = jointsMap.get(otherId)!;
        const dx = otherJoint.position.x - joint.position.x;
        const dy = otherJoint.position.y - joint.position.y;
        const L = Math.sqrt(dx*dx + dy*dy);
        const ux = dx / L;
        const uy = dy / L;

        fxSum += memberForces[m.id] * ux;
        fySum += memberForces[m.id] * uy;
      }
    }

    if (Math.abs(fxSum) > 0.5 || Math.abs(fySum) > 0.5) {
      messages.push(`Warning: Joint ${joint.label} equilibrium check failed (Fx sum: ${fxSum.toFixed(2)}, Fy sum: ${fySum.toFixed(2)}).`);
    }
  }

  return {
    isSolved,
    determinacy,
    stability,
    reactions,
    memberForces,
    zeroForceMembers,
    jointEquations,
    messages
  };
}
