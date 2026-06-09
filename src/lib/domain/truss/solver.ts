import type { TrussModel, TrussSolverResult } from './types';
import { validateTruss } from './validation';
import { solveSupportReactions } from './supportReactions';
import { identifyZeroForceMembers } from './zeroForceMembers';
import { solveMethodOfJoints } from './methodOfJoints';
import { checkJointEquilibrium } from './equilibriumCheck';
import { solveGlobalJointEquilibrium } from './globalEquilibriumSolver';

/**
 * Solve support reactions and member forces for a planar pin-jointed truss.
 * Coordinative public API wrapper that delegates to specialized sub-modules.
 */
export function solveTruss(truss: TrussModel): TrussSolverResult {
  const messages: string[] = [];

  // 1. Validation checks
  const valResult = validateTruss(truss);
  if (!valResult.isValid) {
    return {
      isSolved: false,
      determinacy: 'unstable',
      stability: 'unstable',
      reactions: {},
      memberForces: {},
      zeroForceMembers: [],
      jointEquations: [],
      messages: valResult.errors
    };
  }

  const { jointsMap } = valResult;
  messages.push('Sign convention: positive member force is tension; negative member force is compression.');

  // 2. Solve support reactions (Global Equilibrium)
  const supportResult = solveSupportReactions(truss, jointsMap);
  messages.push(...supportResult.messages);
  
  if (!supportResult.isSolved) {
    return {
      isSolved: false,
      determinacy: supportResult.determinacy,
      stability: supportResult.stability,
      reactions: supportResult.reactions,
      memberForces: {},
      zeroForceMembers: [],
      jointEquations: [],
      messages
    };
  }

  // 3. Zero-force member detection
  const zeroForceResult = identifyZeroForceMembers(truss, jointsMap);

  // 4. Solve member forces using Method of Joints (marching)
  const jointsResult = solveMethodOfJoints(
    truss,
    jointsMap,
    supportResult.reactions,
    supportResult.rxValues,
    supportResult.allReactionsList,
    zeroForceResult.zeroForceMembers
  );

  messages.push(...jointsResult.messages);

  // Populate any zero force messages
  for (const mId of zeroForceResult.zeroForceMembers) {
    const mObj = truss.members.find(mem => mem.id === mId);
    if (mObj) {
      messages.push(`[Zero-Force] Member "${mObj.label}": ${zeroForceResult.zeroForceExplanations.get(mId)}`);
    }
  }

  // 5. Verify equilibrium at all joints
  if (jointsResult.isSolved) {
    checkJointEquilibrium(
      truss,
      jointsMap,
      supportResult.reactions,
      supportResult.rxValues,
      supportResult.allReactionsList,
      jointsResult.memberForces,
      messages
    );
    return {
      isSolved: true,
      determinacy: supportResult.determinacy,
      stability: supportResult.stability,
      reactions: supportResult.reactions,
      memberForces: jointsResult.memberForces,
      zeroForceMembers: zeroForceResult.zeroForceMembers,
      jointEquations: jointsResult.jointEquations,
      messages,
      solverMethod: 'method_of_joints'
    };
  } else if (supportResult.determinacy === 'statically_determinate' && supportResult.stability === 'stable') {
    const globalResult = solveGlobalJointEquilibrium(truss, jointsMap);
    messages.push(...globalResult.messages);
    if (globalResult.status === 'solved') {
      const globalRxValues = supportResult.allReactionsList.map(reaction => globalResult.reactions[reaction.symbol] ?? 0);
      checkJointEquilibrium(
        truss,
        jointsMap,
        globalResult.reactions,
        globalRxValues,
        supportResult.allReactionsList,
        globalResult.memberForces,
        messages
      );
      return {
        isSolved: true,
        determinacy: supportResult.determinacy,
        stability: supportResult.stability,
        reactions: globalResult.reactions,
        memberForces: globalResult.memberForces,
        zeroForceMembers: zeroForceResult.zeroForceMembers,
        jointEquations: jointsResult.jointEquations,
        messages,
        solverMethod: 'simultaneous_joint_equilibrium_fallback',
        equationSystem: globalResult.equationSystem
      };
    }
  }

  return {
    isSolved: jointsResult.isSolved,
    determinacy: supportResult.determinacy,
    stability: supportResult.stability,
    reactions: supportResult.reactions,
    memberForces: jointsResult.memberForces,
    zeroForceMembers: zeroForceResult.zeroForceMembers,
    jointEquations: jointsResult.jointEquations,
    messages,
    solverMethod: 'method_of_joints'
  };
}
